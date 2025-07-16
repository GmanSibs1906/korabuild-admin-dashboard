'use client';

import React, { useState } from 'react';
import { useDocuments } from '@/hooks/useDocuments';
import { Document, DocumentFilters, DocumentSortOptions } from '@/types/documents';
import { DocumentsDataTable } from '@/components/tables/DocumentsDataTable';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Upload, 
  Trash2,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';

export default function DocumentsPage() {
  const [filters, setFilters] = useState<DocumentFilters>({});
  const [sort, setSort] = useState<DocumentSortOptions>({
    field: 'created_at',
    direction: 'desc'
  });
  const [page, setPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);

  const {
    documents,
    total,
    loading,
    error,
    refetch,
    updateDocument,
    deleteDocument,
    downloadDocument,
    viewDocument
  } = useDocuments({
    filters,
    sort,
    page,
    limit: 10,
    autoRefetch: true,
    refetchInterval: 30000
  });

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalDocs = documents.length;
    const pending = documents.filter(doc => doc.approval_status === 'pending').length;
    const approved = documents.filter(doc => doc.approval_status === 'approved').length;
    const rejected = documents.filter(doc => doc.approval_status === 'rejected').length;
    const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size_bytes || 0), 0);

    return {
      totalDocs,
      pending,
      approved,
      rejected,
      totalSize: formatFileSize(totalSize)
    };
  }, [documents]);

  // Format file size helper
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Handle document actions
  const handleView = async (document: Document) => {
    setSelectedDocument(document);
    setViewerOpen(true);
    try {
      await viewDocument(document);
    } catch (error) {
      console.error('Failed to track document view:', error);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      await downloadDocument(document);
    } catch (error) {
      console.error('Download failed:', error);
      // You might want to show a toast notification here
    }
  };

  const handleApprove = async (document: Document) => {
    try {
      await updateDocument(document.id, {
        approval_status: 'approved'
      });
    } catch (error) {
      console.error('Failed to approve document:', error);
    }
  };

  const handleReject = async (document: Document) => {
    try {
      await updateDocument(document.id, {
        approval_status: 'rejected'
      });
    } catch (error) {
      console.error('Failed to reject document:', error);
    }
  };

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument(documentToDelete.id);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleFilter = (newFilters: DocumentFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filtering
  };

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSort({ field: field as DocumentSortOptions['field'], direction });
    setPage(1); // Reset to first page when sorting
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Failed to load documents</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={refetch} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
              <p className="mt-2 text-gray-600">
                Manage and view all project documents, contracts, and files
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                onClick={refetch}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <Button className="bg-orange-500 hover:bg-orange-600 text-orange-50">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocs}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSize} total size
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
                Ready for use
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <X className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">
                Need revision
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>All Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentsDataTable
              documents={documents}
              loading={loading}
              onView={handleView}
              onDownload={handleDownload}
              onDelete={handleDeleteClick}
              onApprove={handleApprove}
              onReject={handleReject}
              onFilter={handleFilter}
              onSort={handleSort}
            />
          </CardContent>
        </Card>

        {/* Document Viewer Dialog */}
        <DocumentViewer
          document={selectedDocument}
          isOpen={viewerOpen}
          onClose={() => {
            setViewerOpen(false);
            setSelectedDocument(null);
          }}
          onDownload={() => selectedDocument && handleDownload(selectedDocument)}
          onOpenExternal={() => {
            if (selectedDocument) {
              window.open(selectedDocument.file_url, '_blank', 'noopener,noreferrer');
            }
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{documentToDelete?.document_name}"? 
                This action cannot be undone and will permanently remove the document and its file.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-500 hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Document
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
