# Enhanced User Profile Timeline UI

## Files to Modify/Create
- `src/components/admin/user-timeline.tsx` (modify)
- `src/components/admin/timeline-event-renderers.tsx` (new)
- `src/components/admin/user-quick-actions.tsx` (new)

## Implementation Details

### 1. Update User Timeline Component

**File:** `src/components/admin/user-timeline.tsx`

Refactor to use:
- TanStack Infinite Query for pagination
- Filter bar for event types (checkboxes or multi-select)
- Date range picker for startDate/endDate
- Different icons/colors per event type
- Click event → expand details or navigate to related item

**API call:**
```typescript
GET /api/admin/users/[userId]/timeline?types=job,transaction&startDate=2024-01-01&cursor=xxx
```

### 2. Create Event Type Renderers

**File:** `src/components/admin/timeline-event-renderers.tsx`

Create render functions for each event type:

| Type | Renderer | Display |
|------|----------|---------|
| job | `JobEvent` | Template, status, duration, credits charged |
| transaction | `TransactionEvent` | Type (purchase/refund/etc), amount, balance after |
| message | `MessageEvent` | Preview text, sentiment badge, reply button |
| image | `ImageEvent` | Thumbnail, feedback status |
| feedback | `FeedbackEvent` | Rating (thumbs), reasons selected |
| error | `ErrorEvent` | Severity, domain, resolved status |
| activity | `ActivityEvent` | Event type (login/logout/etc), properties |

Each renderer receives `TimelineEvent` and returns JSX.

### 3. Add Quick Actions

**File:** `src/components/admin/user-quick-actions.tsx`

Action buttons:
- Refresh timeline (refetch query)
- View all images (link to images tab/page)
- View all messages (link to messages tab/page)
- Add credits button (if needed)
- Impersonate user button (future - disabled for now)

## Acceptance Criteria
- [ ] Timeline uses TanStack Infinite Query with load more
- [ ] Type filter checkboxes work (updates URL params, refetches)
- [ ] Date range picker filters events
- [ ] Each event type renders with appropriate icon and layout
- [ ] Click on event expands details or navigates
- [ ] Quick action buttons are functional
- [ ] Smooth infinite scroll experience

## Dependencies
- Task 03 (unified timeline API)
