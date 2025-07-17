'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Document, 
  DocumentUploadData, 
  DocumentUpdateData,
  UseDocumentsOptions,
  UseDocumentsReturn,
  FilePreviewInfo
} from '@/types/documents';

export function useDocuments(options: UseDocumentsOptions = {}): UseDocumentsReturn {
  const {
    filters = {},
    sort = { field: 'created_at', direction: 'desc' },
    page = 1,
    limit = 10,
    autoRefetch = true,
    refetchInterval = 30000
  } = options;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(page);
  const [currentLimit, setCurrentLimit] = useState(limit);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Build query parameters - memoized to prevent infinite loops
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    params.set('page', currentPage.toString());
    params.set('limit', currentLimit.toString());
    params.set('sort_field', sort.field);
    params.set('sort_direction', sort.direction);

    if (filters.search) params.set('search', filters.search);
    if (filters.project_id) params.set('project_id', filters.project_id);
    if (filters.document_type) params.set('document_type', filters.document_type);
    if (filters.approval_status) params.set('approval_status', filters.approval_status);
    if (filters.uploaded_by) params.set('uploaded_by', filters.uploaded_by);
    if (filters.category) params.set('category', filters.category);
    if (filters.tags?.length) params.set('tags', filters.tags.join(','));
    if (filters.start_date) params.set('start_date', filters.start_date);
    if (filters.end_date) params.set('end_date', filters.end_date);

    return params.toString();
  }, [
    currentPage, 
    currentLimit, 
    sort.field, 
    sort.direction,
    filters.search,
    filters.project_id,
    filters.document_type,
    filters.approval_status,
    filters.uploaded_by,
    filters.category,
    filters.tags?.join(','),
    filters.start_date,
    filters.end_date
  ]);

  // Fetch documents
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = buildQueryParams();
      const response = await fetch(`/api/documents?${queryParams}`);
      const result = await response.json();

      if (result.success) {
        setDocuments(result.data.documents);
        setTotal(result.data.total);
        setCurrentPage(result.data.page);
        setCurrentLimit(result.data.limit);
      } else {
        throw new Error(result.error || 'Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      setDocuments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams]);

  // Upload document
  const uploadDocument = useCallback(async (data: DocumentUploadData): Promise<Document> => {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('document_name', data.document_name);
    formData.append('document_type', data.document_type);
    formData.append('category', data.category);
    
    if (data.project_id) formData.append('project_id', data.project_id);
    if (data.description) formData.append('description', data.description);
    if (data.tags?.length) formData.append('tags', data.tags.join(','));
    if (data.is_public !== undefined) formData.append('is_public', data.is_public.toString());

    const response = await fetch('/api/documents', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to upload document');
    }

    // Refresh documents list
    await fetchDocuments();

    return result.data;
  }, [fetchDocuments]);

  // Update document
  const updateDocument = useCallback(async (id: string, data: DocumentUpdateData): Promise<Document> => {
    const response = await fetch(`/api/documents?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to update document');
    }

    // Update local state
    setDocuments(prev => prev.map(doc => 
      doc.id === id ? result.data : doc
    ));

    return result.data;
  }, []);

  // Delete document
  const deleteDocument = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/documents?id=${id}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete document');
    }

    // Remove from local state
    setDocuments(prev => prev.filter(doc => doc.id !== id));
    setTotal(prev => prev - 1);
  }, []);

  // Get file preview info
  const getFilePreviewInfo = useCallback((document: Document): FilePreviewInfo => {
    const fileExtension = document.file_url.split('.').pop()?.toLowerCase() || '';
    const mimeType = document.file_type || '';

    let canPreview = false;
    let previewType: FilePreviewInfo['previewType'] = 'unsupported';
    let openWithApp: string | undefined;

    // PDF files
    if (fileExtension === 'pdf' || mimeType.includes('pdf')) {
      canPreview = true;
      previewType = 'pdf';
      openWithApp = 'PDF Viewer / Adobe Acrobat';
    }
    // Image files
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension) || 
             mimeType.startsWith('image/')) {
      canPreview = true;
      previewType = 'image';
      openWithApp = 'Image Viewer / Photos';
    }
    // Text files
    else if (['txt', 'csv', 'json', 'xml'].includes(fileExtension) || 
             mimeType.startsWith('text/')) {
      canPreview = true;
      previewType = 'text';
      openWithApp = 'Text Editor';
    }
    // Office documents
    else if (['doc', 'docx'].includes(fileExtension)) {
      openWithApp = 'Microsoft Word';
    }
    else if (['xls', 'xlsx'].includes(fileExtension)) {
      openWithApp = 'Microsoft Excel';
    }
    else if (['ppt', 'pptx'].includes(fileExtension)) {
      openWithApp = 'Microsoft PowerPoint';
    }
    // CAD files
    else if (['dwg', 'dxf'].includes(fileExtension)) {
      openWithApp = 'AutoCAD / CAD Viewer';
    }

    return {
      canPreview,
      previewType,
      mimeType,
      fileExtension,
      openWithApp
    };
  }, []);

  // Download document
  const downloadDocument = useCallback(async (document: Document): Promise<void> => {
    try {
      // Increment download count and update metadata
      const updatedMetadata = {
        ...document.metadata,
        download_count: (document.download_count || 0) + 1,
        last_downloaded: new Date().toISOString()
      };

      await updateDocument(document.id, { 
        metadata: updatedMetadata
      });

      // Create download link
      const link = window.document.createElement('a');
      link.href = document.file_url;
      link.download = document.document_name;
      link.target = '_blank';
      
      // Trigger download
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
      throw error;
    }
  }, [updateDocument]);

  // View document
  const viewDocument = useCallback(async (document: Document): Promise<void> => {
    try {
      // Update last viewed timestamp
      await updateDocument(document.id, {
        last_viewed_at: new Date().toISOString()
      });

      // Open in new tab/window
      window.open(document.file_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error viewing document:', error);
      throw error;
    }
  }, [updateDocument]);

  // Calculate document statistics with useMemo to prevent infinite re-renders
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const newDocuments = documents.filter(doc => 
      new Date(doc.created_at) >= thirtyDaysAgo
    ).length;
    
    const pendingApproval = documents.filter(doc => 
      doc.approval_status === 'pending'
    ).length;
    
    const approvedDocuments = documents.filter(doc => 
      doc.approval_status === 'approved'
    ).length;
    
    const rejectedDocuments = documents.filter(doc => 
      doc.approval_status === 'rejected'
    ).length;
    
    const totalFileSize = documents.reduce((total, doc) => 
      total + (doc.file_size_bytes || 0), 0
    );
    
    const recentUploads = documents.filter(doc => 
      new Date(doc.created_at) >= sevenDaysAgo
    ).length;
    
    // Count documents by type
    const documentsByType: Record<string, number> = {};
    documents.forEach(doc => {
      documentsByType[doc.document_type] = (documentsByType[doc.document_type] || 0) + 1;
    });
    
    return {
      totalDocuments: documents.length,
      newDocuments,
      pendingApproval,
      approvedDocuments,
      rejectedDocuments,
      totalFileSize,
      documentsByType,
      recentUploads
    };
  }, [documents]);

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Auto-refetch
  useEffect(() => {
    if (!autoRefetch) return;

    const interval = setInterval(fetchDocuments, refetchInterval);
    return () => clearInterval(interval);
  }, [autoRefetch, refetchInterval, fetchDocuments]);

  return {
    documents,
    total,
    page: currentPage,
    limit: currentLimit,
    loading,
    error,
    stats,
    refetch: fetchDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
    downloadDocument,
    viewDocument,
    getFilePreviewInfo
  };
}
