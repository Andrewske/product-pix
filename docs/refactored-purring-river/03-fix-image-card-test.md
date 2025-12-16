# Fix image-card.test.tsx Mock

## Files to Modify
- `src/components/__tests__/image-card.test.tsx` (modify)

## Implementation Details

Fix the circular reference in the Next.js Image mock by:
1. Removing the import of `Image` from 'next/image' (line 4)
2. Changing the mock to use `<img>` instead of `<Image>` (lines 29-44)

### Change 1: Remove the Image import

**Remove line 4:**
```typescript
import Image from 'next/image';
```

This import creates a circular reference with the mock below.

### Change 2: Update the mock implementation

**Location:** Lines 29-44

**Before:**
```typescript
mock.module('next/image', () => ({
  default: ({ src, alt, className, fill }: {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
  }) => (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      style={fill ? { objectFit: 'cover' } : {}}
    />
  ),
}));
```

**After:**
```typescript
mock.module('next/image', () => ({
  default: ({ src, alt, className, fill }: {
    src: string;
    alt: string;
    className?: string;
    fill?: boolean;
  }) => (
    <img
      src={src}
      alt={alt}
      className={className}
      style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : {}}
    />
  ),
}));
```

**Key changes:**
- Changed `<Image>` to `<img>`
- Replaced `fill` prop with explicit style dimensions when `fill` is true
- Kept conditional styling logic for cover vs. no-fill cases

## Acceptance Criteria

- No circular reference in mock implementation
- ESLint passes with no warnings about `<img>` usage (due to Task 01)
- All existing tests continue to pass
- TypeScript compilation succeeds

## Dependencies

- Task 01 (Update ESLint Configuration) should be completed first
