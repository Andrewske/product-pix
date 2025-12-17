# Template Cleanup

## Files to Modify/Create
- `prompt-bench/templates/multi-angle-collection.ts` (modify)
- `prompt-bench/core/types.ts` (modify - remove varietyStrategy from CollectionTemplate)

## Implementation Details

### Template Changes

The atomic prompt is already in place from our experiment:
```typescript
subject: 'Professional photo of {product} from {angle}'
```

**Remove `varietyStrategy` from all collection templates:**

```typescript
// BEFORE
export const multiAngleHybrid: CollectionTemplate = {
  slug: 'multi-angle-hybrid',
  type: 'collection',
  outputCount: 5,
  varietyStrategy: 'hybrid',  // REMOVE THIS
  version: 2,
  // ...
};

// AFTER
export const multiAngleHybrid: CollectionTemplate = {
  slug: 'multi-angle-hybrid',
  type: 'collection',
  outputCount: 5,
  version: 3,  // BUMP VERSION
  // ...
};
```

### Templates to Update

1. **multiAngleCategoryBased** - Remove `varietyStrategy: 'category-based'`, bump version
2. **multiAngleAiDecided** - Remove `varietyStrategy: 'ai-decided'`, bump version
3. **multiAngleHybrid** - Remove `varietyStrategy: 'hybrid'`, bump version to 3

### Type Changes

In `prompt-bench/core/types.ts`, update `CollectionTemplate`:

```typescript
// BEFORE
interface CollectionTemplate {
  // ...
  varietyStrategy: 'category-based' | 'hybrid' | 'ai-decided';
  // ...
}

// AFTER
interface CollectionTemplate {
  // ...
  // varietyStrategy removed - planner handles all strategies
  // ...
}
```

### Consolidation Option

Consider consolidating to a single template since varietyStrategy no longer differentiates them:

```typescript
// All three templates now behave the same way (planner-based)
// Could merge into one: 'multi-angle-collection'
// But keep separate for now to maintain backward compatibility with existing test labels
```

## Acceptance Criteria
- [ ] `varietyStrategy` removed from all collection templates
- [ ] `varietyStrategy` removed from `CollectionTemplate` type definition
- [ ] Template versions bumped (triggers fresh generations)
- [ ] `bun bench sync` succeeds
- [ ] Templates compile without TypeScript errors

## Dependencies
- Task 04 (Orchestrator Integration) - varietyStrategy must be removed from orchestrator first
