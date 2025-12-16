// src/app/batch/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CSVUploadForm, BatchPreview } from '@/components/batch';
import type { ParsedBatchItem, ParseError } from '@/components/batch';
import { Card } from '@/components/ui/card';
import { StepIndicator } from '@/components/ui/step-indicator';
import { PageContainer } from '@/components/layout/page-container';
import { useCredits, useUserProfile } from '@/lib/auth';
import { trackEvent } from '@/lib/analytics/client';
import Link from 'next/link';

type Step = 'upload' | 'preview' | 'creating';

export default function NewBatchPage() {
  const router = useRouter();
  const { credits } = useCredits();
  const { user } = useUserProfile();
  const [step, setStep] = useState<Step>('upload');
  const [items, setItems] = useState<ParsedBatchItem[]>([]);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [batchName, setBatchName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Calculate credit cost for summary
  const creditsPerItem = { '1k': 1, '2k': 2, '4k': 3 } as const;
  const totalCredits = items.reduce(
    (sum, item) => sum + creditsPerItem[item.resolution || '1k'],
    0
  );

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

      if (credits < totalCredits) {
        trackEvent({
          event: 'insufficient_credits',
          properties: {
            user_id: user?.id || '',
            required_credits: totalCredits,
            available_credits: credits,
            operation_type: 'batch',
          },
        });

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

      trackEvent({
        event: 'batch_created',
        properties: {
          batch_id: data.batchId,
          user_id: user?.id || '',
          template_slug: '',
          item_count: items.length,
          estimated_credits: totalCredits,
        },
      });

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
    <PageContainer>
      <div className="mb-8">
        <Link href="/batch" className="text-muted-foreground hover:text-foreground text-sm">
          ← Back to Batches
        </Link>
        <h1 className="text-3xl font-bold mt-4">Create New Batch</h1>
        <p className="text-muted-foreground mt-2">
          Upload a CSV file with up to 100 product items to generate images in batch
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator currentStep={step} className="mb-12" />

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
           {step === 'upload' && (
             <Card  className="p-6">
               <h2 className="text-xl font-semibold font-display mb-4">Upload CSV File</h2>
              <CSVUploadForm onParsed={handleParsed} onError={setCreateError} />
               <div className="mt-8 space-y-4">
                 <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                   <h3 className="font-semibold text-foreground mb-3">CSV Format Requirements</h3>
                   <div className="font-mono text-sm bg-background p-3 rounded-lg border mb-3">
                     product_name,prompt,source_image_url,aspect_ratio,resolution
                   </div>
                   <div className="space-y-2 text-sm text-muted-foreground">
                     <p>
                       <strong className="text-foreground">Required:</strong> <code className="bg-muted px-1 rounded text-xs">prompt</code> - Your product description
                     </p>
                     <p>
                       <strong className="text-foreground">Optional:</strong> All other fields. Defaults: aspect_ratio=1:1, resolution=1k
                     </p>
                     <p>
                       <strong className="text-foreground">Supported ratios:</strong> 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
                     </p>
                     <p>
                       <strong className="text-foreground">Supported resolutions:</strong> 1k, 2k, 4k
                     </p>
                   </div>
                 </div>

                 <div className="flex items-center justify-center">
                   <a
                     href="/templates/batch-template.csv"
                     download
                     className="inline-flex items-center space-x-2 text-primary hover:text-primary/80 font-medium transition-colors"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                     </svg>
                     <span>Download CSV Template</span>
                   </a>
                 </div>
                </div>
             </Card>
          )}

           {step === 'preview' && (
             <Card  className="p-6">
               <h2 className="text-xl font-semibold font-display mb-4">Review & Configure</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Batch Name (optional)
                  </label>
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="My Product Batch"
                    className="w-full px-3 py-2 border rounded-md bg-background"
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
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 space-y-6">
             {/* Cost Breakdown Card */}
             {items.length > 0 && (
               <Card  className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                 <h3 className="text-lg font-semibold font-display mb-4">Cost Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items:</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Credits per item:</span>
                    <span className="font-medium">1-3</span>
                  </div>
                  <div className="border-t pt-3">
                     <div className="flex justify-between text-lg font-semibold">
                       <span>Total Credits:</span>
                       <span className="text-primary font-mono">{totalCredits}</span>
                     </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Credits will be deducted upon batch creation
                  </div>
                </div>
              </Card>
            )}

             {/* Summary Card */}
             <Card  className="p-6">
               <h3 className="text-lg font-semibold font-display mb-4">Batch Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium capitalize">{step}</span>
                </div>
                {batchName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{batchName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items:</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Credits:</span>
                  <span className="font-medium">{credits}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {createError && (
        <div className="mt-6 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {createError}
        </div>
      )}
    </PageContainer>
  );
}

