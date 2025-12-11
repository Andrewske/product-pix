// src/components/batch/batch-preview.tsx
'use client';

import { useState } from 'react';
import { StudioCard } from '@/components/ui/studio-card';
import { StudioButton } from '@/components/ui/studio-button';
import { Badge } from '@/components/ui/badge';
import type { ParsedBatchItem, ParseError } from './csv-upload-form';

interface BatchPreviewProps {
  items: ParsedBatchItem[];
  errors: ParseError[];
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function BatchPreview({
  items,
  errors,
  onConfirm,
  onCancel,
  loading = false,
}: BatchPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  // Calculate credit cost
  const creditsPerItem = { '1k': 1, '2k': 2, '4k': 3 } as const;
  const totalCredits = items.reduce(
    (sum, item) => sum + creditsPerItem[item.resolution || '1k'],
    0
  );

  const previewItems = expanded ? items : items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <div className="space-y-6">
      {/* Errors */}
      {errors.length > 0 && (
        <StudioCard className="p-6 border-destructive/20 bg-destructive/5">
          <h4 className="font-semibold text-destructive mb-3">
            Validation Errors ({errors.length})
          </h4>
          <ul className="space-y-1 text-sm">
            {errors.slice(0, 5).map((error, idx) => (
              <li key={idx} className="text-destructive/80">
                Line {error.line}: {error.errors[0]?.message || 'Invalid data'}
              </li>
            ))}
            {errors.length > 5 && (
              <li className="text-destructive/60">
                ... and {errors.length - 5} more errors
              </li>
            )}
          </ul>
        </StudioCard>
      )}

      {/* Items Preview Grid */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Batch Preview</h3>
            <Badge variant="outline">{items.length} items</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {previewItems.map((item, idx) => (
              <StudioCard key={idx} className="p-4 hover" hover>
                <div className="space-y-3">
                  {item.product_name && (
                    <div className="font-medium text-sm truncate">
                      {item.product_name}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Template: {item.template_slug}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.aspect_ratio}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.resolution}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {creditsPerItem[item.resolution || '1k']} credit{creditsPerItem[item.resolution || '1k'] !== 1 ? 's' : ''}
                  </div>
                </div>
              </StudioCard>
            ))}
          </div>

          {hasMore && (
            <StudioButton
              studioVariant="secondary"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full"
            >
              {expanded ? 'Show Less' : `Show All ${items.length} Items`}
            </StudioButton>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <StudioButton
          studioVariant="secondary"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </StudioButton>
        <StudioButton
          studioVariant="primary"
          onClick={onConfirm}
          disabled={loading || items.length === 0 || errors.length > 0}
          className="flex-1"
        >
          {loading ? 'Creating Batch...' : `Start Batch (${totalCredits} credits)`}
        </StudioButton>
      </div>
    </div>
  );
}

