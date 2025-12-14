# Documentation and Deployment Setup

## Overview
Update project documentation and create deployment guide for Resend email service.

## Files to Modify/Create
- `docs/reference/resend-email-setup.md` (create new)
- `supabase/config.toml` (modify - add SMTP comments)
- `CLAUDE.md` (modify - update architecture docs)
- `TODO.md` (modify - mark task complete)

## Implementation Details

### File: `docs/reference/resend-email-setup.md` (new)

Create comprehensive deployment guide covering:

**Key Sections:**
1. **Resend Account Setup**
   - Sign up at resend.com
   - Generate API key
   - Copy key (starts with `re_`)

2. **Domain Verification** (Production)
   - Use `onboarding@resend.dev` for testing (free, emails only to your verified address)
   - For production: Add domain, configure DNS records (SPF, DKIM, DMARC)
   - Wait 10-30 minutes for verification
   - Use `noreply@productpix.com` after verification

3. **Environment Variables**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   RESEND_FROM_EMAIL=noreply@productpix.com  # or onboarding@resend.dev
   ADMIN_EMAIL=admin@yourdomain.com
   EMAIL_ENABLED=true
   ```

4. **Supabase SMTP Configuration** (Dashboard)
   - Navigate to: Authentication > Email Templates > SMTP Settings
   - Enable Custom SMTP: ON
   - Host: `smtp.resend.com`
   - Port: `587`
   - Username: `resend`
   - Password: Your `RESEND_API_KEY`
   - Sender Email: `noreply@productpix.com`
   - Sender Name: `ProductPix`
   - Click Save
   - Test by signing up with new account

5. **Testing Procedures**
   - Local dev (EMAIL_ENABLED=false, Inbucket)
   - Test environment (onboarding@resend.dev)
   - Production (verified domain)

6. **Rate Limits & Cost**
   - Free tier: 100 emails/day, 3,000/month
   - Estimated usage: ~70/month
   - Upgrade trigger: $20/month for 50k

7. **Troubleshooting**
   - Auth emails not sending
   - Contact form emails failing
   - Emails going to spam
   - Verify domain, check logs, test with curl

8. **Security Best Practices**
   - Never commit API keys
   - Rotate keys quarterly
   - Separate keys for dev/staging/production
   - Monitor usage for unusual activity

### File: `supabase/config.toml` (lines 188-196)

Add detailed comments but keep SMTP configuration commented for local dev:

```toml
# Use a production-ready SMTP server (commented out for local dev)
# For production, configure in Supabase Dashboard instead:
# Auth > Email Templates > SMTP Settings
#
# [auth.email.smtp]
# enabled = true
# host = "smtp.resend.com"
# port = 587
# user = "resend"
# pass = "env(RESEND_API_KEY)"
# admin_email = "env(ADMIN_EMAIL)"
# sender_name = "ProductPix"
```

### File: `CLAUDE.md` (after Architecture section, around line 50)

Add email service architecture:

```markdown
**Email Service:**
- Provider: Resend (SMTP for auth, SDK for contact form)
- Local dev: Inbucket (http://127.0.0.1:54324)
- Production: Configured via env vars (`RESEND_API_KEY`, `EMAIL_ENABLED`)
- Contact emails: Admin notification + user acknowledgment
- Error handling: Failures logged but don't block submissions
```

### File: `TODO.md` (update Active section, line 4)

Mark email configuration task as complete:

```markdown
- [x] **Configure SMTP for production email**: ~~Set up production email provider~~ **COMPLETED: Resend integrated**
  - See `docs/reference/resend-email-setup.md` for deployment steps
  - Next: Create Resend account, get API key, add env vars, configure Supabase SMTP
```

## Acceptance Criteria
- ✓ Deployment guide is comprehensive and accurate
- ✓ All setup steps verified manually
- ✓ Covers both testing and production scenarios
- ✓ CLAUDE.md reflects new email architecture
- ✓ TODO.md updated to show completion
- ✓ Supabase config documented (but commented for local)

## Dependencies
- Tasks 01-05 completed (implementation done, ready to document)

## Deployment Checklist (Production)

When ready to deploy to production:

1. ✓ Create Resend account at resend.com
2. ✓ Get API key from dashboard
3. ✓ Add environment variables to production hosting platform
4. ✓ Configure Supabase SMTP in dashboard (not config.toml)
5. ✓ Test signup flow → verify confirmation email received
6. ✓ Test password reset → verify reset email received
7. ✓ Test contact form → verify both admin and user emails
8. ✓ Monitor Resend dashboard for delivery metrics
9. ✓ Set up usage alerts (approaching 3,000/month limit)

## Local Development Notes

- Keep `EMAIL_ENABLED=false` in `.env.local`
- Supabase auth emails go to Inbucket: http://127.0.0.1:54324
- Contact form stores in DB but doesn't send emails
- Check logs for "Email sending disabled (dev mode)" messages

## Rollback Plan

If emails fail in production:
1. Set `EMAIL_ENABLED=false` in production environment
2. Redeploy application
3. Contact form continues working (DB storage)
4. Auth emails revert to Supabase defaults
5. Debug via Resend dashboard logs
6. Re-enable after fixing: `EMAIL_ENABLED=true`
