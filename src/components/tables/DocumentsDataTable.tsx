'use client';

import React, { useState } from 'react';
import { 
  Document, 
  DocumentType, 
  ApprovalStatus,
  DOCUMENT_TYPES,
  APPROVAL_STATUSES 
} from '@/types/documents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  MoreHorizontal,
  Eye,
  Download,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  Filter,
  Search,
  Calendar,
  User,
  Building,
  Tag,
  Check,
  X,
  Clock,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentsDataTableProps {
  documents: Document[];
  loading?: boolean;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onApprove?: (document: Document) => void;
  onReject?: (document: Document) => void;
  onFilter?: (filters: any) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
}

export function DocumentsDataTable({
  documents,
  loading = false,
  onView,
  onDownload,
  onEdit,
  onDelete,
  onApprove,
  onReject,
  onFilter,
  onSort
}: DocumentsDataTableProps) {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    document_type: '',
    approval_status: '',
    project_id: '',
    category: ''
  });

  // Format file size
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get document type icon and label
  const getDocumentTypeInfo = (type: DocumentType) => {
    return DOCUMENT_TYPES.find(t => t.value === type) || DOCUMENT_TYPES.find(t => t.value === 'other')!;
  };

  // Get approval status badge
  const getApprovalStatusBadge = (status: ApprovalStatus) => {
    const statusInfo = APPROVAL_STATUSES.find(s => s.value === status);
    if (!statusInfo) return null;

    const icons = {
      pending: Clock,
      approved: Check,
      rejected: X,
      revision_required: AlertCircle,
      archived: FileText
    };

    const Icon = icons[status];

    return (
      <Badge className={cn('flex items-center space-x-1', statusInfo.color)}>
        <Icon className="h-3 w-3" />
        <span>{statusInfo.label}</span>
      </Badge>
    );
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  // Handle action clicks
  const handleView = (document: Document) => {
    setSelectedDocument(document);
    onView?.(document);
  };

  const handleDownload = async (document: Document) => {
    try {
      await onDownload?.(document);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleOpenExternal = (document: Document) => {
    window.open(document.file_url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search documents..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        </div>

        <div className="text-sm text-gray-600">
          {documents.length} document{documents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Document Type
              </label>
              <Select
                value={filters.document_type}
                onValueChange={(value) => handleFilterChange('document_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {DOCUMENT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Approval Status
              </label>
              <Select
                value={filters.approval_status}
                onValueChange={(value) => handleFilterChange('approval_status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {APPROVAL_STATUSES.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Category
              </label>
              <Input
                placeholder="Enter category..."
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  const emptyFilters = {
                    search: '',
                    document_type: '',
                    approval_status: '',
                    project_id: '',
                    category: ''
                  };
                  setFilters(emptyFilters);
                  onFilter?.(emptyFilters);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Document</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Uploaded By</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center space-y-2">
                    <FileText className="h-12 w-12 text-gray-400" />
                    <p className="text-gray-600">No documents found</p>
                    <p className="text-sm text-gray-500">
                      Try adjusting your search or filters
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((document) => {
                const typeInfo = getDocumentTypeInfo(document.document_type);
                
                return (
                  <TableRow key={document.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <FileText className="h-8 w-8 text-orange-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-900 truncate">
                            {document.document_name}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            {document.category}
                          </p>
                          {document.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {document.description}
                            </p>
                          )}
                          {document.tags && document.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {document.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs border-orange-300 text-orange-600"
                                >
                                  <Tag className="h-2 w-2 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {document.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs border-orange-300 text-orange-600">
                                  +{document.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="flex items-center space-x-1 border-orange-300 text-orange-600">
                        <span>{typeInfo.label}</span>
                      </Badge>
                    </TableCell>

                    <TableCell>
                      {document.project ? (
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{document.project.project_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No project</span>
                      )}
                    </TableCell>

                    <TableCell>
                      {getApprovalStatusBadge(document.approval_status)}
                    </TableCell>

                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatFileSize(document.file_size_bytes)}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(document.created_at)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {document.uploader ? (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {document.uploader.full_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Unknown</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(document)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownload(document)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenExternal(document)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open External
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {onEdit && (
                            <DropdownMenuItem onClick={() => onEdit(document)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {onApprove && document.approval_status === 'pending' && (
                            <DropdownMenuItem onClick={() => onApprove(document)}>
                              <Check className="h-4 w-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {onReject && document.approval_status === 'pending' && (
                            <DropdownMenuItem onClick={() => onReject(document)}>
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </DropdownMenuItem>
                          )}
                          {onDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => onDelete(document)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 