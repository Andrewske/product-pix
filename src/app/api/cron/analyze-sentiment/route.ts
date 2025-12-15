import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { analyzeSentiment } from '@/lib/ai/sentiment-analysis';
import { logger } from '@/lib/logging';

const MAX_RETRIES = 3;
const BATCH_SIZE = 50;

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const supabase = createAdminClient();
  let processed = 0;

  try {
    // Get unprocessed messages from queue
    const { data: queueItems, error: fetchError } = await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
      .from('sentiment_analysis_queue')
      .select(`
        id,
        message_id,
        retry_count,
        user_messages!inner(content)
      `)
      .is('processed_at', null)
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (fetchError) {
      logger.error('Failed to fetch sentiment queue', { error: fetchError.message });
      return NextResponse.json(
        { error: 'Failed to fetch queue' },
        { status: 500 }
      );
    }

    if (!queueItems || queueItems.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    for (const item of queueItems) {
      try {
        const content = item.user_messages?.content;
        if (!content) continue;

        // Analyze sentiment
        const result = await analyzeSentiment(content);

        if (result) {
          // Update message with analysis
          const analysis = {
            category: result.category,
            sentiment: result.sentiment,
            confidence: result.confidence,
            analyzedAt: new Date().toISOString(),
            model: 'claude-3-5-haiku-20241022',
          };

          await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            .from('user_messages')
            .update({ analysis })
            .eq('id', item.message_id);

          // Mark as processed
          await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            .from('sentiment_analysis_queue')
            .update({ processed_at: new Date().toISOString() })
            .eq('id', item.id);

          processed++;
        } else {
          // Increment retry count on failure
          await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
            .from('sentiment_analysis_queue')
            .update({
              retry_count: item.retry_count + 1,
              last_error: 'Analysis returned null',
            })
            .eq('id', item.id);
        }
      } catch (error) {
        logger.error('Error processing sentiment queue item', {
          error: error instanceof Error ? error.message : String(error),
          queueItemId: item.id,
        });

        // Increment retry count
        await (supabase as any) // eslint-disable-line @typescript-eslint/no-explicit-any
          .from('sentiment_analysis_queue')
          .update({
            retry_count: item.retry_count + 1,
            last_error: error instanceof Error ? error.message : String(error),
          })
          .eq('id', item.id);
      }
    }

    logger.info('Sentiment analysis cron completed', { processed });
    return NextResponse.json({ processed });
  } catch (error) {
    logger.error('Sentiment analysis cron failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}