# Install Analytics Dependencies

## Installation Command

```bash
bun add posthog-js react-facebook-pixel
```

## Rationale

**Critical Fix #9**: CSP compliance via NPM packages.

### Why NPM Packages Instead of Inline Scripts?

**Original approach (inline scripts)**:
```typescript
<Script dangerouslySetInnerHTML={{ __html: `!function(t,e){...}` }} />
```

**Problems**:
- Violates Content Security Policy (CSP) if configured
- Blocked by `script-src 'self'` headers (no 'unsafe-inline')
- Requires CSP nonce support (complex server-side setup)

**New approach (npm packages)**:
```typescript
import posthog from 'posthog-js';
posthog.init(apiKey, { ... });
```

**Benefits**:
- CSP-compliant (bundled JavaScript, no inline execution)
- Type-safe (TypeScript definitions included)
- Testable (can mock `posthog.capture()` in tests)
- Better DX (autocomplete, inline docs)
- Bundle size acceptable (~30KB total for both)
- Version control (pinned in package.json)

## Package Details

### posthog-js
- **Size**: ~22KB gzipped
- **Purpose**: Product analytics and session recording
- **Features**: Event tracking, user identification, feature flags
- **Docs**: https://posthog.com/docs/libraries/js

### react-facebook-pixel
- **Size**: ~8KB gzipped
- **Purpose**: Facebook Pixel for marketing conversion tracking
- **Features**: PageView, Purchase, CompleteRegistration events
- **Docs**: https://www.npmjs.com/package/react-facebook-pixel

## Acceptance Criteria

- [ ] Packages installed: `bun add posthog-js react-facebook-pixel`
- [ ] package.json updated with both dependencies
- [ ] TypeScript recognizes imports (no type errors)
- [ ] Can import `posthog` from 'posthog-js'
- [ ] Can import `ReactPixel` from 'react-facebook-pixel'

## Dependencies

**Prerequisites**: None

**Used by**:
- Phase 7 (Analytics Type Definitions)
- Phase 8 (Analytics Components)
