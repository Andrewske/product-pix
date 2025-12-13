# Manual Testing and Verification

## Implementation Details

This is the final verification task to ensure the entire observability system works end-to-end.

### Manual Testing Checklist

**Error Tracking:**
- [ ] Trigger error in API route → appears in Vercel logs with requestId
- [ ] Critical error (payment/credit) → saved to critical_errors table
- [ ] All errors → queued to posthog_event_queue table
- [ ] Cron runs (`/api/cron/posthog-sync`) → PostHog events processed
- [ ] Check PostHog dashboard → events appear with sanitized context

**Toast System:**
- [ ] `toast.success('msg')` → shows success toast
- [ ] `toast.error('string')` → shows error toast, NOT tracked
- [ ] `toast.error(ProductPixError)` → shows toast AND auto-tracked
- [ ] `toast.error(new Error())` → shows toast, NOT tracked

**Admin Dashboard:**
- [ ] Visit `/admin/users/[userId]` → timeline loads
- [ ] Timeline shows merged events from DB + PostHog
- [ ] Filters work (severity, domain, resolved status, date range)
- [ ] Click "Resolve" on DB error → sets resolved_at timestamp
- [ ] Click "Unresolve" → clears resolution fields
- [ ] Infinite scroll "Load More" → fetches next page

**PII Sanitization:**
- [ ] Error with email in context → email field NOT in PostHog
- [ ] Error with IP in string value → replaced with [IP] in PostHog
- [ ] Error with credit card pattern → replaced with [CARD] in PostHog
- [ ] Same error in database → FULL context including PII preserved

**Request Context:**
- [ ] All server logs include requestId
- [ ] requestId matches across Vercel logs → PostHog → DB
- [ ] Can trace single request through entire system

**Environment Variables:**
- [ ] Production with OBSERVABILITY_ENABLED=true → fails if PostHog vars missing
- [ ] Production with OBSERVABILITY_ENABLED=false → runs without PostHog
- [ ] Development → runs regardless of PostHog vars

**Error Boundary:**
- [ ] Throw ProductPixError in component → caught and tracked
- [ ] Throw generic Error → caught but NOT tracked

### Integration Testing Scenarios

1. **Create ProductPixError → captureError() → verify DB + queue entries**
   - Create PaymentError in API route
   - Check critical_errors table for entry
   - Check posthog_event_queue table for entry
   - Verify context is sanitized in queue

2. **PostHog sync cron → process queue → verify PostHog called**
   - Queue multiple events
   - Call `/api/cron/posthog-sync`
   - Verify processed_at set
   - Check PostHog dashboard for events

3. **Admin timeline API → verify merged DB + PostHog results**
   - Create mix of DB errors and PostHog events
   - Call `/api/admin/users/[userId]/timeline`
   - Verify both sources merged
   - Verify sorted by timestamp DESC

4. **Error resolution → POST /api/admin/errors/[id]/resolve → verify resolved_at set**
   - Create critical error
   - Call resolve API
   - Verify resolved_at timestamp set
   - Verify resolved_by set to admin user ID

### Verification Commands

```bash
# Check Vercel logs for structured JSON
vercel logs --follow

# Query critical errors
psql -c "SELECT * FROM critical_errors ORDER BY created_at DESC LIMIT 5;"

# Query PostHog queue
psql -c "SELECT * FROM posthog_event_queue WHERE processed_at IS NULL;"

# Run cron manually
curl http://localhost:3000/api/cron/posthog-sync

# Check PostHog dashboard
open https://app.posthog.com
```

## Acceptance Criteria
- [ ] All manual testing checklist items pass
- [ ] All integration scenarios verified
- [ ] No errors in browser console
- [ ] No errors in Vercel logs
- [ ] PostHog events appear correctly
- [ ] Database entries correct
- [ ] PII sanitized in PostHog, preserved in DB
- [ ] Admin dashboard fully functional

## Dependencies
All previous tasks (01-21) must be complete
