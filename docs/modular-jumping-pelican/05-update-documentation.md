# Update Documentation

## Files to Modify
- `src/content/help/credits-pricing.mdx` (modify)

## Implementation Details

Update the help documentation to reflect the new variable credit system with clear explanations of how pricing works.

### Section 1: Update "How Credits Work"

**Replace current introduction with:**

```markdown
## How Credits Work

Credits are our flexible currency for all generations and features.
**1 credit = $0.01 of value.**

Every generation consumes credits based on the output resolution and processing mode you choose. Your purchased credits maintain their value forever - we only adjust what features cost in credits based on our AI infrastructure expenses.
```

### Section 2: Update "Generation Costs" Table

**Replace current table with:**

```markdown
### Generation Costs

**⚡ Lightning Mode (Fast - ~3 minutes):**
| Resolution | Size | Credits | Cost |
|------------|------|---------|------|
| 1k | 1024px | 30 | $0.30 |
| 2k | 1536px | 60 | $0.60 |
| 4k | 2048px | 120 | $1.20 |

**🐌 Snail Mode (Economy - up to 2 hours):**
Same resolutions at **50% off** - perfect for bulk orders or when you're not in a rush!
| Resolution | Size | Credits | Cost |
|------------|------|---------|------|
| 1k | 1024px | 15 | $0.15 |
| 2k | 1536px | 30 | $0.30 |
| 4k | 2048px | 60 | $0.60 |
```

### Section 3: Add "Why Credits Can Change"

**Add new section after Generation Costs:**

```markdown
### Why Credits Can Change

We base credit costs on our actual AI infrastructure expenses. If Google changes their pricing or we optimize our prompts, we'll adjust credit costs and notify you in advance.

**What stays the same:**
- Your purchased credits always maintain their $0.01 value
- Credits never expire
- Pack prices remain stable

**What can change:**
- How many credits a generation costs
- Feature pricing (like add-ons)
- Mode discounts (like batch mode %)

We'll always give you advance notice before any price adjustments, explain why the change is happening, and grandfather existing credits at favorable rates when possible.
```

### Section 4: Update "Example Costs"

**Replace examples with mode-aware calculations:**

```markdown
### Example Costs

**⚡ Lightning Mode (Fast):**
- 10 social media images (1k): 300 credits ($3.00)
- 20 e-commerce photos (2k): 1,200 credits ($12.00)
- 5 hero banners (4k): 600 credits ($6.00)

**🐌 Snail Mode (Economy - 50% off):**
- 100 product images (1k): 1,500 credits ($15.00)
- 50 e-commerce photos (2k): 1,500 credits ($15.00)
- 20 high-res prints (4k): 1,200 credits ($12.00)
```

### Section 5: Update Credit Pack Pricing (if needed)

Verify the credit pack table matches current Stripe prices. Update if pack structure has changed:

```markdown
## Credit Packs

Purchase credits as needed with our one-time packs:

| Pack | Credits | Price | Per Credit |
|------|---------|-------|------------|
| Starter | 50 | $10 | $0.20 |
| Growth | 200 | $35 | $0.175 |
| Pro | 500 | $75 | $0.15 |
```

*Note: The "per credit" value here refers to the purchase price, not the generation value (which is always $0.01).*

### Section 6: Update Refund Policy (if applicable)

Add clarification about credit value vs generation costs:

```markdown
## Refund Policy

### Credit Value Guarantee

- Credits you purchase maintain their $0.01 value
- If generation costs increase significantly, we'll offer special request refunds
- Failed generations automatically refund credits within minutes
- Pack purchase refunds available within 30 days
```

## Acceptance Criteria

- [ ] "How Credits Work" section explains 1 credit = $0.01
- [ ] Generation costs table shows both Lightning and Snail modes with emojis
- [ ] All credit amounts match the new pricing (30/60/120 for lightning, 15/30/60 for snail)
- [ ] Snail mode discount (50%) is clearly shown
- [ ] "Why Credits Can Change" section explains the flexibility
- [ ] Example costs are accurate for both modes
- [ ] Credit pack table does NOT include "Per Credit" column (removed to avoid confusion)
- [ ] Credit pack pricing matches Stripe configuration
- [ ] Refund policy addresses variable generation costs
- [ ] No broken links or formatting issues
- [ ] Documentation renders correctly in the help section

## Dependencies

**Requires completion of:**
- Task 01 - Update Configuration and Types (to verify credit amounts)

This task can be done independently but should reference the actual credit values from the config.
