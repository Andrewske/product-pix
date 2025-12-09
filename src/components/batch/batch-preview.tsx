// src/components/batch/batch-preview.tsx
'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-4">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Batch Preview</h3>
            <Badge variant="outline">{items.length} items</Badge>
          </div>

          {errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded p-4">
              <h4 className="font-medium text-destructive mb-2">
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
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Items:</span>
              <span className="font-medium">{items.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Credit Cost:</span>
              <span className="font-medium">{totalCredits} credits</span>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Items Preview:</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {previewItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="text-sm p-2 bg-muted/50 rounded border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {item.product_name && (
                          <div className="font-medium truncate">
                            {item.product_name}
                          </div>
                        )}
                        <div className="text-muted-foreground truncate">
                          {item.prompt}
                        </div>
                      </div>
                      <div className="ml-2 flex gap-1">
                        <Badge variant="outline" className="text-xs">
                          {item.aspect_ratio}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.resolution}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="w-full"
                >
                  {expanded ? 'Show Less' : `Show All ${items.length} Items`}
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              disabled={loading || items.length === 0 || errors.length > 0}
              className="flex-1"
            >
              {loading ? 'Creating...' : `Create Batch (${totalCredits} credits)`}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

