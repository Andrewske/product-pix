# Update CLAUDE.md Documentation

## Files to Modify
- `CLAUDE.md` (modify lines 63-64)

## Implementation Details

Update the project documentation to reflect the new TypeScript return type policy.

### Current Content (lines 63-64)
```markdown
- **TypeScript**: Never `any`/unguarded `unknown`/`!`, explicit return types
  - Enforced: `@typescript-eslint/explicit-function-return-type`
  - Exception: React components (JSX.Element inference)
```

### New Content
```markdown
- **TypeScript**: Never `any`/unguarded `unknown`/`!`, explicit return types on exports
  - Enforced: `@typescript-eslint/explicit-function-return-type` on lib/API code only
  - Rationale: Module boundaries need contracts, internal implementation relies on inference
  - Exempted: React components (.tsx), event handlers, inline callbacks
```

### Context
This documentation update reflects the industry-standard approach adopted in this refactoring:
- Explicit return types required at **module boundaries** (exported functions in lib/, API routes, hooks)
- Internal implementation details rely on TypeScript's excellent type inference
- React components and event handlers are exempted (noise without value)

## Implementation Steps
1. Read `CLAUDE.md` to verify current content and line numbers
2. Use Edit tool to replace the TypeScript section
3. Verify formatting and markdown syntax
4. Ensure alignment with actual ESLint configuration from Task 01

## Acceptance Criteria
- [ ] CLAUDE.md updated with new TypeScript policy
- [ ] Documentation accurately reflects ESLint configuration
- [ ] Rationale is clear for future developers
- [ ] Exemptions are explicitly listed
- [ ] Markdown formatting is correct

## Dependencies
- Task 01 (ESLint configuration) - documentation should match implementation
- Task 06 (all violations fixed) - ensure documentation reflects final state

## Notes
- This is a documentation-only change
- No code or configuration affected
- Helps future developers understand the project's TypeScript philosophy
