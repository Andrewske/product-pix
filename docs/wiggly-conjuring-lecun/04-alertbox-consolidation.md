# AlertBox → Alert Consolidation

## Files to Modify/Create
- `src/components/ui/alert-box.tsx` (delete)
- `src/components/ui/alert.tsx` (modify - add variants if needed)
- All files importing AlertBox (modify imports)

## Implementation Details

**Current State:** Two separate alert components exist:
- `alert-box.tsx` - custom implementation
- `alert.tsx` - shadcn Alert component

**Migration:**

### Step 1: Audit AlertBox Usage
Find all imports of AlertBox:
```bash
grep -r "alert-box" src/
```

### Step 2: Compare APIs
Document differences between AlertBox and Alert APIs to ensure parity.

### Step 3: Add Missing Variants to Alert
If AlertBox has variants not in Alert, add them to `alert.tsx`:
```tsx
const alertVariants = cva(
  "...",
  {
    variants: {
      variant: {
        default: "...",
        destructive: "...",
        success: "...",  // Add if missing
        warning: "...",  // Add if missing
        info: "...",     // Add if missing
      },
    },
  }
);
```

### Step 4: Update All Consumers
Replace AlertBox imports with Alert:
```tsx
// Before
import { AlertBox } from '@/components/ui/alert-box';

// After
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
```

### Step 5: Delete AlertBox
Remove `src/components/ui/alert-box.tsx` after all consumers updated.

## Acceptance Criteria
- [ ] All AlertBox usages migrated to Alert
- [ ] Alert has all variants previously in AlertBox
- [ ] alert-box.tsx deleted
- [ ] No TypeScript errors
- [ ] Visual appearance unchanged for all alert instances

## Dependencies
- Tasks 01-03 (core migrations complete first)
