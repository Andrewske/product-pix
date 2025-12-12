# Convert `/generate` Page to Server Component

## Files to Modify/Create
- `src/components/generate/generate-page-content.tsx` (new)
- `src/app/generate/page.tsx` (modify)

## Problem
Client component with NO server-side auth - only protected by proxy file that we're removing.

## Implementation Details

### Step 1: Create Client Content Component

Create `src/components/generate/generate-page-content.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { UploadForm } from '@/components/forms/upload-form';
import { TemplateSelector } from '@/components/forms/template-selector';
import { AspectRatioSelector, type AspectRatio } from '@/components/forms/aspect-ratio-selector';
import { GenerationResult } from '@/components/generation-result';
import { GenerationLoading } from '@/components/generation-loading';
import { InsufficientCreditsModal } from '@/components/generation/insufficient-credits-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertBox } from '@/components/ui/alert-box';
import { SectionLabel } from '@/components/ui/section-label';
import { PageContainer } from '@/components/layout/page-container';
import { useCredits } from '@/lib/auth';

export function GeneratePageContent() {
  const { credits } = useCredits();

  const [uploadId, setUploadId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [templateSlug, setTemplateSlug] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ imageUrl: string; jobId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const [creditsNeeded, setCreditsNeeded] = useState(0);

  // Copy ALL handlers from current page.tsx (handleUploadComplete, handleGenerate, handleDownload, handleRegenerate, handleReset)
  // Copy ALL JSX from current page.tsx (lines 110-189)

  // ... existing implementation ...
}
```

**Key:** Move ALL state (lines 23-31) and ALL handlers and ALL JSX from current `src/app/generate/page.tsx` into this component.

### Step 2: Convert Page to Server Component

Replace `src/app/generate/page.tsx` with:

```typescript
import { requireAuth } from '@/lib/auth/server';
import { GeneratePageContent } from '@/components/generate/generate-page-content';

export default async function GeneratePage(): Promise<JSX.Element> {
  await requireAuth();

  return <GeneratePageContent />;
}
```

## Acceptance Criteria
- [ ] Unauthenticated users redirect to `/login?redirect=%2Fgenerate`
- [ ] All existing functionality preserved (upload, template selection, generation)
- [ ] `useCredits()` hook shows real-time credit balance
- [ ] No TypeScript errors
- [ ] Generation flow works end-to-end

## Dependencies
None - this is a foundational task.

## Reference Files
- `src/lib/auth/server.ts` - `requireAuth()` implementation
- `src/app/pricing/page.tsx` - Example of server component auth pattern
