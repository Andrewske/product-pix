# Legal Policy Complex Features - Backlog

## Overview

Tracking document for legal/privacy features that require infrastructure beyond basic CRUD.

**Last Updated**: December 2025
**Related**:
- `docs/reference/legal-policy-decisions.md` - Policy requirements
- `docs/plans/legal-policy-simple-implementation-plan.md` - Credit refunds, account deletion
- `docs/archive/cookie-consent-02-ui-components-plan.md` - Banner UI implementation plan


## 3. Cookie Consent Banner UI

### Complexity: Low (infrastructure complete)

### Current State (as of Dec 2025)
**Completed:**
- ✅ Cookie consent types and storage layer (`src/lib/cookie-consent/`)
- ✅ React context provider with full state management
- ✅ localStorage ↔ database synchronization
- ✅ PostHog analytics script with consent-aware loading
- ✅ Facebook Pixel script with consent-aware loading
- ✅ Comprehensive test coverage

**Remaining:**
- ❌ Cookie consent banner UI component
- ❌ Privacy settings tab in account settings

### Cookie Categories (Implemented)
| Category | Service | Toggleable |
|----------|---------|------------|
| Essential | Auth, security | No (always on) |
| Analytics | PostHog | Yes |
| Marketing | Facebook Pixel | Yes |

### Decisions Already Made
- **Library**: Custom solution (no third-party consent library needed)
- **Positioning**: Small bottom-right corner banner
- **Granularity**: Per-category (Analytics and Marketing toggles)
- **Persistence**: Forever until user changes preference
- **Re-consent**: Not needed for MVP; reconsider if expanding to EU

### Remaining Work
See archived implementation plan: `docs/archive/cookie-consent-02-ui-components-plan.md`

Summary of remaining tasks:
1. Create `CookieConsentBanner` component (positioned bottom-right, Accept All / Reject All buttons)
2. Create `PrivacyTab` component for Settings page (granular toggles)
3. Add Privacy tab to settings tabs navigation
4. Integrate banner into root layout
5. Mobile responsiveness and accessibility testing

### Technical Notes
- Banner appears when `hasConsented === false`
- Uses existing `useCookieConsent` hook from provider
- No backend work needed (already complete)

---

## 4. Facebook Pixel Integration (Conditional Loading)

### Complexity: Complete ✅

### Current State (as of Dec 2025)
**Implemented:**
- ✅ `react-facebook-pixel` NPM package integrated
- ✅ Consent-aware loading via `canUseMarketing()` check
- ✅ Automatic PageView tracking on route changes
- ✅ Environment variable configuration (`NEXT_PUBLIC_FACEBOOK_PIXEL_ID`)
- ✅ Graceful handling when Pixel ID not configured

**Implementation**: `src/components/analytics/facebook-pixel-script.tsx`

### How It Works
1. Component checks `canUseMarketing()` from consent context
2. If consent granted and Pixel ID configured, initializes `ReactPixel`
3. Tracks PageView on initial load and on route changes
4. Does nothing if consent not granted (script never loads)

### Remaining Work (Future)
| Task | Priority | Notes |
|------|----------|-------|
| Configure Pixel ID in production | Pre-launch | Requires Facebook Business account |
| Add conversion events | Post-launch | Purchase, SignUp, etc. |
| Consider CAPI (server-side) | Future | For iOS 14+ tracking limitations |

### Testing
- Use Facebook Pixel Helper browser extension
- Use test Pixel ID in development/staging
- Production Pixel ID only in production environment


---

## 6. 30-Day Cleanup System

### Status: Defer Until Needed

**Why defer**: Phase 1 (soft delete + anonymization) already handles legal compliance. R2 storage for deleted users costs pennies. Building a cleanup system for 0-5 deletions in year one is premature.

### What Phase 1 Already Does
- Blocks user access (RLS policies)
- Anonymizes PII (email → `deleted_{uuid}@deleted.local`, name → "Deleted User")
- Soft-deletes uploads and images
- Preserves credit transactions for accounting

### What's Left Behind
- R2 files (still exist, but inaccessible)
- Database tombstones (anonymized, filtered by RLS)

**This is fine for early-stage.** Build cleanup when:
1. Account deletions become frequent
2. R2 storage costs become meaningful
3. Legal pressure requires actual file deletion

### When You Build It: Prefer R2 Lifecycle Rules

**Recommended approach** (no scheduled job):
1. On account deletion, move R2 files to `deleted/{user_id}/` prefix
2. Configure R2 lifecycle rule: delete objects in `deleted/*` after 30 days
3. Database tombstones: leave forever (already anonymized, negligible space)

**Why this over a cron job**:
- Cloudflare handles timing (no code to maintain)
- No blast radius from buggy scheduled job
- Zero ongoing maintenance

### If You Need a Scheduled Job Instead

Use Vercel Cron → `/api/cron/cleanup` → Supabase RPC.

Safeguards:
- Batch limits (100 users max per run)
- Dry-run mode before real deletion
- Audit log of every R2 key deleted

---

## Status Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Cookie Consent Infrastructure | ✅ Complete | Types, storage, provider, sync |
| Cookie Consent Banner UI | ❌ Remaining | Plan in archive |
| PostHog Analytics | ✅ Complete | Consent-aware |
| Facebook Pixel | ✅ Complete | Consent-aware |
| Credit Refunds (per-image) | ⏳ Planned | simple-implementation-plan.md |
| Account Deletion | ⏳ Planned | simple-implementation-plan.md |
| 30-Day Cleanup | 🔜 Deferred | Not needed yet |

## Remaining Work

### Pre-Launch
1. **Cookie consent banner UI** - Execute `docs/archive/cookie-consent-02-ui-components-plan.md`
2. **Credit refunds + account deletion** - Execute `docs/plans/legal-policy-simple-implementation-plan.md`

### When Needed
3. **30-day cleanup** - When R2 costs or legal pressure warrant it
4. **Cash refund flow** - When Stripe integration is worth the effort
5. **Pixel conversion events** - When running ads
