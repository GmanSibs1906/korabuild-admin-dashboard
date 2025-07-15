'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  milestoneId?: string | null;
  onUploadSuccess?: (photoData: any) => void;
}

interface UploadFile {
  file: File;
  preview: string;
  id: string;
}

const PHASE_CATEGORIES = [
  { value: 'site_preparation', label: 'Site Preparation' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'structure', label: 'Structure' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'interior', label: 'Interior' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'permits', label: 'Permits' },
  { value: 'general', label: 'General' },
];

const PHOTO_TYPES = [
  { value: 'progress', label: 'Progress Photo' },
  { value: 'before', label: 'Before Photo' },
  { value: 'after', label: 'After Photo' },
  { value: 'issue', label: 'Issue Photo' },
  { value: 'completion', label: 'Completion Photo' },
  { value: 'quality_check', label: 'Quality Check' },
];

export function PhotoUploadModal({
  isOpen,
  onClose,
  projectId,
  milestoneId,
  onUploadSuccess
}: PhotoUploadModalProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState({
    photoTitle: '',
    description: '',
    phaseCategory: 'general',
    photoType: 'progress'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setSuccess(null);
    
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(2)
    }));
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles.map(rejection => {
        const error = rejection.errors[0];
        if (error.code === 'file-too-large') {
          return `${rejection.file.name}: File too large (max 10MB)`;
        }
        if (error.code === 'file-invalid-type') {
          return `${rejection.file.name}: Invalid file type`;
        }
        return `${rejection.file.name}: ${error.message}`;
      });
      setError(errors.join(', '));
    }
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select at least one photo to upload');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    
    const uploadPromises = files.map(async (uploadFile) => {
      const formDataToSend = new FormData();
      formDataToSend.append('file', uploadFile.file);
      formDataToSend.append('projectId', projectId);
      if (milestoneId) {
        formDataToSend.append('milestoneId', milestoneId);
      }
      formDataToSend.append('photoTitle', formData.photoTitle || uploadFile.file.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('phaseCategory', formData.phaseCategory);
      formDataToSend.append('photoType', formData.photoType);
      formDataToSend.append('uploadedBy', 'admin'); // You might want to get actual admin user ID

      try {
        setUploadProgress(prev => ({ ...prev, [uploadFile.id]: 0 }));
        
        const response = await fetch('/api/projects/photos/upload', {
          method: 'POST',
          body: formDataToSend,
        });

        setUploadProgress(prev => ({ ...prev, [uploadFile.id]: 100 }));

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Upload failed');
        }

        const result = await response.json();
        return result.data;
      } catch (error) {
        console.error('Upload error:', error);
        setUploadProgress(prev => ({ ...prev, [uploadFile.id]: -1 }));
        throw error;
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      
      setSuccess(`Successfully uploaded ${results.length} photo${results.length > 1 ? 's' : ''}`);
      
      // Call success callback with uploaded photos
      if (onUploadSuccess) {
        results.forEach(result => onUploadSuccess(result));
      }

      // Reset form after successful upload
      setTimeout(() => {
        setFiles([]);
        setFormData({
          photoTitle: '',
          description: '',
          phaseCategory: 'general',
          photoType: 'progress'
        });
        setUploadProgress({});
        onClose();
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (!uploading) {
      // Clean up preview URLs
      files.forEach(file => URL.revokeObjectURL(file.preview));
      setFiles([]);
      setFormData({
        photoTitle: '',
        description: '',
        phaseCategory: 'general',
        photoType: 'progress'
      });
      setError(null);
      setSuccess(null);
      setUploadProgress({});
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-orange-500" />
            Upload Progress Photos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-orange-500 bg-orange-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-orange-600">Drop the photos here...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Drag & drop photos here, or click to select files
                </p>
                <p className="text-sm text-gray-500">
                  Supports: JPEG, PNG, WebP, GIF (max 10MB each)
                </p>
              </div>
            )}
          </div>

          {/* File Preview */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Selected Photos ({files.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {files.map((uploadFile) => (
                  <div key={uploadFile.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={uploadFile.preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Progress overlay */}
                    {uploadProgress[uploadFile.id] !== undefined && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                        {uploadProgress[uploadFile.id] === -1 ? (
                          <AlertCircle className="h-8 w-8 text-red-500" />
                        ) : uploadProgress[uploadFile.id] === 100 ? (
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : (
                          <div className="text-center text-white">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm">{uploadProgress[uploadFile.id]}%</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Remove button */}
                    {!uploading && (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    
                    <p className="text-xs text-gray-600 mt-1 truncate">
                      {uploadFile.file.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="photoTitle">Photo Title</Label>
              <Input
                id="photoTitle"
                placeholder="Enter photo title (optional)"
                value={formData.photoTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, photoTitle: e.target.value }))}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phaseCategory">Phase Category</Label>
              <Select
                value={formData.phaseCategory}
                onValueChange={(value) => setFormData(prev => ({ ...prev, phaseCategory: value }))}
                disabled={uploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select phase category" />
                </SelectTrigger>
                <SelectContent>
                  {PHASE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="photoType">Photo Type</Label>
              <Select
                value={formData.photoType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, photoType: value }))}
                disabled={uploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select photo type" />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter photo description (optional)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              disabled={uploading}
              rows={3}
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {files.length > 0 ? `${files.length} Photo${files.length > 1 ? 's' : ''}` : 'Photos'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
