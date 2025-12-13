# Fix Custom Hook Return Types

## Files to Modify
- `src/hooks/use-toast.ts` (7 violations)
- `src/hooks/use-mobile.ts` (2 violations)

## Implementation Details

Add explicit return types to custom hook functions and their helper functions.

### Strategy
1. Read each file completely
2. Analyze return statements to infer correct types
3. Add explicit return types to all functions

### Expected Patterns

**Hook itself:**
```typescript
// Before
function useToast() {
  return {
    toast: (props: ToastProps) => { /* ... */ },
    dismiss: () => { /* ... */ }
  }
}

// After
function useToast(): {
  toast: (props: ToastProps) => void;
  dismiss: () => void;
} {
  return {
    toast: (props: ToastProps) => { /* ... */ },
    dismiss: () => { /* ... */ }
  }
}
```

**Helper functions:**
```typescript
// Before
function genId() {
  return count.toString()
}

// After
function genId(): string {
  return count.toString()
}
```

**State/Reactive hooks:**
```typescript
// Before
function useMobile() {
  const [isMobile, setIsMobile] = React.useState(false)
  // ...
  return isMobile
}

// After
function useMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState(false)
  // ...
  return isMobile
}
```

### Implementation Steps
1. Read `src/hooks/use-toast.ts`
   - Identify all function declarations
   - Analyze each return statement
   - Add appropriate type annotations
2. Read `src/hooks/use-mobile.ts`
   - Repeat same process
3. Run `bun lint` to verify fixes

## Acceptance Criteria
- [ ] All 7 violations in `use-toast.ts` fixed
- [ ] All 2 violations in `use-mobile.ts` fixed
- [ ] Return types accurately reflect the actual return values
- [ ] Complex return types are properly structured (use type aliases if needed for readability)
- [ ] `bun lint` shows violations reduced by ~9
- [ ] `bun typecheck` passes
- [ ] `bun test` passes (no runtime changes)

## Expected Progression
Violations: ~55 → ~46

## Dependencies
- Task 01 (ESLint configuration must be updated first)
