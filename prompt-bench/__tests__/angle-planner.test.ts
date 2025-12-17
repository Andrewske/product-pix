import { describe, it, expect } from 'bun:test';
import { planCollection } from '../core/angle-planner';
import type { DetectedAngles, ProductCategory } from '../core/types';

describe('planCollection', () => {
  const mockDetectedAngles = (angles: Array<{ imageIndex: number; detectedAngle: string; isPrimaryReference: boolean }>): DetectedAngles => ({
    sourceAngles: angles
  });

  it('returns empty assignments for outputCount <= 0', () => {
    const detectedAngles = mockDetectedAngles([
      { imageIndex: 0, detectedAngle: 'front', isPrimaryReference: true }
    ]);

    expect(planCollection(detectedAngles, 'generic', 0)).toEqual({ assignments: [] });
    expect(planCollection(detectedAngles, 'generic', -1)).toEqual({ assignments: [] });
  });

  it('uses detected angles first, then fills from category defaults', () => {
    const detectedAngles = mockDetectedAngles([
      { imageIndex: 0, detectedAngle: 'front', isPrimaryReference: true },
      { imageIndex: 1, detectedAngle: 'back', isPrimaryReference: false }
    ]);

    const plan = planCollection(detectedAngles, 'generic', 4);

    expect(plan.assignments).toHaveLength(4);
    expect(plan.assignments[0].targetAngle).toBe('front');
    expect(plan.assignments[1].targetAngle).toBe('back');
    // Next should come from category defaults, avoiding duplicates
    expect(['three-quarter view', 'detail', 'scale']).toContain(plan.assignments[2].targetAngle);
  });

  it('prefers exact matches over similar matches', () => {
    const detectedAngles = mockDetectedAngles([
      { imageIndex: 0, detectedAngle: 'three-quarter view', isPrimaryReference: true },
      { imageIndex: 1, detectedAngle: 'front', isPrimaryReference: false }
    ]);

    const plan = planCollection(detectedAngles, 'generic', 1);

    expect(plan.assignments[0].targetAngle).toBe('three-quarter view');
    expect(plan.assignments[0].matchType).toBe('exact');
    expect(plan.assignments[0].sourceImageIndex).toBe(0);
  });

  it('uses similar matches when exact not available', () => {
    // Target is 'front' but we have 'three-quarter view' which is similar to 'front'
    const detectedAngles = mockDetectedAngles([
      { imageIndex: 0, detectedAngle: 'three-quarter view', isPrimaryReference: true },
      { imageIndex: 1, detectedAngle: 'back', isPrimaryReference: false }
    ]);

    const plan = planCollection(detectedAngles, 'generic', 1);

    expect(plan.assignments[0].targetAngle).toBe('three-quarter view');
    expect(plan.assignments[0].matchType).toBe('exact');
    expect(plan.assignments[0].sourceImageIndex).toBe(0);
  });

  it('matches similar angles correctly', () => {
    // Force a target that doesn't exist in sources but has similar matches
    const detectedAngles = mockDetectedAngles([
      { imageIndex: 0, detectedAngle: 'three-quarter view', isPrimaryReference: true }
    ]);

    // This will create targets: ['three-quarter view'] (detected) + ['front', 'back', 'detail', 'scale'] (defaults)
    const plan = planCollection(detectedAngles, 'generic', 5);

    const frontAssignment = plan.assignments.find(a => a.targetAngle === 'front');
    expect(frontAssignment?.matchType).toBe('similar'); // 'three-quarter view' is similar to 'front'
    expect(frontAssignment?.sourceImageIndex).toBe(0);
  });

  it('uses primary fallback when no good match exists', () => {
    const detectedAngles = mockDetectedAngles([
      { imageIndex: 0, detectedAngle: 'unusual-angle', isPrimaryReference: true },
      { imageIndex: 1, detectedAngle: 'another-unusual', isPrimaryReference: false }
    ]);

    const plan = planCollection(detectedAngles, 'generic', 1);

    expect(plan.assignments[0].targetAngle).toBe('unusual-angle');
    expect(plan.assignments[0].matchType).toBe('exact'); // exact match for the unusual angle
    expect(plan.assignments[0].sourceImageIndex).toBe(0);
  });

  it('handles single source image correctly', () => {
    const detectedAngles = mockDetectedAngles([
      { imageIndex: 0, detectedAngle: 'front', isPrimaryReference: true }
    ]);

    const plan = planCollection(detectedAngles, 'generic', 3);

    expect(plan.assignments).toHaveLength(3);
    // All assignments should use the same source
    plan.assignments.forEach(assignment => {
      expect(assignment.sourceImageIndex).toBe(0);
      if (assignment.targetAngle === 'front') {
        expect(assignment.matchType).toBe('exact');
      } else {
        // 'three-quarter view' and 'back' are similar/primary-fallback to 'front'
        expect(['similar', 'primary-fallback']).toContain(assignment.matchType);
      }
    });
  });

  it('deduplicates detected angles, preferring primary references', () => {
    const detectedAngles = mockDetectedAngles([
      { imageIndex: 0, detectedAngle: 'front', isPrimaryReference: false },
      { imageIndex: 1, detectedAngle: 'front', isPrimaryReference: true },
      { imageIndex: 2, detectedAngle: 'back', isPrimaryReference: false }
    ]);

    const plan = planCollection(detectedAngles, 'generic', 2);

    expect(plan.assignments).toHaveLength(2);
    const frontAssignment = plan.assignments.find(a => a.targetAngle === 'front');
    expect(frontAssignment?.sourceImageIndex).toBe(1); // Should prefer the primary reference
    expect(frontAssignment?.matchType).toBe('exact');
  });

  it('respects outputCount limit, truncating if necessary', () => {
    const detectedAngles = mockDetectedAngles([
      { imageIndex: 0, detectedAngle: 'front', isPrimaryReference: true },
      { imageIndex: 1, detectedAngle: 'back', isPrimaryReference: false },
      { imageIndex: 2, detectedAngle: 'side', isPrimaryReference: false },
      { imageIndex: 3, detectedAngle: 'top', isPrimaryReference: false },
      { imageIndex: 4, detectedAngle: 'detail', isPrimaryReference: false }
    ]);

    const plan = planCollection(detectedAngles, 'generic', 3);

    expect(plan.assignments).toHaveLength(3);
  });

  it('works with different product categories', () => {
    const detectedAngles = mockDetectedAngles([
      { imageIndex: 0, detectedAngle: 'front-on-model', isPrimaryReference: true }
    ]);

    const apparelPlan = planCollection(detectedAngles, 'apparel', 2);
    expect(apparelPlan.assignments[0].targetAngle).toBe('front-on-model');

    const footwearPlan = planCollection(detectedAngles, 'footwear', 2);
    expect(footwearPlan.assignments[0].targetAngle).toBe('front-on-model');
  });


});