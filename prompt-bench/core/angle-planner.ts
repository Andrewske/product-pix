import type { DetectedAngles, AnglePlan, ProductCategory } from './types';
import { getAnglesForCategory } from './category-angles';

/**
 * Angle similarity mapping for fallback matching
 * Maps angles to their similar alternatives when exact matches aren't available
 */
const ANGLE_SIMILARITY: Record<string, string[]> = {
  'front': ['three-quarter view', 'front-on-model', 'front-label'],
  'back': ['three-quarter view', 'back-ports', 'back-ingredients', 'back-nutrition'],
  'three-quarter view': ['front', 'side', 'three-quarter left view', 'three-quarter right view', 'three-quarter left', 'three-quarter right'],
  'side': ['three-quarter view', 'side-profile', 'side-buttons'],
  'top-down': ['overhead', 'top', 'top view'],
  'detail': ['macro-detail', 'detail-fabric', 'detail-material', 'detail-interface', 'working-end-detail', 'texture-swatch', 'close-up'],
  'flat-lay': ['front', 'top-down'],
  'scale': ['scale-reference', 'scale-in-hand', 'worn-scale'],
  'lifestyle': ['room-context', 'in-use', 'serving-lifestyle'],
  // Category-specific mappings
  'front-on-model': ['front', 'three-quarter view'],
  'three-quarter left view': ['three-quarter view', 'side'],
  'three-quarter right view': ['three-quarter view', 'side'],
  'outsole': ['bottom-up', 'bottom'],
  'macro-detail': ['detail', 'close-up'],
  'detail-fabric': ['detail', 'texture-swatch'],
  'detail-interface': ['detail', 'close-up'],
  'working-end-detail': ['detail', 'close-up'],
  'room-context': ['lifestyle', 'in-use'],
  'scale-reference': ['scale', 'scale-in-hand'],
  'back-ports': ['back', 'three-quarter view'],
  'back-ingredients': ['back', 'three-quarter view'],
  'back-nutrition': ['back', 'three-quarter view'],
  'side-profile': ['side', 'three-quarter view'],
  'side-buttons': ['side', 'three-quarter view'],
  'texture-swatch': ['detail', 'detail-fabric'],
  'serving-lifestyle': ['lifestyle', 'in-use'],
  'worn-scale': ['scale', 'scale-in-hand']
};

/**
 * Source assignment with quality scoring for tie-breaking
 */
interface SourceCandidate {
  imageIndex: number;
  isPrimaryReference: boolean;
}

/**
 * Get all similar angles for a given angle, including itself
 */
function getSimilarAngles(angle: string): string[] {
  const normalized = angle.toLowerCase().trim();
  return [normalized, ...(ANGLE_SIMILARITY[normalized] || [])];
}

/**
 * Normalize angle strings for comparison
 */
function normalizeAngle(angle: string): string {
  return angle.toLowerCase().trim();
}

/**
 * Find the best source match for a target angle
 */
function findBestSourceMatch(
  targetAngle: string,
  sourceAngles: DetectedAngles['sourceAngles']
): { imageIndex: number; matchType: 'exact' | 'similar' | 'primary-fallback' } {
  const normalizedTarget = normalizeAngle(targetAngle);

  // 1. Try exact match (prefer primary reference if multiple exact matches)
  const exactMatches = sourceAngles.filter(source =>
    normalizeAngle(source.detectedAngle) === normalizedTarget
  );
  if (exactMatches.length > 0) {
    // Prefer primary reference, otherwise first match
    const bestExact = exactMatches.find(match => match.isPrimaryReference) || exactMatches[0];
    return { imageIndex: bestExact.imageIndex, matchType: 'exact' };
  }

  // 2. Try similar match (prefer primary reference if multiple similar matches)
  const similarAngles = getSimilarAngles(normalizedTarget);
  const similarMatches = sourceAngles.filter(source =>
    similarAngles.includes(normalizeAngle(source.detectedAngle))
  );
  if (similarMatches.length > 0) {
    // Prefer primary reference, otherwise first match
    const bestSimilar = similarMatches.find(match => match.isPrimaryReference) || similarMatches[0];
    return { imageIndex: bestSimilar.imageIndex, matchType: 'similar' };
  }

  // 3. Use primary fallback (first primary reference found)
  const primaryReference = sourceAngles.find(source => source.isPrimaryReference);
  if (primaryReference) {
    return { imageIndex: primaryReference.imageIndex, matchType: 'primary-fallback' };
  }

  // 4. Fallback to first available source if no primary reference (shouldn't happen)
  const firstSource = sourceAngles[0];
  if (firstSource) {
    return { imageIndex: firstSource.imageIndex, matchType: 'primary-fallback' };
  }

  throw new Error('No source angles available');
}

/**
 * Extract unique angles from detected sources, deduplicating by angle name
 * and preferring sources marked as primary reference for quality
 */
function extractUniqueAngles(sourceAngles: DetectedAngles['sourceAngles']): string[] {
  const angleMap = new Map<string, SourceCandidate>();

  for (const source of sourceAngles) {
    const normalizedAngle = normalizeAngle(source.detectedAngle);

    const existing = angleMap.get(normalizedAngle);
    if (!existing || (!existing.isPrimaryReference && source.isPrimaryReference)) {
      // Prefer primary references, or keep the first one found
      angleMap.set(normalizedAngle, {
        imageIndex: source.imageIndex,
        isPrimaryReference: source.isPrimaryReference
      });
    }
  }

  return Array.from(angleMap.keys());
}

/**
 * Plan collection angles deterministically based on detected sources and category defaults
 *
 * Algorithm:
 * 1. Extract unique angles from detected sources
 * 2. Fill remaining slots from category defaults (up to outputCount)
 * 3. For each target angle, find best source match (exact > similar > primary-fallback)
 */
export function planCollection(
  detectedAngles: DetectedAngles,
  category: ProductCategory,
  outputCount: number
): AnglePlan {
  if (outputCount <= 0) {
    return { assignments: [] };
  }

  // 1. Extract unique angles from detected sources
  const detectedUniqueAngles = extractUniqueAngles(detectedAngles.sourceAngles);

  // 2. Get category defaults and fill remaining slots
  const categoryAngles = getAnglesForCategory(category);
  const targetAngles: string[] = [];

  // Add detected angles first
  targetAngles.push(...detectedUniqueAngles);

  // Fill remaining slots from category defaults (avoiding duplicates)
  const usedAngles = new Set(targetAngles.map(normalizeAngle));
  for (const categoryAngle of categoryAngles) {
    if (targetAngles.length >= outputCount) break;
    if (!usedAngles.has(normalizeAngle(categoryAngle))) {
      targetAngles.push(categoryAngle);
      usedAngles.add(normalizeAngle(categoryAngle));
    }
  }

  // Ensure we have exactly outputCount angles (truncate if needed)
  const finalTargetAngles = targetAngles.slice(0, outputCount);

  // 3. Create assignments for each target angle
  const assignments = finalTargetAngles.map(targetAngle => {
    const match = findBestSourceMatch(targetAngle, detectedAngles.sourceAngles);
    return {
      targetAngle,
      sourceImageIndex: match.imageIndex,
      matchType: match.matchType
    };
  });

  return { assignments };
}
