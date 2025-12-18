// src/components/batch/batch-preview.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getCreditsForGeneration } from '@/lib/pricing/credits';
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

  // Calculate credit costs for both modes
  const lightningTotal = items.reduce((sum, item) => {
    const cost = getCreditsForGeneration(item.resolution || '1k', 'lightning');
    return sum + cost;
  }, 0);

  const snailTotal = items.reduce((sum, item) => {
    const cost = getCreditsForGeneration(item.resolution || '1k', 'snail');
    return sum + cost;
  }, 0);

  const discount = lightningTotal - snailTotal;
  const discountPercent = Math.round((discount / lightningTotal) * 100);

  const previewItems = expanded ? items : items.slice(0, 5);
  const hasMore = items.length > 5;

  return (
    <div className="space-y-6">
      {/* Errors */}
      {errors.length > 0 && (
        <Card  className="p-6 border-destructive/20 bg-destructive/5">
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
        </Card>
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
              <Card key={idx}  className="p-4 hover" hover>
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
                     {getCreditsForGeneration(item.resolution || '1k', 'lightning')} credits (lightning)
                   </div>
                </div>
              </Card>
            ))}
          </div>

          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full"
            >
              {expanded ? 'Show Less' : `Show All ${items.length} Items`}
            </Button>
          )}
        </div>
      )}

      {/* Pricing Summary */}
      {items.length > 0 && (
        <Card className="p-4 bg-muted/50">
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm">
              {items.length} images × avg {Math.round(lightningTotal / items.length)}cr (lightning) = {lightningTotal} credits
            </p>
            <p className="text-green-600 font-medium text-sm">
              Snail mode discount ({discountPercent}%): -{discount} credits
            </p>
            <p className="text-lg font-semibold">
              Total: {snailTotal} credits
            </p>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-6 border-t">
        <Button
          variant="outline"
          size="xl"
          onClick={onCancel}
          disabled={loading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          
          size="xl"
          onClick={onConfirm}
          disabled={loading || items.length === 0 || errors.length > 0}
          className="flex-1"
        >
          {loading ? 'Creating Batch...' : `Start Batch (${snailTotal} credits)`}
        </Button>
      </div>
    </div>
  );
}

