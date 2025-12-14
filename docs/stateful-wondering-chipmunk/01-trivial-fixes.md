# Trivial Fixes

## Files to Modify
- `src/app/layout.tsx` (modify)
- `src/components/settings/privacy-tab.tsx` (modify)

## Implementation Details

### 1. Combine Duplicate Imports in layout.tsx

Lines 8-9 have two imports from the same module:
```typescript
import { CookieConsentProvider } from "@/components/cookie-consent";
import { CookieConsentBanner } from "@/components/cookie-consent";
```

Change to:
```typescript
import { CookieConsentProvider, CookieConsentBanner } from "@/components/cookie-consent";
```

### 2. Style Loading State in PrivacyTab

Line 16, change:
```typescript
return <div>Loading preferences...</div>;
```
To:
```typescript
return <div className="text-muted-foreground">Loading preferences...</div>;
```

## Acceptance Criteria
- No duplicate imports from same module
- Loading state has muted foreground styling
- `bun run build` passes

## Dependencies
None
