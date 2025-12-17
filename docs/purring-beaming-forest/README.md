# Atomic Angle Generation

## Overview

This plan implements intelligent angle planning for multi-angle product photo collections. The current system has three issues:
1. **Collages** - Generator sometimes produces 4-image grids instead of single images
2. **Repeated angles** - "undefined" angles produce same view repeatedly
3. **Source mismatch** - Source images not matched to appropriate target angles

The solution separates concerns into:
- **Detection** (Gemini, cached) - Analyze source images to identify what angles they show
- **Planning** (algorithmic) - Determine which angles to generate and match sources intelligently

**Key principle:** Detection (vision understanding) uses AI. Planning (which angles, which sources) is deterministic.

## Task Sequence

1. [01-types-and-interfaces.md](./01-types-and-interfaces.md) - Add DetectedAngles and AnglePlan interfaces
2. [02-angle-detector.md](./02-angle-detector.md) - Gemini-powered angle detection with caching
3. [03-angle-planner.md](./03-angle-planner.md) - Deterministic collection planning algorithm
4. [04-orchestrator-integration.md](./04-orchestrator-integration.md) - Replace varietyStrategy with planner
5. [05-template-cleanup.md](./05-template-cleanup.md) - Remove varietyStrategy, bump versions
6. [06-testing-and-validation.md](./06-testing-and-validation.md) - Unit and integration tests

## Success Criteria

- [ ] Each generation prompt mentions only ONE angle
- [ ] No collages in output (single product view only)
- [ ] Source images matched to appropriate angles (no front→back hallucination)
- [ ] Scores remain ≥8.0 for well-defined angles
- [ ] Fallback to category angles works when detection fails
- [ ] Angle detection is cached (re-runs don't repeat API calls)

## Execution Instructions

1. Execute tasks in numerical order (01 → 06)
2. Each task file contains:
   - Files to modify/create
   - Implementation details
   - Acceptance criteria
   - Dependencies
3. Verify acceptance criteria before moving to next task

## Key Design Decisions

| Decision | Choice |
|----------|--------|
| Error handling | Fallback to category angles + log when fallback triggers |
| Vocabulary | Hybrid: prefer category terms, allow free-form for unusual cases |
| Source matching | Explicit criteria: same angle > most complete view > best quality |
| Integration | Sequential for initial implementation |
| Gemini calls | Keep product analysis and angle detection separate |
| Caching | Cache angle detection only; planning is algorithmic |
| Migration | Replace varietyStrategy entirely; planner is the only path |

## Files to Modify

| File | Change |
|------|--------|
| `prompt-bench/core/types.ts` | Add DetectedAngles, AnglePlan interfaces |
| `prompt-bench/core/angle-detector.ts` | **NEW** - Gemini angle detection + caching |
| `prompt-bench/core/angle-planner.ts` | **NEW** - Algorithmic collection planning |
| `prompt-bench/core/orchestrator.ts` | Replace varietyStrategy logic with planner |
| `prompt-bench/templates/multi-angle-collection.ts` | Remove varietyStrategy, bump version |
| `prompt-bench/__tests__/angle-planner.test.ts` | **NEW** - Unit tests |
| `prompt-bench/__tests__/angle-detector.test.ts` | **NEW** - Unit tests |

## Dependencies

- Existing `category-angles.ts` (kept as data source for fallback/planning)
- Existing `product-analyzer.ts` (pattern reference for caching)
- Gemini API access (for angle detection)
