export interface Document {
  id: string;
  project_id: string | null;
  document_name: string;
  document_type: DocumentType;
  category: string;
  file_url: string;
  file_size_bytes: number | null;
  file_type: string | null;
  version_number: number;
  is_current_version: boolean;
  description: string | null;
  tags: string[] | null;
  uploaded_by: string | null;
  approved_by: string | null;
  approval_status: ApprovalStatus;
  approval_date: string | null;
  is_public: boolean;
  download_count: number;
  last_viewed_at: string | null;
  expiry_date: string | null;
  checksum: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Related data
  uploader?: {
    id: string;
    full_name: string;
    email: string;
  };
  approver?: {
    id: string;
    full_name: string;
    email: string;
  };
  project?: {
    id: string;
    project_name: string;
  };
}

export type DocumentType = 
  | 'contract'
  | 'plan'
  | 'permit'
  | 'invoice'
  | 'receipt'
  | 'report'
  | 'specification'
  | 'change_order'
  | 'inspection'
  | 'certificate'
  | 'warranty'
  | 'manual'
  | 'photo'
  | 'other';

export type ApprovalStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'revision_required'
  | 'archived';

export const DOCUMENT_TYPES: { value: DocumentType; label: string; icon: string }[] = [
  { value: 'contract', label: 'Contract', icon: 'FileContract' },
  { value: 'plan', label: 'Plan', icon: 'Blueprint' },
  { value: 'permit', label: 'Permit', icon: 'Shield' },
  { value: 'invoice', label: 'Invoice', icon: 'Receipt' },
  { value: 'receipt', label: 'Receipt', icon: 'CreditCard' },
  { value: 'report', label: 'Report', icon: 'FileBarChart' },
  { value: 'specification', label: 'Specification', icon: 'FileText' },
  { value: 'change_order', label: 'Change Order', icon: 'Edit' },
  { value: 'inspection', label: 'Inspection', icon: 'Search' },
  { value: 'certificate', label: 'Certificate', icon: 'Award' },
  { value: 'warranty', label: 'Warranty', icon: 'ShieldCheck' },
  { value: 'manual', label: 'Manual', icon: 'Book' },
  { value: 'photo', label: 'Photo', icon: 'Image' },
  { value: 'other', label: 'Other', icon: 'File' }
];

export const APPROVAL_STATUSES: { value: ApprovalStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
  { value: 'revision_required', label: 'Revision Required', color: 'bg-orange-100 text-orange-800' },
  { value: 'archived', label: 'Archived', color: 'bg-gray-100 text-gray-800' }
];

// API Request/Response Types
export interface DocumentsResponse {
  success: boolean;
  data: {
    documents: Document[];
    total: number;
    page: number;
    limit: number;
  };
  error?: string;
}

export interface DocumentFilters {
  project_id?: string;
  document_type?: DocumentType;
  approval_status?: ApprovalStatus;
  uploaded_by?: string;
  category?: string;
  search?: string;
  tags?: string[];
  start_date?: string;
  end_date?: string;
}

export interface DocumentSortOptions {
  field: 'created_at' | 'updated_at' | 'document_name' | 'file_size_bytes' | 'download_count';
  direction: 'asc' | 'desc';
}

export interface DocumentUploadData {
  project_id?: string;
  document_name: string;
  document_type: DocumentType;
  category: string;
  description?: string;
  tags?: string[];
  file: File;
  is_public?: boolean;
}

export interface DocumentUpdateData {
  document_name?: string;
  document_type?: DocumentType;
  category?: string;
  description?: string;
  tags?: string[];
  is_public?: boolean;
  approval_status?: ApprovalStatus;
  metadata?: Record<string, unknown>;
  last_viewed_at?: string;
}

// Hook Types
export interface UseDocumentsOptions {
  filters?: DocumentFilters;
  sort?: DocumentSortOptions;
  page?: number;
  limit?: number;
  autoRefetch?: boolean;
  refetchInterval?: number;
}

export interface UseDocumentsReturn {
  documents: Document[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  stats: DocumentStats;
  refetch: () => void;
  uploadDocument: (data: DocumentUploadData) => Promise<Document>;
  updateDocument: (id: string, data: DocumentUpdateData) => Promise<Document>;
  deleteDocument: (id: string) => Promise<void>;
  downloadDocument: (document: Document) => Promise<void>;
  viewDocument: (document: Document) => Promise<void>;
  getFilePreviewInfo: (document: Document) => FilePreviewInfo;
}

// Component Props
export interface DocumentsDataTableProps {
  documents: Document[];
  loading?: boolean;
  onView?: (document: Document) => void;
  onDownload?: (document: Document) => void;
  onEdit?: (document: Document) => void;
  onDelete?: (document: Document) => void;
  onApprove?: (document: Document) => void;
  onReject?: (document: Document) => void;
}

export interface DocumentViewerProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onOpenExternal?: () => void;
}

export interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (document: Document) => void;
  defaultProjectId?: string;
}

// Utility Types
export interface DocumentStats {
  totalDocuments: number;
  newDocuments: number;
  pendingApproval: number;
  approvedDocuments: number;
  rejectedDocuments: number;
  totalFileSize: number;
  documentsByType: Record<DocumentType, number>;
  recentUploads: number;
}

export interface FilePreviewInfo {
  canPreview: boolean;
  previewType: 'pdf' | 'image' | 'text' | 'unsupported';
  mimeType: string;
  fileExtension: string;
  openWithApp?: string;
} 