# Update UI Components

## Files to Modify
- `src/components/generation/insufficient-credits-modal.tsx` (modify)
- `src/components/generation/generation-form.tsx` (modify - add mode toggle)
- `src/components/batch/batch-preview.tsx` (modify)
- `src/components/settings/credits-tab.tsx` (modify)

**Key Principle:** Reuse `CostBreakdown` component from Task 03 instead of duplicating breakdown rendering logic.

## Implementation Details

### 1. Update `insufficient-credits-modal.tsx`

**Current behavior:** Shows generic "You need X credits"

**New behavior:** Use `CostBreakdown` component to show detailed breakdown

**Changes:**
```tsx
import { CostBreakdown } from '@/components/pricing';

// Inside modal
<div>
  <p className="mb-4">This generation requires:</p>
  <CostBreakdown
    resolution={resolution}
    mode={mode}
    addons={addons}
    variant="default"
  />
  <div className="mt-4 space-y-2">
    <p>Your balance: {balance} credits</p>
    <p className="text-red-600 font-semibold">Shortfall: {required - balance} credits</p>
  </div>
</div>
```

**Data requirements:**
- Accept `resolution`, `mode`, `addons` from API error response (or from costBreakdown)
- Import and use `CostBreakdown` component (don't duplicate rendering logic)
- Show user balance and shortfall calculation

### 2. Add Mode Toggle to `generation-form.tsx`

**New feature:** Add UI toggle for lightning/snail mode selection

**Changes:**
```tsx
import { GenerationMode } from '@/lib/pricing';
import { useState } from 'react';

// Inside form component
const [mode, setMode] = useState<GenerationMode>('lightning');

// Add toggle UI (use Radio Group or Toggle Button Group from shadcn)
<div className="space-y-2">
  <Label>Processing Speed</Label>
  <RadioGroup value={mode} onValueChange={(value) => setMode(value as GenerationMode)}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="lightning" id="lightning" />
      <Label htmlFor="lightning" className="flex items-center gap-2">
        ⚡ Lightning <span className="text-sm text-muted-foreground">(~3 min)</span>
      </Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="snail" id="snail" />
      <Label htmlFor="snail" className="flex items-center gap-2">
        🐌 Snail <span className="text-sm text-muted-foreground">(up to 2 hrs, 50% off)</span>
      </Label>
    </div>
  </RadioGroup>

  {/* Live cost preview */}
  <CostBreakdown
    resolution={selectedResolution}
    mode={mode}
    variant="compact"
    className="mt-2"
  />
</div>
```

**Requirements:**
- Include `mode` in form submission to API
- Show live cost preview using `CostBreakdown` component
- Default to 'lightning' mode
- Clear visual indication of savings for snail mode

### 3. Update `batch-preview.tsx`

**Current behavior:** Shows "X credits" total

**New behavior:** Show lightning vs snail comparison with dynamic discount %

**Changes:**
```tsx
import { calculateGenerationCost, getCreditsForGeneration } from '@/lib/pricing';

// Calculate both totals
const lightningTotal = items.reduce((sum, item) => {
  const cost = getCreditsForGeneration(item.resolution, 'lightning');
  return sum + cost;
}, 0);

const snailTotal = items.reduce((sum, item) => {
  const cost = getCreditsForGeneration(item.resolution, 'snail');
  return sum + cost;
}, 0);

const discount = lightningTotal - snailTotal;
const discountPercent = Math.round((discount / lightningTotal) * 100);

// UI
<div className="space-y-2">
  <p className="text-muted-foreground">
    {itemCount} images × avg {Math.round(lightningTotal / itemCount)}cr (lightning) = {lightningTotal} credits
  </p>
  <p className="text-green-600 font-medium">
    Snail mode discount ({discountPercent}%): -{discount} credits
  </p>
  <p className="text-lg font-semibold">
    Total: {snailTotal} credits
  </p>
</div>
```

**Note:** Calculate discount percentage dynamically, don't hardcode "50%"

### 4. Update `credits-tab.tsx`

**Current behavior:** Shows transaction history without context

**New behavior:** Add pack purchase details (NO per-credit column to avoid confusion)

**Changes:**
```tsx
// For pack purchase transactions
{transaction.type === 'pack_purchase' && transaction.metadata?.packId && (
  <div className="text-sm text-muted-foreground mt-1">
    {pack.credits} credits for ${(pack.priceCents / 100).toFixed(2)}
  </div>
)}
```

**Note:** Do NOT show "per credit" cost ($0.20, $0.175, etc.) as this creates confusion with the "1 credit = $0.01" generation value. Just show total pack price and credits.

**Data requirements:**
- Access to pricing data via `getPricing()` action
- Map pack IDs to pack details
- Handle missing pack data gracefully

## Acceptance Criteria

### Insufficient Credits Modal
- [ ] Imports and uses `CostBreakdown` component (no duplicate rendering)
- [ ] Shows detailed cost breakdown from costBreakdown prop
- [ ] Displays snail discount with dynamic percentage
- [ ] Shows addon costs when present (future-ready)
- [ ] Shows user balance and shortfall

### Generation Form
- [ ] Has mode toggle UI (lightning/snail) with Radio Group or Toggle
- [ ] Shows live cost preview using `CostBreakdown` component
- [ ] Defaults to 'lightning' mode
- [ ] Includes mode in API request payload
- [ ] Clear visual indication of snail mode savings

### Batch Preview
- [ ] Shows lightning vs snail pricing comparison
- [ ] Displays discount with **dynamically calculated percentage**
- [ ] Handles multiple resolutions in same batch
- [ ] Updates in real-time as CSV is parsed
- [ ] Displays total prominently

### Credits Tab
- [ ] Shows pack purchase details (credits + total price)
- [ ] Does NOT show "per credit" cost (avoids confusion)
- [ ] Handles missing pack data gracefully
- [ ] Formatting is consistent with existing design

### General
- [ ] All components import `CostBreakdown` instead of duplicating rendering
- [ ] No TypeScript compilation errors
- [ ] No runtime errors
- [ ] Styling matches existing design system (green/gray, Figtree/Geist)
- [ ] Components are responsive

## Dependencies

**Requires completion of:**
- Task 01 - Update Configuration and Types
- Task 02 - Update API Routes (for error response format)
- Task 03 - Create Cost Breakdown Component (for reusable rendering)
