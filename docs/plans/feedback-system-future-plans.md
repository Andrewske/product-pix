# Feedback System - Future Plans

Related features to implement after the core generation feedback system.

## 1. Chat/Messaging System

**Purpose**: Floating feedback tab for general suggestions/issues

**Scope**:
- Floating tab on right edge (authenticated pages only)
- Chat-style UI (single ongoing thread per user)
- Database table for messages
- Unread indicator on tab
- Email notification when admin replies
- Admin dashboard for viewing/responding

**Database**:
```sql
CREATE TABLE user_messages (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_from_admin BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
);
```

**Components**:
- `FeedbackTab` - Floating side tab
- `ChatPanel` - Slide-out message panel
- `MessageList` - Chat history
- `MessageInput` - Compose area

---

## 2. Sentiment Analysis & Auto-Categorization

**Purpose**: Automatically categorize and analyze feedback messages

**Scope**:
- Run on message submission (background job)
- Categories: Bug report, Feature suggestion, Billing question, Praise, Complaint, Other
- Sentiment: Positive, Neutral, Negative (with confidence score)
- Store results in message metadata

**Implementation**:
- LLM-based classification (Claude or similar)
- JSONB column for analysis results
- Admin dashboard filtering by category/sentiment

---

## 3. Admin Dashboard

**Purpose**: View and respond to user feedback/messages

**Scope**:
- View all image feedback (filter by type, date, reasons)
- View all chat messages
- Respond to messages
- Analytics: feedback trends, common complaints, satisfaction over time
- Export capabilities

**Pages**:
- `/admin/feedback` - Image feedback browser
- `/admin/messages` - Chat inbox
- `/admin/analytics` - Trends and reports

---

## 4. Job-Level Ratings (Bulk Generation)

**Purpose**: Rate entire batch jobs, not just individual images

**Scope**:
- "Rate this batch" button on batch detail page
- Overall satisfaction (1-5 stars or thumbs)
- Reasons for dissatisfaction (similar to image feedback)
- Links to which specific images were problematic

**Database**:
```sql
CREATE TABLE batch_feedback (
  id UUID PRIMARY KEY,
  batch_id UUID REFERENCES batch_jobs(id),
  user_id UUID NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  reasons TEXT[],
  comment TEXT,
  problem_image_ids UUID[],
  created_at TIMESTAMPTZ
);
```

---

## 5. Self-Service Refund Integration

**Purpose**: Connect feedback to refund flow

**Scope**:
- "Request refund" button after negative feedback
- Auto-populate refund reason from feedback
- Refund limits enforced (separate refund plan)
- Track feedback → refund conversion

**Note**: Refund limits/logic defined in separate refund plan document.

---

## Priority Order
1. Chat/Messaging System (user-facing, high value)
2. Admin Dashboard (needed to use chat system)
3. Sentiment Analysis (enhances admin dashboard)
4. Job-Level Ratings (extends feedback system)
5. Refund Integration (depends on refund plan)
