import { getPostHogServer } from './posthog-server';
import { validateAnalyticsEvent, type AnalyticsEvent } from './events';

// In-memory event queue with max capacity
const eventQueue: Array<{ userId: string; event: AnalyticsEvent }> = [];
const MAX_QUEUE_SIZE = 1000;

// Background worker interval ID
let workerIntervalId: NodeJS.Timeout | null = null;

/**
 * Starts the background worker that flushes events to PostHog
 */
function startWorker(): void {
  if (workerIntervalId !== null) {
    return; // Worker already running
  }

  // Flush queue every 10 seconds
  workerIntervalId = setInterval(() => {
    flushQueue();
  }, 10000);

  // Handle graceful shutdown
  process.on('SIGTERM', () => stopWorker());
  process.on('SIGINT', () => stopWorker());
}

/**
 * Stops the background worker
 */
function stopWorker(): void {
  if (workerIntervalId !== null) {
    clearInterval(workerIntervalId);
    workerIntervalId = null;

    // Final flush before shutdown
    flushQueue();
  }
}

/**
 * Flushes the event queue to PostHog
 */
function flushQueue(): void {
  if (eventQueue.length === 0) {
    return;
  }

  const posthog = getPostHogServer();
  if (!posthog) {
    console.warn('PostHog server client not available');
    return;
  }

  // Process events in batches
  const eventsToProcess = eventQueue.splice(0); // Clear queue

  for (const { userId, event } of eventsToProcess) {
    try {
      posthog.capture({
        distinctId: userId,
        event: event.event,
        properties: event.properties,
      });
    } catch (error) {
      console.warn('Failed to send event to PostHog:', error);
      // Note: We don't re-queue failed events to prevent infinite loops
    }
  }
}

/**
 * Tracks a server-side analytics event with validation and queuing
 */
export function trackServerEvent<T extends AnalyticsEvent>(userId: string, event: T): void {
  // Validate event against Zod schemas
  if (!validateAnalyticsEvent(event)) {
    console.warn('Invalid analytics event:', event);
    return;
  }

  // Add to queue (never throws)
  eventQueue.push({ userId, event });

  // Start worker if not running
  startWorker();

  // Handle queue overflow (FIFO: discard oldest)
  if (eventQueue.length > MAX_QUEUE_SIZE) {
    eventQueue.shift(); // Remove oldest event
  }
}

/**
 * Identifies a user for server-side tracking
 */
export function identifyUserServer(userId: string, properties?: Record<string, unknown>): void {
  const posthog = getPostHogServer();
  if (!posthog) {
    console.warn('PostHog server client not available');
    return;
  }

  try {
    posthog.identify({
      distinctId: userId,
      properties: properties || {},
    });
  } catch (error) {
    console.warn('Failed to identify user on server:', error);
  }
}