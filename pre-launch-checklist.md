# ProductPix Pre-Launch Testing Checklist

Manual QA checklist covering all user flows before release.

---

## 1. Authentication Flows

### Sign Up
- [ ] Email/password signup creates account
- [ ] Email/password signup validates password (min 8 chars)
- [ ] Email/password signup confirms passwords match
- [ ] Email confirmation is sent
- [ ] Clicking email confirmation link works
- [ ] User record created in `public.users` with `credit_balance = 0`
- [ ] Google OAuth signup works
- [ ] Google OAuth creates user record correctly
- [ ] Signup redirects to dashboard on success

### Sign In
- [ ] Email/password login works
- [ ] Invalid credentials show error message
- [ ] Google OAuth login works
- [ ] Login redirects to dashboard (or custom `redirectTo`)
- [ ] Session persists across page refreshes
- [ ] Session persists across browser close/reopen

### Sign Out
- [ ] Sign out clears session
- [ ] Sign out redirects to login page
- [ ] Protected pages redirect after sign out

### Password Reset
- [ ] Forgot password sends reset email
- [ ] Reset link works
- [ ] Password update validates min 8 chars
- [ ] Password update redirects to dashboard

---

## 2. Single Image Generation

### Upload Flow
- [x] Drag-and-drop upload works
- [x] Click-to-browse upload works
- [x] JPEG files accepted
- [x] PNG files accepted
- [x] WebP files accepted
- [x] Invalid file types rejected (GIF, BMP, etc.)
- [x] Files > 10MB rejected
- [x] Upload preview displays correctly
- [x] Upload progress indicator works
- [x] Upload to R2 completes successfully
- [x] Upload confirmation creates DB record

### Template Selection
- [x] Templates load from `/api/templates`
- [x] Template list displays correctly
- [x] Template selection updates UI

### Aspect Ratio Selection
- [x] 1:1 selectable
- [x] 4:3 selectable
- [x] 3:4 selectable
- [x] 16:9 selectable
- [x] 9:16 selectable
- [x] 3:2 selectable
- [x] 2:3 selectable

### Generation
- [ ] Generate button enabled when template selected
- [ ] Generate button shows credit cost
- [ ] Generation with source image works
- [ ] Generation without source image works (text-to-image)
- [ ] Loading state during generation
- [x] Result image displays correctly
- [ ] Download button works
- [ ] Regenerate button works
- [ ] Credits deducted after successful generation
- [ ] Job record created in database
- [ ] Generated image record created in database
- [ ] Image uploaded to R2 correctly

### Error Handling
- [ ] Insufficient credits shows modal (402 response)
- [ ] Insufficient credits modal shows balance vs required
- [ ] Insufficient credits modal links to pricing
- [ ] Rate limit shows appropriate message (429)
- [ ] Content filtering error handled gracefully
- [ ] Network error shows retry option
- [ ] Failed generation refunds credits

---

## 3. Batch Generation

### CSV Upload
- [ ] CSV file upload works
- [ ] CSV parsing validates required columns
- [ ] CSV parsing shows validation errors
- [ ] Max 100 items limit enforced
- [ ] CSV template download link works

### Batch Creation
- [ ] Batch preview shows parsed items correctly
- [ ] Batch name input works (optional)
- [ ] Create batch button works
- [ ] Credits charged atomically on batch creation
- [ ] Batch record created in database

### Batch Monitoring
- [ ] Batch list shows all user batches
- [ ] Batch status displays correctly (pending, processing, completed, failed)
- [ ] Progress indicator for processing batches
- [ ] Batch detail page loads correctly
- [ ] Individual item statuses visible

### Batch Actions
- [ ] Cancel batch works (pending/processing only)
- [ ] Cancel refunds credits for pending items
- [ ] Completed batches show all generated images

---

## 4. Dashboard / Gallery

### Image Display
- [ ] Dashboard loads for authenticated user
- [ ] Recent batches section shows last 3 batches
- [ ] Generated images display in grid
- [ ] Empty state shows when no images
- [ ] Image thumbnails load correctly

### Navigation
- [ ] "Create Batch" button navigates to `/batch/new`
- [ ] "Generate New" button navigates to `/generate`
- [ ] "View All Batches" navigates to `/batch`
- [ ] Individual image click shows detail view

### Image Actions
- [ ] Download individual image works
- [ ] Delete image works (soft delete)
- [ ] Favorite toggle works (if implemented)

---

## 5. Credit System

### Balance Display
- [ ] Credit balance displays in header/nav
- [ ] Credit balance updates after generation
- [ ] Credit balance updates after purchase
- [ ] Credit balance accurate in settings

### Transaction History
- [ ] Transaction history loads in settings
- [ ] Shows pack purchases
- [ ] Shows subscription renewals
- [ ] Shows generation deductions
- [ ] Shows refunds
- [ ] Ordered by date (newest first)

---

## 6. Payments - Credit Packs

### Purchase Flow
- [ ] Pricing page loads
- [ ] Credit packs display with prices
- [ ] "Buy" button redirects to Stripe
- [ ] Stripe checkout completes successfully
- [ ] Success page shows after payment
- [ ] Credits granted after payment
- [ ] `stripe_purchases` record created
- [ ] `credit_transactions` record created

### Idempotency
- [ ] Duplicate webhook doesn't double-grant credits
- [ ] Refreshing success page doesn't grant extra credits

---

## 7. Payments - Subscriptions

### Subscribe Flow
- [ ] Subscription tiers display on pricing page
- [ ] Subscribe button redirects to Stripe
- [ ] Stripe subscription checkout works
- [ ] Credits granted on initial subscription
- [ ] User tier updated in database

### Renewal
- [ ] Monthly renewal grants credits
- [ ] Renewal is idempotent (no duplicates)

### Management
- [ ] Billing portal link works
- [ ] Can view subscription in Stripe portal
- [ ] Can update payment method
- [ ] Can cancel subscription
- [ ] Cancellation stops future renewals

---

## 8. Settings

### Profile Tab
- [ ] Settings page loads
- [ ] Profile tab displays user info
- [ ] Can update display name (if implemented)

### Billing Tab
- [ ] Billing tab shows credit balance
- [ ] Shows subscription status
- [ ] "Manage Subscription" opens Stripe portal
- [ ] Transaction history displays

---

## 9. Error Pages & Edge Cases

### 404 / Not Found
- [ ] Invalid routes show 404 page
- [ ] 404 page has navigation back

### Authentication Guards
- [ ] Unauthenticated users redirected from `/dashboard`
- [ ] Unauthenticated users redirected from `/generate`
- [ ] Unauthenticated users redirected from `/batch`
- [ ] Unauthenticated users redirected from `/settings`

### Ownership Checks
- [ ] Cannot view another user's batch
- [ ] Cannot cancel another user's batch
- [ ] Cannot delete another user's image

### Rate Limiting
- [ ] Generation rate limit enforced
- [ ] Rate limit shows retry-after time

---

## 10. Landing Page (Unauthenticated)

- [ ] Landing page loads
- [ ] Hero section displays
- [ ] Features section displays
- [ ] "How it Works" section displays
- [ ] Pricing section displays
- [ ] "Get Started Free" navigates to signup
- [ ] "Sign Up" in header navigates to signup
- [ ] Footer links work

---

## 11. Mobile / Responsive

- [ ] Landing page responsive
- [ ] Login/signup pages responsive
- [ ] Dashboard responsive
- [ ] Generate page responsive
- [ ] Batch pages responsive
- [ ] Settings responsive
- [ ] Pricing page responsive

---

## 12. Performance & Reliability

- [ ] Pages load within acceptable time (<3s)
- [ ] No console errors on page load
- [ ] Images lazy load correctly
- [ ] API responses are reasonably fast
- [ ] Large batch uploads don't timeout

---

## 13. Security

- [ ] API routes require authentication where expected
- [ ] RLS policies prevent cross-user data access
- [ ] Presigned URLs expire correctly
- [ ] No sensitive data in client-side logs
- [ ] HTTPS enforced in production
- [ ] CORS configured correctly for R2

---

## Pre-Launch Final Checks

- [ ] Environment variables set correctly in production
- [ ] Database migrations applied
- [ ] Stripe webhook endpoint configured
- [ ] R2 CORS rules applied
- [ ] Error monitoring active (if configured)
- [ ] Analytics tracking (if configured)
