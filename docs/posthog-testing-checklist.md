# PostHog Testing Checklist

## Setup Verification
- [ ] PostHog initializes in browser console
- [ ] Environment variables configured correctly
- [ ] PostHog dashboard shows events

## User Identification
- [ ] User identified after login (check PostHog Live Events)
- [ ] User properties include email, tier, created_at
- [ ] User properties exclude credit_balance

## Page Tracking
- [ ] Pageviews tracked on navigation
- [ ] Pageviews tracked on initial load

## Generation Events
- [ ] generation_started fired on submit
- [ ] Event properties use snake_case
- [ ] generation_completed fired on success
- [ ] generation_failed fired on error
- [ ] image_downloaded fired on download

## Batch Events
- [ ] batch_created fired on creation
- [ ] batch_completed fired when finished
- [ ] batch_cancelled fired on cancel

## Payment Events
- [ ] credits_purchased tracked on purchase
- [ ] subscription_started tracked on activation
- [ ] subscription_cancelled tracked on cancel
- [ ] insufficient_credits tracked on shortage

## System Events
- [ ] rate_limit_hit tracked when exceeded
- [ ] ab_test_exposure tracked on variant assignment
- [ ] error_occurred tracked on errors

## Privacy & Security
- [ ] Session replays show masked inputs
- [ ] URL parameters masked in replays
- [ ] Email/password fields masked
- [ ] Payment redirect URLs masked

## Source Maps
- [ ] Source maps show file names in errors (after deploy)
- [ ] Vercel integration uploads source maps

## Monitoring
- [ ] Billing alert set at 80% usage
- [ ] Session replay sampling configured
- [ ] Data retention configured