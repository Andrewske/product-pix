# Feedback System Implementation - Task Breakdown

**Plan**: lively-splashing-oasis
**Generated**: 2025-12-14

## Overview

This directory contains the implementation-ready task sequence for building ProductPix's comprehensive feedback system with chat/messaging and sentiment analysis.

## Task Sequence

### Phase 1: Core Chat System (Tasks 01-06)

**01. Database Schema: User Messages & Sentiment Queue**
- Create `user_messages` table with RLS policies
- Create `sentiment_analysis_queue` table
- Mirror `image_feedback` pattern exactly

**02. Backend: Message Types and Database Functions**
- Type definitions in `src/types/messages.ts`
- CRUD functions in `src/lib/db/messages.ts`
- Message submission, retrieval, admin replies, mark as read

**03. API Routes: User Messages**
- `POST /api/messages` - Submit user message
- `GET /api/messages` - Fetch user's thread
- `PATCH /api/messages/[id]` - Mark as read (admin only)

**04. Sentiment Analysis Implementation**
- `src/lib/ai/sentiment-analysis.ts` - LLM-based classification
- `src/app/api/cron/analyze-sentiment/route.ts` - Vercel Cron job
- Cost controls: rate limiting, pre-filtering, retry strategy
- Update `vercel.json` with cron schedule

**05. Frontend: Hooks and Realtime Integration**
- `src/hooks/use-messages.tsx` - Main chat hook
- Supabase Realtime subscription for live updates
- Message sending, fetching, unread count

**06. Frontend: Message Components**
- `FeedbackTab` - Floating tab with unread badge
- `ChatPanel` - Slide-out Sheet (shadcn/ui)
- `MessageList` - Auto-scrolling message display
- `MessageInput` - Textarea with char limit

### Phase 2: Admin Dashboard (Tasks 07-08)

**07. Admin: Backend Functions and API Routes**
- `src/lib/db/admin-messages.ts` - Analytics and filtering
- `src/app/api/admin/messages/route.ts` - Admin API
- Message stats, sentiment breakdown, category aggregation

**08. Admin: Dashboard Pages**
- `src/app/admin/messages/page.tsx` - Message inbox with filters
- `src/app/admin/analytics/page.tsx` - Sentiment analytics dashboard
- Admin reply functionality

### Phase 3: Testing (Tasks 09-10)

**09. Testing: Phase 1 - Chat System**
- Database function tests
- API route tests
- Component tests (MessageList)
- Hook tests (useMessages with Realtime mocking)

**10. Testing: Phase 2 - Sentiment Analysis**
- Sentiment analysis function tests (mock LLM)
- Cron job tests
- Cost control verification
- Retry logic tests

### Phase 4: Future Features (Task 11)

**11. Batch Feedback Database Schema**
- `batch_feedback` table with 1-5 star rating
- `batch_feedback_images` junction table (normalized)
- RLS policies
- **Note**: UX flow to be designed when implementing

## Implementation Dependencies

### Sequential Dependencies
1. **Task 01** must complete before **Task 02** (DB schema needed for types)
2. **Task 02** must complete before **Task 03** (functions needed for API)
3. **Task 03** must complete before **Task 05** (API needed for hooks)
4. **Task 05** must complete before **Task 06** (hooks needed for components)
5. **Task 02** must complete before **Task 04** (message functions needed for sentiment queue)

### Parallel Opportunities
- **Tasks 07-08** (Admin) can run in parallel with **Tasks 09-10** (Testing)
- **Task 04** (Sentiment) can start once **Task 02** (Backend functions) is done
- **Task 11** (Batch feedback) is independent and can be deferred

## Key Design Patterns

### Pattern Reuse (Critical)
- **Database migrations**: Copy from `supabase/migrations/20251212000000_create_image_feedback.sql`
- **DB functions**: Mirror `src/lib/db/feedback.ts` structure
- **Admin functions**: Mirror `src/lib/db/admin-feedback.ts` structure
- **Cron jobs**: Copy `src/app/api/cron/cleanup-errors/route.ts` pattern
- **Type definitions**: Follow `src/types/feedback.ts` conventions

### Technology Stack
- **Database**: Supabase (PostgreSQL + RLS)
- **Real-time**: Supabase Realtime (WebSocket)
- **Background jobs**: Vercel Cron (every 5 minutes)
- **LLM**: Claude Haiku (cost-efficient sentiment analysis)
- **UI Components**: shadcn/ui (Sheet, ScrollArea, Badge, etc.)
- **Testing**: Bun test with mocks (no Jest)

### Cost Controls
1. Rate limiting: Max 10 analyses per user per hour
2. Pre-filter: Skip messages <10 chars
3. Batch size: 50 messages per cron run
4. Max retries: 3 attempts with exponential backoff
5. Model: Claude Haiku (cheapest option)

## Success Criteria

### Phase 1 Complete
- ✅ Users can send messages via floating tab
- ✅ Admin can view and reply to messages
- ✅ Real-time updates work (no refresh needed)
- ✅ RLS policies prevent cross-user access
- ✅ Tests pass with 70%+ coverage

### Phase 2 Complete
- ✅ Messages automatically analyzed for sentiment
- ✅ Analysis runs within 5 minutes of submission
- ✅ Cost controls prevent runaway API charges
- ✅ Failed analyses retry with backoff

### Phase 3 Complete
- ✅ Admin can filter messages by sentiment/category
- ✅ Admin can search message content
- ✅ Analytics show sentiment trends
- ✅ Admin response time tracked

## File Summary

| Task | Files Created | Files Modified |
|------|--------------|----------------|
| 01 | 2 migrations | - |
| 02 | 2 TypeScript files | - |
| 03 | 2 API routes | - |
| 04 | 2 files (AI + cron) | vercel.json |
| 05 | 1 hook | - |
| 06 | 5 components | - |
| 07 | 2 files (DB + API) | - |
| 08 | 2 pages + 1 API | - |
| 09 | 4 test files | - |
| 10 | 2 test files | - |
| 11 | 1 migration (future) | - |

**Total**: ~23 new files, 1 modification

## Next Steps

1. **Review**: Read through all task files to understand scope
2. **Execute**: Implement tasks in order (01 → 11)
3. **Test**: Run `bun test` after completing Tasks 09-10
4. **Deploy**: Push migrations with `npx supabase db push`
5. **Monitor**: Watch Vercel Cron logs for sentiment analysis

## Notes

- **Deferred features**: Email notifications, message editing, conversation threading
- **Future work**: Batch feedback (Task 11), refund integration
- **Pattern fidelity**: Maintain exact consistency with `image_feedback` system
