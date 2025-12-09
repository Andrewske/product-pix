// src/app/batch/[batchId]/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBatchJob, getBatchItems } from '@/lib/db/batch';
import { BatchStatus } from '@/components/batch/batch-status';
import { BatchItemGrid } from '@/components/batch/batch-item-grid';
import { BatchActions } from '@/components/batch/batch-actions';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BatchDetailPageProps {
  params: Promise<{ batchId: string }>;
}

export default async function BatchDetailPage({ params }: BatchDetailPageProps) {
  const { batchId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const batch = await getBatchJob(batchId);

  if (!batch) {
    redirect('/batch');
  }

  // Verify ownership
  if (batch.user_id !== user.id) {
    redirect('/batch');
  }

  // Get batch items with generated images
  const items = await getBatchItems(batchId);

  // Fetch generated images for items that have them
  const itemsWithImages = await Promise.all(
    items.map(async (item) => {
      if (!item.generated_image_id) {
        return item;
      }

      const { data: image } = await supabase
        .from('generated_images')
        .select('*')
        .eq('id', item.generated_image_id)
        .single();

      return {
        ...item,
        generated_image: image || null,
      };
    })
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link href="/batch" className="text-muted-foreground hover:text-foreground text-sm">
          ← Back to Batches
        </Link>
        <h1 className="text-3xl font-bold mt-4">{batch.name}</h1>
      </div>

      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <BatchStatus batchId={batchId} initialBatch={batch} />
          </div>
          <BatchActions batch={batch} />
        </div>

        <BatchItemGrid items={itemsWithImages} />
      </div>
    </div>
  );
}

