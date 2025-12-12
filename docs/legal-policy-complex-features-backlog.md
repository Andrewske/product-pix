# Legal Policy Complex Features - Backlog

## Overview
These features from the legal policy decisions document require separate planning due to their complexity. Each involves third-party integrations, legal compliance considerations, or significant infrastructure changes.

**Status**: Requires detailed planning before implementation
**Related**: See `docs/legal-policy-decisions.md` for policy requirements


## 3. Cookie Consent Banner

### Complexity: Medium
**Why Separate Plan Needed:**
- Legal compliance (GDPR, CCPA considerations even though US-only)
- UX patterns to avoid "dark patterns"
- Third-party consent library evaluation
- Integration with cookie preference system (already in simple plan)

### Requirements from Policy
- Opt-in approach (not dark pattern)
- Allow users to accept or decline cookies on first visit
- Must not block site functionality if declined
- Link to cookie preferences in account settings (simple plan handles this)

### Current State
- No consent banner implemented
- Privacy Policy documents opt-in tracking
- Cookie preferences UI planned (separate simple implementation)

### Key Challenges
- **Library selection**: Evaluate consent libraries (cookiebot, onetrust, klaro, custom)
- **Positioning**: Banner vs modal vs corner popup
- **Copy**: Legal-compliant but user-friendly language
- **Persistence**: How long to remember consent choice?
- **Granularity**: All-or-nothing vs per-category (analytics vs marketing)?
- **Re-consent**: When to ask again? (never, yearly, on policy change?)

### Technical Dependencies
- Cookie preference backend (simple plan implements this)
- Third-party consent library (to be selected)
- Analytics conditional loading (separate item below)

### UI Requirements
- Banner/modal on first visit
- Clear accept/decline buttons (no dark patterns)
- Link to privacy policy
- Link to customize preferences
- Minimal intrusion on UX

### Questions to Answer in Planning
1. Which consent library to use? (Or build custom?)
2. Banner vs modal vs corner popup?
3. How granular? (All cookies vs separate analytics/marketing toggles?)
4. How to handle returning users who haven't consented yet?
5. Do we need to track consent history for legal compliance?

---

## 4. Facebook Pixel Integration (Conditional Loading)

### Complexity: Medium
**Why Separate Plan Needed:**
- Third-party script conditional loading based on consent
- Facebook Business account setup
- Conversion event configuration
- Privacy-compliant data sharing

### Requirements from Policy
- Load Facebook Pixel ONLY if user opts in (marketing cookies)
- Use for ads tracking and optimization
- Must respect user cookie preferences

### Current State
- Not integrated
- Cookie preferences will exist (simple plan)
- Need conditional script loading infrastructure

### Key Challenges
- **Conditional loading**: Script must not load until consent given
- **Event tracking**: Which events to send? (PageView, Purchase, AddToCart, etc.)
- **Data sharing**: What user data does Pixel collect? Privacy implications?
- **Testing**: How to test without affecting production ad metrics?
- **Business setup**: Facebook Business account, ad account, pixel creation

### Technical Dependencies
- Cookie consent system (items #3 and simple plan)
- Next.js Script component with conditional rendering
- Environment variables for Pixel ID

### Implementation Considerations
- Use Next.js `<Script>` component with strategy
- Check `preferences.cookies.marketing === true` before loading
- Track conversion events: signup, credit purchase, batch generation
- Respect user privacy: no PII in Pixel events

### Questions to Answer in Planning
1. Which Facebook events to track? (Standard vs custom?)
2. How to test Pixel without polluting production data?
3. What user data is acceptable to send to Facebook?
4. Do we need Facebook CAPI (Conversions API) for server-side tracking?
5. How to handle users who opt out after Pixel already loaded?


---

## 6. Data Anonymization System (Automated)

### Complexity: High
**Why Separate Plan Needed:**
- GDPR/privacy compliance for deleted accounts
- Scheduled job infrastructure (Supabase Edge Functions, cron)
- Cascading anonymization logic
- Audit trail requirements

### Requirements from Policy
- Personal data deleted on account deletion
- Anonymized usage kept for analytics
- 30-day restore window (soft delete period)

### Current State
- Simple plan implements soft delete + basic anonymization (email, name)
- No automated cleanup after 30-day window
- No comprehensive anonymization strategy

### Key Challenges
- **Scheduled jobs**: Need cron or Edge Function to run daily
- **Cascading anonymization**: What data to anonymize in related tables?
- **Audit trail**: Preserve enough for accounting/legal, remove PII
- **R2 storage**: Delete images from R2, not just database
- **Restore mechanism**: Manual support process for 30-day window

### Data to Anonymize
| Table | Personal Data | Anonymization Strategy |
|-------|---------------|------------------------|
| `users` | email, display_name | Hash or generic value |
| `credit_transactions` | description (may contain names) | Strip PII, keep amounts |
| `jobs` | prompt (may contain PII) | Hash or "Deleted prompt" |
| `uploads` | file_key, metadata | Delete from R2 |
| `generated_images` | file_key, title | Delete from R2 |

### Technical Dependencies
- Supabase Edge Function or external cron job
- Database function for bulk anonymization
- R2 deletion utilities
- Audit logging for compliance

### Implementation Considerations
- **Daily cron**: Find accounts with `deleted_at` older than 30 days
- **Transaction safety**: Run in database transaction for atomicity
- **R2 cleanup**: Delete files from R2 bucket
- **Logging**: Log all anonymization actions for audit
- **Metrics**: Track anonymization runs (success, failures, records affected)

### Questions to Answer in Planning
1. Where to run scheduled job? (Supabase Edge Function, Vercel Cron, external service?)
2. What data is "anonymized usage" we want to keep?
3. Should we hard-delete or keep tombstone records?
4. How to handle restore requests within 30-day window?
5. Do we need to notify users before final deletion? (Email at day 28?)
6. What audit logs to maintain for compliance?

---

## Priority Recommendations

### Must-Have (Before Significant Revenue)
1. **Cash refund flow** - Legal requirement, user expectation
2. **Cookie consent banner** - Legal compliance, brand trust

### Should-Have (First 6 Months)
3. **Analytics integration** - Product decisions, funnel optimization
4. **Data anonymization system** - Privacy compliance, risk mitigation

### Nice-to-Have (After Product-Market Fit)
5. **Facebook Pixel** - Ad optimization, growth channel
6. **A/B testing refund percentages** - Revenue optimization

---

## Next Steps

For each feature, create a separate detailed implementation plan that addresses:
1. Technical architecture and dependencies
2. Third-party service evaluation (if applicable)
3. Legal/compliance review checklist
4. Security and privacy considerations
5. Testing strategy (including edge cases)
6. Rollout plan (feature flags, gradual rollout)
7. Monitoring and alerting
8. Rollback procedures

**Recommendation**: Start with items #1 (cash refunds) and #2 (cookie banner) as these are legal/compliance requirements before scaling revenue.
