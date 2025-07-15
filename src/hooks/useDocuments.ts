'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface Document {
  id: string;
  project_id: string;
  document_name: string;
  document_type: 'contract' | 'plan' | 'permit' | 'invoice' | 'receipt' | 'report' | 'specification' | 'change_order' | 'inspection' | 'certificate' | 'warranty' | 'manual' | 'photo' | 'other';
  category: string;
  file_url: string;
  file_size_bytes: number;
  file_type: string;
  version_number: number;
  is_current_version: boolean;
  description: string;
  tags: string[];
  uploaded_by: string;
  approved_by: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'revision_required' | 'archived';
  approval_date: string;
  is_public: boolean;
  download_count: number;
  last_viewed_at: string;
  expiry_date: string;
  created_at: string;
  updated_at: string;
  // Related data
  project?: {
    project_name: string;
    client_id: string;
  };
  uploader?: {
    full_name: string;
    email: string;
  };
  approver?: {
    full_name: string;
    email: string;
  };
}

export interface DocumentStats {
  totalDocuments: number;
  newDocuments: number;
  pendingApproval: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  documentsByType: Record<string, number>;
  documentsByStatus: Record<string, number>;
  recentUploads: number;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DocumentStats>({
    totalDocuments: 0,
    newDocuments: 0,
    pendingApproval: 0,
    approvedDocuments: 0,
    rejectedDocuments: 0,
    documentsByType: {},
    documentsByStatus: {},
    recentUploads: 0
  });

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch documents with related data
      const { data: documentsData, error: documentsError } = await supabase
        .from('documents')
        .select(`
          *,
          project:projects(project_name, client_id),
          uploader:users!documents_uploaded_by_fkey(full_name, email),
          approver:users!documents_approved_by_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (documentsError) throw documentsError;

      const docs = documentsData || [];
      setDocuments(docs);

      // Calculate statistics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const newDocuments = docs.filter(doc => 
        new Date(doc.created_at) > weekAgo
      ).length;

      const pendingApproval = docs.filter(doc => 
        doc.approval_status === 'pending'
      ).length;

      const approvedDocuments = docs.filter(doc => 
        doc.approval_status === 'approved'
      ).length;

      const rejectedDocuments = docs.filter(doc => 
        doc.approval_status === 'rejected'
      ).length;

      // Group by document type
      const documentsByType: Record<string, number> = {};
      docs.forEach(doc => {
        documentsByType[doc.document_type] = (documentsByType[doc.document_type] || 0) + 1;
      });

      // Group by approval status
      const documentsByStatus: Record<string, number> = {};
      docs.forEach(doc => {
        documentsByStatus[doc.approval_status] = (documentsByStatus[doc.approval_status] || 0) + 1;
      });

      const recentUploads = docs.filter(doc => 
        new Date(doc.created_at) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
      ).length;

      setStats({
        totalDocuments: docs.length,
        newDocuments,
        pendingApproval,
        approvedDocuments,
        rejectedDocuments,
        documentsByType,
        documentsByStatus,
        recentUploads
      });

    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();

    // Set up real-time subscription
    const subscription = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents'
        },
        (payload) => {
          console.log('Document change detected:', payload);
          fetchDocuments();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    documents,
    loading,
    error,
    stats,
    refetch: fetchDocuments
  };
}
