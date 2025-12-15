# Sentiment Analysis Implementation

## Files to Create
- `src/lib/ai/sentiment-analysis.ts` (new)
- `src/app/api/cron/analyze-sentiment/route.ts` (new)

## Files to Modify
- `vercel.json` (modify - add cron job)

## Implementation Details

### Sentiment Analysis Function

**File**: `src/lib/ai/sentiment-analysis.ts`

```typescript
import { Anthropic } from '@anthropic-ai/sdk';
import { logger } from '@/lib/logging';
import type { MessageAnalysis } from '@/types';

export interface SentimentAnalysisResult {
  category: MessageAnalysis['category'];
  sentiment: MessageAnalysis['sentiment'];
  confidence: number;
}

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const ANALYSIS_PROMPT = `Analyze this user message and classify it.

Categories:
- bug_report: User reporting a technical issue or error
- feature_request: User suggesting new functionality
- billing: User asking about payments, refunds, or pricing
- praise: User expressing satisfaction or gratitude
- complaint: User expressing dissatisfaction (not a bug)
- other: Doesn't fit above categories

Sentiment:
- positive: Satisfied, happy, thankful
- neutral: Factual, informational
- negative: Frustrated, angry, disappointed

Return JSON with: category, sentiment, confidence (0-1)

Message: {content}`;

export const analyzeSentiment = async (
  content: string
): Promise<SentimentAnalysisResult | null> => {
  try {
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: ANALYSIS_PROMPT.replace('{content}', content),
      }],
    });

    const text = response.content[0].type === 'text'
      ? response.content[0].text
      : '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.error('Failed to extract JSON from sentiment analysis', { text });
      return null;
    }

    const result = JSON.parse(jsonMatch[0]);

    // Validate result
    const validCategories = ['bug_report', 'feature_request', 'billing', 'praise', 'complaint', 'other'];
    const validSentiments = ['positive', 'neutral', 'negative'];

    if (
      !validCategories.includes(result.category) ||
      !validSentiments.includes(result.sentiment) ||
      typeof result.confidence !== 'number'
    ) {
      logger.error('Invalid sentiment analysis result', { result });
      return null;
    }

    return {
      category: result.category,
      sentiment: result.sentiment,
      confidence: Math.min(1, Math.max(0, result.confidence)),
    };
  } catch (error) {
    logger.error('Error analyzing sentiment', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
};
```

### Cron Job for Processing Queue

**File**: `src/app/api/cron/analyze-sentiment/route.ts`

Copy pattern from `src/app/api/cron/cleanup-errors/route.ts`:

```typescript
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
    const { data: queueItems, error: fetchError } = await supabase
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

          await supabase
            .from('user_messages')
            .update({ analysis })
            .eq('id', item.message_id);

          // Mark as processed
          await supabase
            .from('sentiment_analysis_queue')
            .update({ processed_at: new Date().toISOString() })
            .eq('id', item.id);

          processed++;
        } else {
          // Increment retry count on failure
          await supabase
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
        await supabase
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
```

### Add Cron Schedule

**File**: `vercel.json` (modify)

Add to existing crons array:

```json
{
  "crons": [
    {
      "path": "/api/batch/poll-gemini",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/cleanup-errors",
      "schedule": "0 3 * * 0"
    },
    {
      "path": "/api/cron/analyze-sentiment",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## Cost Controls Implemented
1. ✅ Max 3 retries per message (prevents infinite loops)
2. ✅ Batch size of 50 (limits API calls per cron run)
3. ✅ Pre-filter: Only queue messages ≥10 chars (in `submitMessage()`)
4. ✅ Async processing: Message save doesn't block on analysis
5. ✅ Use Claude Haiku (cheapest model)

## Reference Patterns
- `src/app/api/cron/cleanup-errors/route.ts` - Cron job structure
- `src/lib/ai/gemini-batch.ts` - LLM API calling pattern

## Acceptance Criteria
- ✅ `analyzeSentiment()` returns category, sentiment, confidence
- ✅ Cron job processes up to 50 messages per run
- ✅ Failed analyses retry up to 3 times
- ✅ Successful analysis updates user_messages.analysis
- ✅ Queue items marked processed_at when complete
- ✅ Errors logged with context
- ✅ CRON_SECRET authentication enforced
