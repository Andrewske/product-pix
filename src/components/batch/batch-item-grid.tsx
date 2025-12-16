// src/components/batch/batch-item-grid.tsx
'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageCard } from '@/components/image-card';
import type { BatchItem } from '@/lib/db/batch';
import type { GeneratedImage } from '@/types';

interface BatchItemWithImage extends BatchItem {
  generated_image?: GeneratedImage | null;
}

interface BatchItemGridProps {
  items: BatchItemWithImage[];
}

export function BatchItemGrid({ items }: BatchItemGridProps) {
  const statusVariants = {
    pending: 'secondary' as const,
    processing: 'secondary' as const,
    completed: 'teal' as const,
    failed: 'destructive' as const,
  };

  const statusLabels = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold font-display">Batch Items ({items.length})</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item) => (
           <Card
             key={item.id}
             
             className="overflow-hidden"
             hover
           >
            {item.generated_image ? (
              <ImageCard
                image={item.generated_image}
                onFavorite={() => {}}
                onDelete={() => {}}
                onDownload={(url) => {
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `${item.product_name || 'image'}.png`;
                  link.click();
                }}
              />
            ) : (
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {item.status === 'pending' && (
                  <div className="text-center space-y-2 p-4">
                    <div className="animate-pulse text-muted-foreground">
                      <svg
                        className="mx-auto h-12 w-12"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                )}
                {item.status === 'processing' && (
                  <div className="text-center space-y-2 p-4">
                    <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
                    <p className="text-xs text-accent">Processing</p>
                  </div>
                )}
                {item.status === 'failed' && (
                  <div className="text-center space-y-2 p-4">
                    <div className="text-destructive">
                      <svg
                        className="mx-auto h-12 w-12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <p className="text-xs text-destructive">Failed</p>
                    {item.error_message && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.error_message}
                      </p>
                    )}
                  </div>
                )}
                <Badge
                  variant={statusVariants[item.status]}
                  className="absolute top-2 right-2"
                >
                  {statusLabels[item.status]}
                </Badge>
              </div>
            )}
            {item.product_name && (
              <div className="p-2 border-t">
                <p className="text-sm font-medium truncate">{item.product_name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {item.prompt}
                </p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

