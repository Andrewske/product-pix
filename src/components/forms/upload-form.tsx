// src/components/forms/upload-form.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
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

  const uploadFile = async (file: File) => {
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

      const { uploadUrl, fileKey, publicUrl } = await presignResponse.json();

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
  };

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
  }, []);

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
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 hover:border-gray-400'
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
          <img
            src={preview}
            alt="Preview"
            className="max-h-64 mx-auto rounded-lg"
          />
          {uploading && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              <span className="text-gray-600">Uploading...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="text-gray-600">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG, WebP up to 10MB
          </p>
        </div>
      )}
    </div>
  );
}
