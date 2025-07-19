'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DocumentNotification {
  id: string;
  type: 'pending_approval' | 'document_uploaded' | 'approval_overdue' | 'version_updated' | 'document_expired';
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  document_id: string;
  document_name: string;
  project_id?: string;
  project_name?: string;
  created_at: string;
  is_read: boolean;
}

export interface DocumentStats {
  totalDocuments: number;
  pendingApproval: number;
  recentUploads: number;
  approvalOverdue: number;
  expiringSoon: number;
  versionUpdates: number;
  unreadNotifications: number;
}

export interface UseDocumentsNotificationsResult {
  stats: DocumentStats;
  notifications: DocumentNotification[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export function useDocumentsNotifications(): UseDocumentsNotificationsResult {
  const [stats, setStats] = useState<DocumentStats>({
    totalDocuments: 0,
    pendingApproval: 0,
    recentUploads: 0,
    approvalOverdue: 0,
    expiringSoon: 0,
    versionUpdates: 0,
    unreadNotifications: 0,
  });
  
  const [notifications, setNotifications] = useState<DocumentNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch documents data
      const response = await fetch('/api/documents');
      const result = await response.json();

      if (result.success) {
        // The API returns documents in result.data.documents, not result.data directly
        const documents = result.data?.documents || [];
        
        // Generate notifications based on document states
        const documentNotifications: DocumentNotification[] = [];
        const today = new Date();
        
        documents.forEach((doc: any) => {
          // Pending approval notifications
          if (doc.approval_status === 'pending') {
            const daysPending = Math.floor((today.getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60 * 24));
            
            documentNotifications.push({
              id: `approval-${doc.id}`,
              type: daysPending > 3 ? 'approval_overdue' : 'pending_approval',
              title: daysPending > 3 ? 'Approval Overdue' : 'Document Pending Approval',
              message: `${doc.document_name} ${daysPending > 3 ? 'has been pending for' : 'awaiting approval for'} ${daysPending} days`,
              priority: daysPending > 7 ? 'urgent' : daysPending > 3 ? 'high' : 'normal',
              document_id: doc.id,
              document_name: doc.document_name,
              project_id: doc.project_id,
              project_name: doc.projects?.project_name,
              created_at: doc.created_at,
              is_read: false,
            });
          }

          // Recent uploads (last 24 hours)
          const hoursAgo = Math.floor((today.getTime() - new Date(doc.created_at).getTime()) / (1000 * 60 * 60));
          if (hoursAgo <= 24 && doc.approval_status !== 'pending') {
            documentNotifications.push({
              id: `upload-${doc.id}`,
              type: 'document_uploaded',
              title: 'New Document Uploaded',
              message: `${doc.document_name} was uploaded`,
              priority: 'normal',
              document_id: doc.id,
              document_name: doc.document_name,
              project_id: doc.project_id,
              project_name: doc.projects?.project_name,
              created_at: doc.created_at,
              is_read: false,
            });
          }

          // Expiring documents (within 30 days)
          if (doc.expiry_date) {
            const expiryDate = new Date(doc.expiry_date);
            const daysUntilExpiry = Math.floor((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
              documentNotifications.push({
                id: `expiry-${doc.id}`,
                type: 'document_expired',
                title: 'Document Expiring Soon',
                message: `${doc.document_name} expires in ${daysUntilExpiry} days`,
                priority: daysUntilExpiry <= 7 ? 'urgent' : daysUntilExpiry <= 14 ? 'high' : 'normal',
                document_id: doc.id,
                document_name: doc.document_name,
                project_id: doc.project_id,
                project_name: doc.projects?.project_name,
                created_at: doc.created_at,
                is_read: false,
              });
            }
          }

          // Version updates (documents with version > 1.0)
          if (doc.version_number > 1.0 && hoursAgo <= 72) {
            documentNotifications.push({
              id: `version-${doc.id}`,
              type: 'version_updated',
              title: 'Document Updated',
              message: `${doc.document_name} was updated to version ${doc.version_number}`,
              priority: 'normal',
              document_id: doc.id,
              document_name: doc.document_name,
              project_id: doc.project_id,
              project_name: doc.projects?.project_name,
              created_at: doc.updated_at,
              is_read: false,
            });
          }
        });

        // Calculate stats
        const totalDocuments = documents.length;
        const pendingApproval = documents.filter((d: any) => d.approval_status === 'pending').length;
        const recentUploads = documentNotifications.filter(n => n.type === 'document_uploaded').length;
        const approvalOverdue = documentNotifications.filter(n => n.type === 'approval_overdue').length;
        const expiringSoon = documentNotifications.filter(n => n.type === 'document_expired').length;
        const versionUpdates = documentNotifications.filter(n => n.type === 'version_updated').length;

        setStats({
          totalDocuments,
          pendingApproval,
          recentUploads,
          approvalOverdue,
          expiringSoon,
          versionUpdates,
          unreadNotifications: documentNotifications.filter(n => !n.is_read).length,
        });

        console.log('🔍 Document notifications generated:', {
          total: documentNotifications.length,
          unread: documentNotifications.filter(n => !n.is_read).length,
          notifications: documentNotifications
        });

        setNotifications(documentNotifications);
      } else {
        setError(result.error || 'Failed to fetch documents data');
      }
    } catch (err) {
      setError('Network error loading documents data');
      console.error('Error fetching documents data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentsData();
  }, [fetchDocumentsData]);

  return {
    stats,
    notifications,
    loading,
    error,
    refreshData: fetchDocumentsData,
  };
} 