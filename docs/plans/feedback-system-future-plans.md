# Feedback System - Future Plans

Related features to implement after the core generation feedback system.




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

If they give a negative give them two options, refund and delete, or just submit feedback. I don't want to make it obviously disappear if maybe it's good enough but they still have negative feedback.

---

## Priority Order
1. Chat/Messaging System (user-facing, high value)
2. Admin Dashboard (needed to use chat system)
3. Sentiment Analysis (enhances admin dashboard)
4. Job-Level Ratings (extends feedback system)
5. Refund Integration (depends on refund plan)
