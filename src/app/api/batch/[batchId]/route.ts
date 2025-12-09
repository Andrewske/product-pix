// src/app/api/batch/[batchId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getBatchJob, getBatchItems } from '@/lib/db/batch';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get batch with items
    const batch = await getBatchJob(batchId);

    if (!batch) {
      return NextResponse.json(
        { error: 'Batch not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (batch.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
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
}

