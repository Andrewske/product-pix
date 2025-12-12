// src/components/forms/upload-form.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload } from 'lucide-react';
import { IMAGE_CONFIG } from '@/lib/images';

interface UploadFormProps {
  onUploadComplete: (uploadId: string, previewUrl: string) => void;
  onError: (error: string) => void;
}

export function UploadForm({ onUploadComplete, onError }: UploadFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!IMAGE_CONFIG.allowedMimeTypes.includes(file.type as typeof IMAGE_CONFIG.allowedMimeTypes[number])) {
      return `Invalid file type. Allowed: ${IMAGE_CONFIG.allowedMimeTypes.join(', ')}`;
    }
    if (file.size > IMAGE_CONFIG.maxSizeBytes) {
      return `File too large. Maximum size: ${IMAGE_CONFIG.maxSizeBytes / 1024 / 1024}MB`;
    }
    if (file.size < IMAGE_CONFIG.minSizeBytes) {
      return 'File too small';
    }
    return null;
  };

  const uploadFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onError(validationError);
      return;
    }

    setUploading(true);

    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);

      // Get presigned URL
      const presignResponse = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!presignResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, fileKey } = await presignResponse.json();

      // Upload directly to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      // Confirm upload
      const confirmResponse = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileKey,
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Failed to confirm upload');
      }

      const { uploadId } = await confirmResponse.json();
      onUploadComplete(uploadId, previewUrl);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Upload failed');
      setPreview(null);
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete, onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      uploadFile(file);
    }
  }, [uploadFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200
        ${isDragging
          ? 'border-primary bg-primary/10'
          : 'border-border hover:border-input'
        }
        ${uploading ? 'pointer-events-none opacity-50' : ''}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={IMAGE_CONFIG.allowedMimeTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        <div className="space-y-4">
          <div className="relative max-h-64 mx-auto rounded-lg overflow-hidden">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-contain"
            />
          </div>
          {uploading && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-muted-foreground">Uploading...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground/60" />
          <div className="text-muted-foreground">
            <span className="font-medium">Click to upload or drag and drop</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your product photo will be transformed
          </p>
        </div>
      )}
    </div>
  );
}
