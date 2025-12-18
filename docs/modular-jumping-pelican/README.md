# Variable Credit System Implementation

## Overview

Migrate ProductPix from a fixed "1-3 credits per image" system to a flexible "credits = cost-based currency" model where 1 credit = $0.01.

**Business Model:**
- **Credit value**: 1 credit = $0.01 (stable, grandfathered when users purchase)
- **Generation costs**: Variable, adjustable based on actual AI infrastructure costs
- **Pricing formula**: `credits = (actual_cost_usd * 1.5_margin) / 0.01`

**Initial Credit Costs** (with 1.5x margin):
- **Lightning Mode (fast ~3min)**: 1k=30cr, 2k=60cr, 4k=120cr
- **Snail Mode (economy, up to 2hrs, 50% off)**: 1k=15cr, 2k=30cr, 4k=60cr
- **Future Add-ons**: Title generation=50cr, Fancy background=10cr

**Note on Mode Names:**
- `mode: 'lightning' | 'snail'` - Pricing tiers based on processing speed
- Lightning = real-time processing, full price
- Snail = queued processing (future: Gemini Batch API), 50% discount
- Job queue implementation is separate from this credit system migration

**Key Benefits:**
- Credit costs are easily adjustable in config (no database migrations)
- Users see detailed cost breakdowns before generation
- Business can adapt to AI pricing changes without losing money
- Room for promotional discounts and new features

## Task Sequence

0. [00-audit-existing-usage.md](./00-audit-existing-usage.md) - Audit codebase for old credit config usage
1. [01-update-configuration-and-types.md](./01-update-configuration-and-types.md) - Update pricing config schema, add new types and calculation functions
2. [02-update-api-routes.md](./02-update-api-routes.md) - Integrate new cost calculation into generate and batch APIs, add database columns
3. [03-create-cost-breakdown-component.md](./03-create-cost-breakdown-component.md) - Build reusable React component for displaying cost breakdowns
4. [04-update-ui-components.md](./04-update-ui-components.md) - Update modals, previews, billing UI, and add mode toggle to generation form
5. [05-update-documentation.md](./05-update-documentation.md) - Update help documentation to explain variable credit system
6. [06-update-tests.md](./06-update-tests.md) - Add tests for new functions, components, and update existing tests

## Success Criteria

**Configuration & Types:**
- [ ] Config loads without Zod errors
- [ ] `calculateGenerationCost()` returns correct breakdown
- [ ] Lightning mode: 1k=30cr, 2k=60cr, 4k=120cr
- [ ] Snail mode: 1k=15cr, 2k=30cr, 4k=60cr
- [ ] Addon types derived from config (keyof typeof)

**API Integration:**
- [ ] Generation API deducts correct credits for chosen mode
- [ ] Batch API calculates total correctly across multiple items
- [ ] Error responses include cost breakdown

**UI Components:**
- [ ] Insufficient credits modal shows detailed breakdown using CostBreakdown component
- [ ] Batch preview shows lightning vs snail pricing with dynamic discount %
- [ ] Billing history shows pack purchase details (no per-credit column)
- [ ] Generation form has lightning/snail mode toggle
- [ ] Cost preview updates when resolution/mode changes

**Documentation:**
- [ ] Help docs explain 1 credit = $0.01 value model
- [ ] Generation costs table shows lightning and snail modes
- [ ] "Why credits can change" section explains flexibility
- [ ] Credit pack table omits "per credit" column to avoid confusion

**Testing:**
- [ ] All new functions have test coverage
- [ ] React components (CostBreakdown, modals) have test coverage
- [ ] Test enforces snail = 50% of lightning (business rule)
- [ ] Existing tests updated with new credit values
- [ ] 70-80% code coverage maintained
- [ ] All tests pass

**Integration:**
- [ ] End-to-end generation flow works with both modes
- [ ] Stripe webhook still grants correct pack credits
- [ ] Refund flow uses stored `credits_charged` value
- [ ] Database stores `generation_mode` and `credits_charged` on jobs
- [ ] No TypeScript compilation errors

## Execution Instructions

1. Execute tasks in numerical order (00 → 06)
2. Each task file contains:
   - Files to modify/create
   - Implementation details with code examples
   - Acceptance criteria
   - Dependencies
3. Verify acceptance criteria before moving to next task
4. Run tests after each phase:
   - After Task 00: Review audit results
   - After Task 01: `bun test src/lib/pricing`
   - After Task 02: `bun test src/app/api`
   - After Task 06: `bun test` (full suite)

## Dependencies

**External dependencies:**
- None (uses existing infrastructure)

**Internal dependencies:**
- Tasks must be completed in order due to dependency chain
- Task 01 is foundation for all others
- Tasks 03-04 depend on Task 01
- Task 06 requires Tasks 01-02 to be complete

**Database:**
- Migration required: Add `generation_mode` and `credits_charged` columns to `jobs` table
- Ensures audit trail of what users were charged
- Enables correct refunds if pricing changes between charge and refund
- Supports future analytics on mode usage

**Environment:**
- No new environment variables needed
- Existing Stripe integration unchanged
- Credit pack prices in Stripe remain stable

## Rollout Strategy

Since only test accounts exist (2 users, both internal):
0. **Pre-deployment verification**: Check no pending/active jobs that would be affected by credit changes
1. **Database migration**: Add `generation_mode` and `credits_charged` columns to jobs table
2. **Deploy all changes** atomically (no phased rollout needed)
3. **Manual testing**:
   - Generate with lightning mode (1k, 2k, 4k resolutions)
   - Generate with snail mode (all resolutions)
   - Verify credit consumption matches expected amounts
   - Test insufficient credits modal with both modes
   - Verify cost breakdown component displays correctly
   - Test refunds use stored `credits_charged` value
4. **Verify integrations**:
   - Stripe webhook still grants correct pack credits
   - All API endpoints return proper error responses
5. **Monitor**: Watch error logs for 24-48 hours for any calculation issues

## Future Enhancements (Not in this plan)

1. **Job queue system**: Implement background queue + Gemini Batch API integration for snail mode
2. **Add-on features**: Implement title generation, background effects
3. **Price change notifications**: Email/banner system to notify users before pricing adjustments
4. **Dynamic pricing API**: Endpoint to fetch current costs for external integrations
5. **Cost history tracking**: Analytics on credit cost changes over time
6. **A/B test pricing**: Experiment with different credit costs per user cohort
