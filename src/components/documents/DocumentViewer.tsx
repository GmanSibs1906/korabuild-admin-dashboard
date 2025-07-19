'use client';

import React, { useState, useEffect } from 'react';
import { Document } from '@/types/documents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Download,
  ExternalLink,
  FileText,
  AlertCircle,
  Monitor,
  Tag,
  Calendar,
  User,
  Building,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentViewerProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  onOpenExternal?: () => void;
}

export function DocumentViewer({
  document,
  isOpen,
  onClose,
  onDownload,
  onOpenExternal
}: DocumentViewerProps) {
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset states when document changes
  useEffect(() => {
    setPreviewError(null);
    setImageLoaded(false);
  }, [document?.id]);

  if (!document) return null;

  // Determine if document can be previewed
  const getPreviewCapability = () => {
    const fileExtension = document.file_url.split('.').pop()?.toLowerCase() || '';
    const mimeType = document.file_type || '';

    if (fileExtension === 'pdf' || mimeType.includes('pdf')) {
      return { canPreview: true, type: 'pdf', app: 'PDF Viewer / Adobe Acrobat' };
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension) || 
        mimeType.startsWith('image/')) {
      return { canPreview: true, type: 'image', app: 'Image Viewer / Photos' };
    }
    if (['txt', 'csv', 'json', 'xml'].includes(fileExtension) || 
        mimeType.startsWith('text/')) {
      return { canPreview: true, type: 'text', app: 'Text Editor' };
    }
    if (['doc', 'docx'].includes(fileExtension)) {
      return { canPreview: false, type: 'document', app: 'Microsoft Word' };
    }
    if (['xls', 'xlsx'].includes(fileExtension)) {
      return { canPreview: false, type: 'spreadsheet', app: 'Microsoft Excel' };
    }
    if (['ppt', 'pptx'].includes(fileExtension)) {
      return { canPreview: false, type: 'presentation', app: 'Microsoft PowerPoint' };
    }
    if (['dwg', 'dxf'].includes(fileExtension)) {
      return { canPreview: false, type: 'cad', app: 'AutoCAD / CAD Viewer' };
    }
    
    return { canPreview: false, type: 'unknown', app: 'Default System App' };
  };

  const previewInfo = getPreviewCapability();

  // Format file size
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle external app opening
  const handleOpenExternal = () => {
    // First try to download and open with system default
    const link = window.document.createElement('a');
    link.href = document.file_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    
    // For non-previewable files, suggest download and manual opening
    if (!previewInfo.canPreview) {
      link.download = document.document_name;
    }
    
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    
    onOpenExternal?.();
  };

  // Handle download
  const handleDownload = () => {
    const link = window.document.createElement('a');
    link.href = document.file_url;
    link.download = document.document_name;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    
    onDownload?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 border-b pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-orange-600 mb-2">
                {document.document_name}
              </DialogTitle>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-orange-500">
                <div className="flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>{document.document_type}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <HardDrive className="h-4 w-4" />
                  <span>{formatFileSize(document.file_size_bytes)}</span>
                </div>
                {document.project && (
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>{document.project.project_name}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>Download</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenExternal}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Open with {previewInfo.app}</span>
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Document Metadata */}
        <div className="flex-shrink-0 bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-orange-600 mb-1">Category</div>
              <div className="text-sm text-orange-500">{document.category}</div>
            </div>
            
            {document.uploader && (
              <div>
                <div className="text-sm font-medium text-orange-600 mb-1">Uploaded By</div>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-orange-400" />
                  <span className="text-sm text-orange-500">{document.uploader.full_name}</span>
                </div>
              </div>
            )}
            
            <div>
              <div className="text-sm font-medium text-orange-600 mb-1">Uploaded</div>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-orange-400" />
                <span className="text-sm text-orange-500">{formatDate(document.created_at)}</span>
              </div>
            </div>
          </div>

          {document.description && (
            <div>
              <div className="text-sm font-medium text-orange-600 mb-1">Description</div>
              <div className="text-sm text-orange-500">{document.description}</div>
            </div>
          )}

          {document.tags && document.tags.length > 0 && (
            <div>
              <div className="text-sm font-medium text-orange-600 mb-2">Tags</div>
              <div className="flex flex-wrap gap-2">
                {document.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-orange-300 text-orange-600">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Document Preview */}
        <div className="flex-1 min-h-0 bg-white border rounded-lg overflow-hidden">
          {previewInfo.canPreview ? (
            <div className="h-full">
              {previewInfo.type === 'pdf' && (
                <div className="h-full">
                  <iframe
                    src={`${document.file_url}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full border-0"
                    title={document.document_name}
                    onLoad={() => {}}
                    onError={() => {
                      setPreviewError('Failed to load PDF preview');
                    }}
                  />
                </div>
              )}
              
              {previewInfo.type === 'image' && (
                <div className="h-full flex items-center justify-center bg-gray-50">
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <LoadingSpinner />
                    </div>
                  )}
                  <img
                    src={document.file_url}
                    alt={document.document_name}
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => {
                      setImageLoaded(false);
                      setPreviewError('Failed to load image');
                    }}
                    style={{ display: imageLoaded ? 'block' : 'none' }}
                  />
                  {previewError && (
                    <div className="text-center p-8">
                      <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">{previewError}</p>
                    </div>
                  )}
                </div>
              )}

              {previewInfo.type === 'text' && (
                <div className="h-full">
                  <iframe
                    src={document.file_url}
                    className="w-full h-full border-0 bg-white"
                    title={document.document_name}
                  />
                </div>
              )}
            </div>
          ) : (
            // Non-previewable files
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center p-8 max-w-md">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Preview not available
                </h3>
                <p className="text-gray-600 mb-6">
                  This file type cannot be previewed in the browser. 
                  Click "Open with {previewInfo.app}" to view it in the appropriate application.
                </p>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleOpenExternal}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-orange-50"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open with {previewInfo.app}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>

                <div className="mt-6 text-xs text-gray-500">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Monitor className="h-3 w-3" />
                      <span>Opens with system default app</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 