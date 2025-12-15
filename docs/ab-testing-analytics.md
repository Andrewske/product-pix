# A/B Testing Analytics

## Overview

ProductPix uses a custom A/B testing implementation that combines client-side variant assignment with PostHog analytics for comprehensive experiment tracking.

## How It Works

### Variant Assignment
- **Method**: Hash-based consistent assignment using user ID or session ID
- **Storage**: localStorage for guaranteed persistence across sessions
- **Fallback**: Random assignment for anonymous users

### Analytics Integration
- **Exposure Tracking**: `ab_test_exposure` events sent to PostHog on variant assignment
- **Conversion Tracking**: Standard PostHog events with variant context
- **Analysis**: PostHog queries to compare variant performance

## Current Tests

- `LANDING_HERO`: Hero section variations (A/B, 50/50 split)
- `PRICING_DISPLAY`: Pricing page layout variations (A/B, 70/30 split)

## Tracking Pattern

### Exposure Events
```typescript
trackEvent({
  event: 'ab_test_exposure',
  properties: {
    test_name: 'landing_hero',
    variant: 'A',
    user_id: 'user-123' // optional
  }
});
```

### Conversion Analysis
Use PostHog to filter users by variant exposure and measure conversion rates:

```
Filter: ab_test_exposure.test_name = 'landing_hero' AND ab_test_exposure.variant = 'B'
Measure: credits_purchased events / unique users
```

## Best Practices

1. **Consistent Assignment**: Variant assignment is stable per user
2. **Privacy**: No sensitive data in exposure events
3. **Persistence**: Variants survive browser restarts
4. **Analytics**: All conversion events can be attributed to test variants

## Adding New Tests

1. Add to `AB_TESTS` config in `src/lib/ab-testing.ts`
2. Call `trackABTestEvent()` when user sees the test
3. Analyze results in PostHog using exposure filters