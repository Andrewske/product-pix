// src/components/batch/csv-upload-form.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export interface ParsedBatchItem {
  product_name?: string;
  template_slug: string;
  source_image_url?: string;
  aspect_ratio: '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9';
  resolution: '1k' | '2k' | '4k';
  sequence: number;
}

export interface ParseError {
  line: number;
  errors: Array<{ path: string[]; message: string }>;
}

interface CSVUploadFormProps {
  onParsed: (items: ParsedBatchItem[], errors: ParseError[]) => void;
  onError: (error: string) => void;
}

export function CSVUploadForm({ onParsed, onError }: CSVUploadFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      onError('Please upload a CSV file');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/batch/parse-csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to parse CSV');
      }

      const data = await response.json();
      onParsed(data.items || [], data.errors || []);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Failed to parse CSV');
    } finally {
      setUploading(false);
    }
  }, [onParsed, onError]);

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
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-300 overflow-hidden matte-card
        ${isDragging
          ? 'border-primary bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 shadow-2xl scale-[1.02]'
          : 'border-border hover:border-primary/50 hover:shadow-xl'
        }
        ${uploading ? 'pointer-events-none opacity-50' : ''}
      `}
    >
      {/* Studio Lighting Overlay */}
      <div className={`
        absolute inset-0 rounded-2xl transition-opacity duration-300
        ${isDragging
          ? 'opacity-100'
          : 'opacity-0 hover:opacity-30'
        }
        bg-gradient-to-br from-primary/10 via-transparent to-primary/5
      `} />

      {/* Spotlight Effect */}
      {isDragging && (
        <div className="absolute inset-0 rounded-2xl opacity-60 bg-gradient-to-br from-primary/20 via-transparent to-transparent animate-pulse" />
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="relative z-10 space-y-4">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-primary"
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
        </div>
        <div>
          <p className="text-lg font-medium text-foreground mb-1">
            Upload CSV File
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium text-primary">Click to browse</span> or drag and drop
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          CSV file with up to 100 product items
        </p>
        {uploading && (
          <div className="flex items-center justify-center space-x-3 mt-6">
            <LoadingSpinner size="md" />
            <span className="text-muted-foreground font-medium">Parsing CSV...</span>
          </div>
        )}
      </div>
    </div>
  );
}

