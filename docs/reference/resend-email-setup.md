# Resend Email Setup Guide

## Overview
This guide covers setting up Resend email service for ProductPix, including both development and production configurations.

## 1. Resend Account Setup

1. Sign up at [resend.com](https://resend.com)
2. Generate an API key from your dashboard
3. Copy the key (starts with `re_`)

## 2. Domain Verification

### Development/Testing
- Use `onboarding@resend.dev` for testing (free, emails only to your verified address)
- No domain verification required for development

### Production
1. Add your domain in the Resend dashboard
2. Configure DNS records (SPF, DKIM, DMARC)
3. Wait 10-30 minutes for verification
4. Use `noreply@productpix.com` after verification

## 3. Environment Variables

Add these to your environment configuration:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@productpix.com  # or onboarding@resend.dev
ADMIN_EMAIL=admin@yourdomain.com
EMAIL_ENABLED=true
```

## 4. Supabase SMTP Configuration

Configure in Supabase Dashboard (not config.toml):

1. Navigate to: **Authentication > Email Templates > SMTP Settings**
2. Enable **Custom SMTP**: ON
3. **Host**: `smtp.resend.com`
4. **Port**: `587`
5. **Username**: `resend`
6. **Password**: Your `RESEND_API_KEY`
7. **Sender Email**: `noreply@productpix.com`
8. **Sender Name**: `ProductPix`
9. Click **Save**
10. Test by signing up with a new account

## 5. Testing Procedures

### Local Development
- Set `EMAIL_ENABLED=false` in `.env.local`
- Use Inbucket at http://127.0.0.1:54324 for auth emails
- Contact form stores in DB but doesn't send emails

### Test Environment
- Use `onboarding@resend.dev` as sender
- Verify emails arrive at your verified address
- Test both auth flows and contact form

### Production
- Use verified domain sender
- Monitor delivery metrics in Resend dashboard
- Test all email flows: signup, password reset, contact form

## 6. Rate Limits & Cost

- **Free tier**: 100 emails/day, 3,000/month
- **Estimated usage**: ~70/month for ProductPix
- **Upgrade trigger**: $20/month for 50k emails
- Monitor usage in Resend dashboard

## 7. Troubleshooting

### Auth emails not sending
- Check Supabase SMTP configuration
- Verify `RESEND_API_KEY` is correct
- Check Resend dashboard for errors

### Contact form emails failing
- Verify `EMAIL_ENABLED=true` in production
- Check application logs for Resend SDK errors
- Confirm admin email is set correctly

### Emails going to spam
- Ensure domain is properly verified
- Check SPF/DKIM/DMARC records
- Monitor sender reputation in Resend dashboard

### General debugging
- Check application logs for email-related errors
- Test with curl: `curl -X POST https://api.resend.com/emails -H "Authorization: Bearer $RESEND_API_KEY" -H "Content-Type: application/json" -d '{"from":"test@resend.dev","to":"your@email.com","subject":"test","html":"<p>test</p>"}'`

## 8. Security Best Practices

- Never commit API keys to version control
- Rotate keys quarterly
- Use separate keys for dev/staging/production environments
- Monitor usage for unusual activity
- Store keys securely (environment variables, not hardcoded)

## 9. Monitoring & Maintenance

- Set up usage alerts in Resend dashboard
- Monitor delivery rates and bounce rates
- Regularly review email templates for updates
- Keep domain verification current
- Archive old email data as needed

## 10. Rollback Procedures

If email issues occur in production:

1. Set `EMAIL_ENABLED=false` in environment
2. Redeploy application
3. Contact form continues working (DB storage only)
4. Auth emails revert to Supabase defaults
5. Debug via Resend dashboard and application logs
6. Re-enable after fixing: `EMAIL_ENABLED=true`