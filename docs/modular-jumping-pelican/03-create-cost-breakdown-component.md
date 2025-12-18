# Create Cost Breakdown Component

## Files to Create
- `src/components/pricing/cost-breakdown.tsx` (new)

## Implementation Details

Create a **reusable** React component that displays generation cost breakdowns. This component will be imported and used in multiple places (Task 04) to avoid duplicate implementations.

### Component Interface

```typescript
interface CostBreakdownProps {
  resolution: Resolution;
  mode: GenerationMode;
  addons?: Array<string>;
  className?: string;
  variant?: 'default' | 'compact'; // For different display contexts
}

export function CostBreakdown({
  resolution,
  mode,
  addons,
  className,
  variant = 'default'
}: CostBreakdownProps) {
  // Implementation
}
```

**Note:** Component must be flexible enough to work in:
- Insufficient credits modal
- Batch preview
- Generation form preview
- Any future cost display needs

### Component Behavior

1. **Calculate cost** using `calculateGenerationCost()` from `@/lib/pricing/credits`
2. **Display breakdown** showing:
   - Base generation cost with resolution
   - Mode discount if applicable (batch mode)
   - Individual addon costs if present
   - Total credit cost

### Example Output

**Standard mode:**
```
Cost Breakdown:
├─ 1 image (1024px): 30 credits
└─ Total: 30 credits
```

**Snail mode:**
```
Cost Breakdown:
├─ 1 image (1024px): 30 credits (lightning rate)
├─ Snail mode discount: -15 credits (50% off)
└─ Total: 15 credits
```

**Important:** Discount percentage should be calculated dynamically:
```typescript
const lightningCost = getCreditsForGeneration(resolution, 'lightning');
const snailCost = getCreditsForGeneration(resolution, 'snail');
const discount = lightningCost - snailCost;
const discountPercent = Math.round((discount / lightningCost) * 100);

// Display: `(${discountPercent}% off)` instead of hardcoded "50% off"
```

**With addons (future):**
```
Cost Breakdown:
├─ 1 image (1024px): 30 credits
├─ Product title generation: 50 credits
├─ Fancy background: 10 credits
└─ Total: 90 credits
```

### Styling Requirements

- Use existing UI components from design system
- Match ProductPix brand (green accents, clean typography)
- Responsive design (mobile-friendly)
- Clear visual hierarchy (total should stand out)
- Use list/tree structure for line items
- Green highlight for discounts
- Semibold font for total

### Accessibility

- Proper semantic HTML
- Screen reader friendly
- ARIA labels where appropriate

## Acceptance Criteria

- [ ] Component renders without errors
- [ ] Shows base generation cost correctly for both modes
- [ ] Shows snail discount with **dynamically calculated percentage**
- [ ] Supports optional addons array
- [ ] Total calculation is correct
- [ ] Supports `variant` prop for different display contexts
- [ ] Styling matches ProductPix design system (green/gray theme)
- [ ] Component is responsive on mobile
- [ ] TypeScript types are correct
- [ ] Component exported from `@/components/pricing/index.ts` for easy import
- [ ] Component is **reusable** - can be imported by Task 04 components

## Dependencies

**Requires completion of:** Task 01 - Update Configuration and Types

The component needs access to `calculateGenerationCost()` and type definitions.
