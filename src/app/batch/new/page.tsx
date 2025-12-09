// src/app/batch/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CSVUploadForm, BatchPreview } from '@/components/batch';
import type { ParsedBatchItem, ParseError } from '@/components/batch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCredits } from '@/lib/auth';
import Link from 'next/link';

type Step = 'upload' | 'preview' | 'creating';

export default function NewBatchPage() {
  const router = useRouter();
  const { credits } = useCredits();
  const [step, setStep] = useState<Step>('upload');
  const [items, setItems] = useState<ParsedBatchItem[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [batchName, setBatchName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const handleParsed = (parsedItems: ParsedBatchItem[], parsedErrors: ParseError[]) => {
    setItems(parsedItems);
    setErrors(parsedErrors);
    if (parsedItems.length > 0 && parsedErrors.length === 0) {
      setStep('preview');
    }
  };

  const handleConfirm = async () => {
    if (items.length === 0 || errors.length > 0) {
      return;
    }

    // Calculate credits
    const creditsPerItem = { '1k': 1, '2k': 2, '4k': 3 } as const;
    const totalCredits = items.reduce(
      (sum, item) => sum + creditsPerItem[item.resolution || '1k'],
      0
    );

    if (credits < totalCredits) {
      setCreateError(`Insufficient credits. Need ${totalCredits}, have ${credits}`);
      return;
    }

    setCreating(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: batchName || `Batch ${new Date().toLocaleDateString()}`,
          items,
          parameters: {},
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create batch');
      }

      // Redirect to batch detail page
      router.push(`/batch/${data.batchId}`);
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create batch');
      setCreating(false);
    }
  };

  const handleCancel = () => {
    setStep('upload');
    setItems([]);
    setErrors([]);
    setBatchName('');
    setCreateError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/batch" className="text-muted-foreground hover:text-foreground text-sm">
          ← Back to Batches
        </Link>
        <h1 className="text-3xl font-bold mt-4">Create New Batch</h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV file with up to 100 product items to generate images in batch
        </p>
      </div>

      <div className="space-y-6">
        {step === 'upload' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Step 1: Upload CSV File</h2>
              <CSVUploadForm onParsed={handleParsed} onError={setCreateError} />
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium mb-2">CSV Format:</p>
                <p className="font-mono text-xs bg-muted p-2 rounded">
                  product_name,prompt,source_image_url,aspect_ratio,resolution
                </p>
                <p className="mt-2">
                  All fields except <code className="bg-muted px-1 rounded">prompt</code> are optional.
                  Defaults: aspect_ratio=1:1, resolution=1k
                </p>
                <div className="mt-3">
                  <a
                    href="/templates/batch-template.csv"
                    download
                    className="text-primary hover:underline text-sm"
                  >
                    Download CSV Template →
                  </a>
                </div>
              </div>
            </Card>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Step 2: Review & Configure</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Batch Name (optional)
                  </label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="My Product Batch"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <BatchPreview
                  items={items}
                  errors={errors}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  loading={creating}
                />
              </div>
            </Card>
          </div>
        )}

        {createError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
            {createError}
          </div>
        )}
      </div>
    </div>
  );
}

