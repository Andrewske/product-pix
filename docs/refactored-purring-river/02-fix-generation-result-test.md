# Fix generation-result.test.tsx Mock

## Files to Modify
- `src/components/__tests__/generation-result.test.tsx` (modify)

## Implementation Details

Fix the circular reference in the Next.js Image mock by:
1. Removing the import of `Image` from 'next/image' (line 5)
2. Changing the mock to use `<img>` instead of `<Image>` (lines 36-54)
3. Removing the blank line at line 53

### Change 1: Remove the Image import

**Remove line 5:**
```typescript
import Image from 'next/image';
```

This import creates a circular reference with the mock below.

### Change 2: Update the mock implementation

**Location:** Lines 36-54

**Before:**
```typescript
mock.module('next/image', () => ({
  default: ({ src, alt, className, onClick }: {
    src: string;
    alt: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <Image
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      tabIndex={onClick ? 0 : undefined}
      fill
      style={{ objectFit: 'contain' }}
    />

  ),
}));
```

**After:**
```typescript
mock.module('next/image', () => ({
  default: ({ src, alt, className, onClick }: {
    src: string;
    alt: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
    />
  ),
}));
```

**Key changes:**
- Changed `<Image>` to `<img>`
- Replaced `fill` prop with explicit style dimensions
- Removed blank line at end of mock
- Kept all accessibility attributes (onClick, onKeyDown, tabIndex)

## Acceptance Criteria

- No circular reference in mock implementation
- ESLint passes with no warnings about `<img>` usage (due to Task 01)
- All existing tests continue to pass
- TypeScript compilation succeeds

## Dependencies

- Task 01 (Update ESLint Configuration) should be completed first
