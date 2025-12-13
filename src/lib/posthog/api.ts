import { getPostHogServer } from './server';
import { env } from '@/lib/env';

export interface PostHogEvent {
  id: string;
  event: string;
  timestamp: string;
  properties: Record<string, unknown>;
  distinct_id: string;
}

export async function getPostHogEvents(
  userId: string,
  options: {
    limit?: number;
    beforeDate?: string;
    afterDate?: string;
    severity?: string;
    domain?: string;
  }
): Promise<PostHogEvent[]> {
  const posthog = getPostHogServer();
  if (!posthog || !env.POSTHOG_PROJECT_ID || !env.POSTHOG_PERSONAL_API_KEY) {
    return [];
  }

  const { limit = 50, beforeDate, afterDate, severity, domain } = options;

  // Build HogQL query
  let query = `
    SELECT
      uuid as id,
      event,
      timestamp,
      properties,
      distinct_id
    FROM events
    WHERE distinct_id = '${userId}'
  `;

  // Add date filters
  if (afterDate) {
    query += ` AND timestamp >= '${afterDate}'`;
  }
  if (beforeDate) {
    query += ` AND timestamp <= '${beforeDate}'`;
  }

  // Add property filters
  if (severity) {
    query += ` AND properties.severity = '${severity}'`;
  }
  if (domain) {
    query += ` AND properties.domain = '${domain}'`;
  }

  query += `
    ORDER BY timestamp DESC
    LIMIT ${limit}
  `;

  try {
    const response = await fetch(
      `https://app.posthog.com/api/projects/${env.POSTHOG_PROJECT_ID}/query/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.POSTHOG_PERSONAL_API_KEY}`,
        },
        body: JSON.stringify({
          query: {
            kind: 'HogQLQuery',
            query: query.trim(),
          },
        }),
      }
    );

    if (!response.ok) {
      console.warn('PostHog API error:', response.status, await response.text());
      return [];
    }

    const data = await response.json();

    // Transform results to PostHogEvent format
    return (data.results || []).map((row: unknown[]) => ({
      id: String(row[0] || ''),
      event: String(row[1] || ''),
      timestamp: String(row[2] || ''),
      properties: (row[3] as Record<string, unknown>) || {},
      distinct_id: String(row[4] || ''),
    }));
  } catch (error) {
    console.warn('Error fetching PostHog events:', error);
    return [];
  }
}