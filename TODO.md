# TODO

## Active
- [x] **Configure SMTP for production email**: ~~Set up production email provider~~ **COMPLETED: Resend integrated**
  - See `docs/reference/resend-email-setup.md` for deployment steps
  - Next: Create Resend account, get API key, add env vars, configure Supabase SMTP
- [ ] **Complete pre-launch QA testing**: Execute comprehensive manual testing checklist covering authentication flows, image generation, batch processing, credit system, payments, settings, error handling, landing page, mobile responsiveness, performance, and security (303 checklist items).
- [ ] **Implement cookie consent foundation**: Build TypeScript types, storage abstraction (database + localStorage), sync logic, and React Context provider for cookie consent state management.
- [ ] **Create cookie consent UI components**: Add bottom-corner consent banner with accept/reject buttons and Privacy settings tab with granular toggles for analytics and marketing preferences.
- [ ] **Integrate analytics with consent**: Wire up PostHog and Facebook Pixel scripts with conditional loading based on user consent preferences, including environment variables and root layout integration.
- [ ] **Add generation feedback system**: Implement thumbs up/down feedback on generated images with reasons for dissatisfaction, database schema, API endpoints, and UI components.

## Future
- [ ] Use jsx.email for email templates
- [ ] Need to create an email series.
- [ ] Need to create an email series.
- [ ] Want to create a chatbot.
- [ ] I want an admin dashboard where I can see users, their usage history, total usage history, errors, payments, outstanding credits, user profiles, messaging capabilities, and feedback.
- [ ] Need to create an option to generate more than 1 photo and at different angles.
- [ ] Data Anonymization System when a user deletes their account.
- [ ] Plan feedback system enhancements: Design chat/messaging system, sentiment analysis, admin dashboard, job-level ratings, and self-service refund integration for future implementation.
- [ ] Implement legal policy features: Add credit refunds (30-day window), cookie preferences UI, and account deletion flow with soft delete and anonymization.
- [ ] Create user onboarding flow: Build multi-step wizard guiding new users through first image generation, credit grants, and upsell opportunities with progress tracking.
- [ ] Integrate PostHog analytics: Replace custom A/B testing with PostHog feature flags, add comprehensive event tracking, session replay, error monitoring, and source map uploads.
- [ ] Migrate A/B testing to feature flags: Update existing A/B testing implementation to use PostHog feature flags for unified analytics platform and better experiment analysis.
## Completed
