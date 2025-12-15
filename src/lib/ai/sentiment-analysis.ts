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