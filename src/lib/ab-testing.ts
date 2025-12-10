/**
 * A/B Testing utilities for ProductPix
 * Provides simple variant assignment and tracking
 */

export type ABTestVariant = 'A' | 'B';

export interface ABTestConfig {
  name: string;
  variants: ABTestVariant[];
  weights?: number[]; // Optional weights for uneven distribution
}

/**
 * Simple A/B test assignment based on user ID or session
 * Uses consistent hashing for stable variant assignment
 */
export function getABTestVariant(
  testName: string,
  userId?: string,
  config: ABTestConfig = { name: testName, variants: ['A', 'B'] }
): ABTestVariant {
  // Use userId if available, otherwise use a session-based identifier
  const identifier = userId || getSessionId();

  // Simple hash function for consistent assignment
  const hash = simpleHash(`${testName}:${identifier}`);
  const normalizedHash = Math.abs(hash) / Number.MAX_SAFE_INTEGER;

  // Handle weighted variants
  if (config.weights && config.weights.length === config.variants.length) {
    const totalWeight = config.weights.reduce((sum, weight) => sum + weight, 0);
    let cumulativeWeight = 0;

    for (let i = 0; i < config.variants.length; i++) {
      cumulativeWeight += config.weights[i] / totalWeight;
      if (normalizedHash <= cumulativeWeight) {
        return config.variants[i];
      }
    }
  }

  // Default even distribution
  const variantIndex = Math.floor(normalizedHash * config.variants.length);
  return config.variants[variantIndex] || 'A';
}

/**
 * Get or create a session ID for anonymous users
 */
function getSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: use a random ID for this request
    return Math.random().toString(36).substring(2);
  }

  // Client-side: use localStorage with fallback
  try {
    let sessionId = localStorage.getItem('productpix_session_id');
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('productpix_session_id', sessionId);
    }
    return sessionId;
  } catch {
    // Fallback if localStorage is not available
    return Math.random().toString(36).substring(2);
  }
}

/**
 * Simple hash function for consistent variant assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}

/**
 * Predefined A/B test configurations
 */
export const AB_TESTS = {
  LANDING_HERO: {
    name: 'landing_hero',
    variants: ['A', 'B'] as ABTestVariant[],
    weights: [50, 50], // 50/50 split
  },
  PRICING_DISPLAY: {
    name: 'pricing_display',
    variants: ['A', 'B'] as ABTestVariant[],
    weights: [70, 30], // 70/30 split favoring A
  },
} as const;

/**
 * Track A/B test events (placeholder for future analytics integration)
 */
export function trackABTestEvent(
  testName: string,
  variant: ABTestVariant,
  event: string,
  userId?: string
): void {
  // Placeholder for analytics integration
  console.log(`AB Test: ${testName} variant ${variant} - ${event}`, { userId });
}