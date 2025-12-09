// src/app/api/batch/[batchId]/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBatchJob, getBatchItems } from '@/lib/db/batch';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/api-middleware';

const getBatchHandler = async (
  request: AuthenticatedRequest,
  { params }: { params: { batchId: string } }
): Promise<NextResponse> => {
  try {
    const { batchId } = params;

    // Get batch with items
    const batch = await getBatchJob(batchId);

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (batch.user_id !== request.user.id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

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

    return NextResponse.json({
      batch: {
        ...batch,
        items: itemsWithImages,
      },
    });
  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
};

export const GET = withAuth(getBatchHandler);

