# Legal & Policy Decisions

Summary of Terms of Service and Privacy Policy decisions for ProductPix.

## Target Market

- **US customers only** (initial launch)
- **18+ age requirement** (Stripe/contract requirement)

## Credits & Payments

| Decision | Details |
|----------|---------|
| Credit model | Prepaid credit packs |
| Expiration | **Never** — lifetime credits |
| Payment processor | Stripe |
| Currency | USD only |

## Refunds

| Type | Implementation |
|------|----------------|
| Credit refund (bad generation) | Self-service, instant, no questions |
| Cash refund | Self-service with choice: 100% or 90% ("help cover costs") |

**TODO:**
- [ ] Build self-service credit refund UI (per-generation)
- [ ] Build self-service cash refund flow with 90%/100% choice
- [ ] A/B test refund percentages (85%, 90%, 95%)

## Data & Images

| Data Type | Retention |
|-----------|-----------|
| Uploaded images | Deleted after processing |
| Generated images | 30 days |
| Account data | Until deletion |
| Anonymized usage | Indefinite |

## Image Rights

| Use Case | Policy |
|----------|--------|
| Generated images | **User owns 100%**, full commercial rights |
| Internal testing | Allowed (for prompt improvement) |
| Marketing | **Explicit permission required** |

## Cookies & Tracking

| Type | Consent |
|------|---------|
| Essential (auth) | Always on |
| Analytics | Opt-in |
| Facebook Pixel | Opt-in |

**TODO:**
- [ ] Implement cookie consent banner (opt-in, not dark pattern)
- [ ] Add cookie preferences to account settings
- [ ] Integrate Facebook Pixel (load only if consented)
- [ ] Set up analytics (load only if consented)

## Account Management

| Feature | Implementation |
|---------|----------------|
| Account deletion | Self-service in settings |
| Data on deletion | Personal data deleted, anonymized usage kept |
| Account termination | ProductPix can terminate for ToS violations |

**TODO:**
- [ ] Build account deletion flow in settings
- [ ] Implement data anonymization on deletion

## Third-Party Services (disclosed in Privacy Policy)

- Stripe (payments)
- Supabase (database/auth)
- Cloudflare R2 (image storage)
- Google Gemini (AI generation)
- Facebook (ads, if opted-in)

## Contact Emails

- Terms/Support: `support@productpix.ai`
- Privacy: `privacy@productpix.ai`

**TODO:**
- [ ] Set up email forwarding for these addresses

## Legal Pages

- `/terms` — Terms of Service
- `/privacy` — Privacy Policy

Both use plain English, no legalese. AI-drafted — recommend legal review before significant revenue.
