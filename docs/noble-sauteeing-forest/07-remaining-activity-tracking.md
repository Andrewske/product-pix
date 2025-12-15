# Remaining Activity Tracking Events

## Files to Modify/Create
- Logout handler location (modify)
- Image download API/handler (modify)
- `src/app/(marketing)/pricing/page.tsx` (modify)
- Credit check failure points (modify)

## Implementation Details

Complete the activity tracking from Task 02. Add `trackActivity()` calls at these locations:

| Location | Event | Properties | Notes |
|----------|-------|------------|-------|
| Logout handler | `logout` | - | Find where logout is handled |
| Image download API | `image_download` | `{ imageId }` | Track when user downloads generated image |
| Pricing page | `pricing_viewed` | - | Track when user views pricing |
| Credit check failures | `insufficient_credits` | `{ required, available }` | Track when user hits credit wall |

### 1. Logout tracking

Find the logout handler and add:
```typescript
await trackActivity(userId, 'logout');
```

### 2. Image download tracking

In the image download handler:
```typescript
await trackActivity(userId, 'image_download', { imageId });
```

### 3. Pricing page tracking

In `src/app/(marketing)/pricing/page.tsx`:
```typescript
// Use useEffect or server-side tracking
await trackActivity(userId, 'pricing_viewed');
```
Note: Only track if user is authenticated.

### 4. Insufficient credits tracking

Find credit check failure points and add:
```typescript
await trackActivity(userId, 'insufficient_credits', {
  required: requiredCredits,
  available: availableCredits
});
```

## Acceptance Criteria
- [ ] Logout events appear in timeline
- [ ] Image download events appear with imageId in metadata
- [ ] Pricing page views tracked for authenticated users
- [ ] Insufficient credits events show required vs available
- [ ] All events update `last_active_at` timestamp

## Dependencies
- Task 02 (trackActivity utility must exist)
- Task 06 (timeline UI should be working to verify events appear)
