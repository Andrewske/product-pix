# Stripe Setup Guide

This guide covers setting up Stripe payments and subscriptions for ProductPix.

## Prerequisites

1. **Stripe Account**: Create a Stripe account at https://stripe.com
2. **Test Mode**: Use test mode for development
3. **Webhook Endpoint**: Set up webhook endpoint for production

## Environment Variables

Add these to your `.env.local` file:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PACK_50=price_...
STRIPE_PRICE_PACK_200=price_...
STRIPE_PRICE_PACK_500=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_BUSINESS_MONTHLY=price_...
```

## Stripe Dashboard Setup

### 1. Create Products and Prices

Create these products in your Stripe Dashboard (test mode):

#### Credit Packs
- **50 Credits**: $10.00 one-time
- **200 Credits**: $30.00 one-time  
- **500 Credits**: $60.00 one-time

#### Subscription Plans
- **Pro Plan**: $20.00/month, 200 credits
- **Business Plan**: $50.00/month, 600 credits

### 2. Copy Price IDs

After creating prices, copy the price IDs (starting with `price_`) to your environment variables.

### 3. Configure Customer Portal

In Stripe Dashboard:
- Go to Settings > Billing > Customer portal
- Enable: Cancel subscriptions, Update payment methods, Update subscriptions
- Set return URL: `https://yourdomain.com/settings/billing`

### 4. Webhook Setup

For local development:
```bash
# Install Stripe CLI
# Follow: https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

For production:
- Set webhook endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
- Select these events:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

## Database Migration

Run the migration to create Stripe tables:

```bash
npx supabase db push
```

This creates:
- `stripe_subscriptions` table
- `stripe_purchases` table
- New transaction types: `pack_purchase`, `subscription_renewal`, `subscription_upgrade`

## Testing

### Test Cards

Use these test cards in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

### Test Flow

1. Go to `/pricing`
2. Purchase a credit pack or subscribe
3. Complete checkout with test card
4. Verify credits added to account
5. Check `/settings/billing` for purchase history

### Webhook Testing

Use Stripe CLI to trigger test events:

```bash
# Trigger invoice payment (subscription renewal)
stripe trigger invoice.payment_succeeded

# Trigger subscription cancellation
stripe trigger customer.subscription.deleted
```

## Production Deployment

### Checklist

- [ ] Switch to live mode in Stripe Dashboard
- [ ] Update environment variables with live keys
- [ ] Create live products and prices
- [ ] Update webhook endpoint URL
- [ ] Test with real payment methods
- [ ] Enable monitoring and alerts

### Security Notes

- Never expose `STRIPE_SECRET_KEY` to client-side code
- Always verify webhook signatures
- Use HTTPS for webhook endpoints
- Store customer IDs securely

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**
   - Ensure `STRIPE_WEBHOOK_SECRET` is correct
   - Check webhook endpoint uses raw body

2. **Credits not granted**
   - Check webhook events are being processed
   - Verify customer metadata includes `userId`
   - Check database for failed transactions

3. **Checkout session creation fails**
   - Verify price IDs are correct
   - Check customer creation succeeded
   - Ensure environment variables are set

### Logs

Check application logs for:
- Stripe API errors
- Webhook processing errors
- Database transaction failures

## Support

For Stripe-specific issues:
- Stripe Dashboard > Developers > Logs
- Stripe Documentation: https://stripe.com/docs
- ProductPix Discord/GitHub for application-specific issues
