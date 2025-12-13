/**
 * Admin API client functions for user timeline and error management
 */

export interface TimelineFilters {
  severity?: string;
  domain?: string;
  resolved: 'all' | 'unresolved' | 'resolved';
  days: number;
}

export interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  domain: string;
  source: 'database' | 'other';
  timestamp: string;
  resolvedAt?: string;
  metadata: Record<string, unknown>;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  nextCursor?: string;
}

/**
 * Fetch user timeline with optional filters and pagination
 */
export async function getUserTimeline(
  userId: string,
  filters: TimelineFilters,
  cursor?: string
): Promise<TimelineResponse> {
  const params = new URLSearchParams();
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.domain) params.set('domain', filters.domain);
  params.set('resolved', filters.resolved);
  params.set('days', filters.days.toString());
  if (cursor) params.set('cursor', cursor);

  const response = await fetch(`/api/admin/users/${userId}/timeline?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch timeline: ${error}`);
  }

  return response.json();
}

/**
 * Resolve a critical error
 */
export async function resolveError(errorId: string): Promise<void> {
  const response = await fetch(`/api/admin/errors/${errorId}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to resolve error: ${error}`);
  }
}

/**
 * Unresolve a critical error
 */
export async function unresolveError(errorId: string): Promise<void> {
  const response = await fetch(`/api/admin/errors/${errorId}/resolve`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to unresolve error: ${error}`);
  }
}