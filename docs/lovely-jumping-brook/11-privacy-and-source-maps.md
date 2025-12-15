# Privacy Configuration and Source Maps

## Files to Modify/Create
- `scripts/check-privacy-attributes.ts` (new)
- `src/lib/analytics/config.ts` (modify - add URL masking)
- `next.config.mjs` (modify - enable source maps)
- Search codebase for sensitive inputs (modify multiple TSX files)

## Implementation Details

### Task 5.1: Add Privacy Attributes and Static Analysis

**Step 1: Add data-private attributes to sensitive fields**

Search codebase for sensitive inputs and add `data-private` attribute:
- Email inputs
- Password inputs
- Credit card fields (if any client-side)
- Any PII fields

**Example:**
```tsx
<input
  type="email"
  data-private
  // ... other props
/>
```

**Step 2: Create static analysis script**

Create `scripts/check-privacy-attributes.ts`:

**Purpose:**
- Find all `<input>` tags in TSX files
- Verify sensitive inputs have data-private or are excluded
- Exit with error if violations found

**Implementation Pattern:**
```typescript
import { glob } from 'glob';
import { readFileSync } from 'fs';

// Find all TSX files
const files = glob.sync('src/**/*.tsx');

// Check each file for input tags
// Verify type="email", type="password" have data-private
// Report violations
```

**Step 3: Add to CI/pre-commit**

Add script to package.json:
```json
{
  "scripts": {
    "check-privacy": "bun run scripts/check-privacy-attributes.ts"
  }
}
```

### Task 5.2: Configure Global URL Parameter Masking

Modify `src/lib/analytics/config.ts` in `createClientConfig()`:

**Add to session_recording config:**
```typescript
session_recording: {
  maskAllInputs: true,
  maskTextSelector: '*',
  recordCrossOriginIframes: false,
  // Mask URL parameters globally
  maskTextFn: (text) => {
    // Redact anything after ? or #
    return text.replace(/[?#].*/, '[REDACTED]');
  }
}
```

This prevents payment redirect URLs with tokens from appearing in session replays.

### Task 5.3: Set Up PostHog Vercel Integration

**Step 1: Install Vercel Integration**
1. Go to Vercel dashboard → Integrations
2. Search for "PostHog"
3. Install PostHog integration
4. Configure with PostHog project ID and API key
5. Enable source map uploads

**Step 2: Enable Source Maps in Next.js**

Modify `next.config.mjs`:

```javascript
const nextConfig = {
  productionBrowserSourceMaps: true,
  // ... existing config
};
```

**Note:**
This replaces the custom upload script from original plan. Vercel integration handles uploads automatically.

## Acceptance Criteria
- Sensitive data masked with data-private attributes
- Static analysis script passes
- Script integrated into CI/package.json
- URL parameters masked in session replays
- PostHog Vercel integration installed
- Source maps enabled in Next.js config
- Source maps automatically uploaded on Vercel deployments

## Tests Required
- Static analysis: Run script, verify no violations
- Manual: Create test session replay, verify:
  - Email/password fields masked
  - URL parameters don't show tokens
  - Payment redirect URLs masked

## Dependencies
- Task 03 (PostHog config) must be complete for URL masking
- Vercel access required for integration setup
