# Analytics Guide

## Overview

ProductPix uses PostHog for comprehensive analytics with privacy-first configuration. All events are typed, validated, and tracked consistently.

## Event Catalog

### Auth Events
- `user_signed_up`: New user registration
- `user_logged_in`: User login
- `user_logged_out`: User logout

### Generation Events
- `generation_started`: Generation initiated
- `generation_completed`: Generation successful
- `generation_failed`: Generation error
- `image_downloaded`: Image download

### Batch Events
- `batch_created`: Batch creation
- `batch_completed`: Batch finished
- `batch_cancelled`: Batch cancelled

### Payment Events
- `credits_purchased`: Credit pack purchase
- `subscription_started`: Subscription activation
- `subscription_cancelled`: Subscription cancellation
- `insufficient_credits`: Credit shortage

### Navigation Events
- `pricing_viewed`: Pricing page view
- `dashboard_viewed`: Dashboard view
- `template_selected`: Template selection

### System Events
- `error_occurred`: Application error
- `rate_limit_hit`: Rate limit exceeded
- `ab_test_exposure`: A/B test variant assignment

## How to Add New Events

1. **Define Schema**: Add Zod schema and TypeScript type in `src/lib/analytics/events.ts`
2. **Implement Tracking**: Use `trackEvent()` in components or `trackServerEvent()` in APIs
3. **Add Tests**: Create unit tests for validation and tracking

## A/B Testing

Custom implementation using hash-based assignment with localStorage persistence. Exposure tracked via `ab_test_exposure` events.

## User Properties

Only immutable properties: `email`, `tier`, `created_at`. Never include mutable data like credit balance.

## Best Practices

- Use snake_case for all property names
- Validate events with Zod schemas
- Wrap tracking in try-catch
- Use server queue for webhooks to prevent blocking
- Follow privacy principles: mask sensitive data, identified users only