// src/components/batch/csv-upload-form.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';

export interface ParsedBatchItem {
  product_name?: string;
  prompt: string;
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

  const uploadFile = async (file: File) => {
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
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="space-y-2">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground/60"
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
        <div className="text-muted-foreground">
          <span className="font-medium text-primary">Click to upload</span> or drag and drop
        </div>
        <p className="text-xs text-muted-foreground">
          CSV file (max 100 items)
        </p>
        {uploading && (
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Parsing CSV...</span>
          </div>
        )}
      </div>
    </div>
  );
}

