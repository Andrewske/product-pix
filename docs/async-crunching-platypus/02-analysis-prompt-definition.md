# Analysis Prompt Definition and Registry

## Files to Create
- `src/lib/analysis/prompts/product-analysis.ts` (new)
- `src/lib/analysis/prompts/registry.ts` (new)
- `src/lib/db/analysis-prompts.ts` (new)

## Implementation Details

### 1. Product Analysis Prompt Definition
Create the analysis prompt definition with schema:

```typescript
// src/lib/analysis/prompts/product-analysis.ts
import type { AnalysisPrompt } from '@/types/analysis';

export const PRODUCT_ANALYSIS_V1: Omit<AnalysisPrompt, 'id' | 'createdBy' | 'createdAt'> = {
  slug: 'product-analysis',
  version: 1,
  status: 'active',
  promptText: `Analyze this product image and extract the following information. Be specific and descriptive. If you cannot determine a field, use an empty string.`,
  responseSchema: {
    product: {
      type: 'string',
      description: 'The main product name/type (e.g., "ceramic coffee mug", "leather wallet", "cotton t-shirt")'
    },
    color: {
      type: 'string',
      description: 'Primary color and finish (e.g., "matte black", "navy blue denim", "brushed stainless steel")'
    },
    material: {
      type: 'string',
      description: 'Primary material composition (e.g., "ceramic", "genuine leather", "100% cotton")'
    },
    shape: {
      type: 'string',
      description: 'Overall shape and form (e.g., "cylindrical with handle", "rectangular with rounded corners")'
    },
    features: {
      type: 'array',
      items: 'string',
      description: 'Key distinguishing features (e.g., ["textured surface", "embossed logo", "adjustable strap"])'
    }
  }
};
```

### 2. Analysis Prompt Registry
Central registry for all analysis prompts:

```typescript
// src/lib/analysis/prompts/registry.ts
import { PRODUCT_ANALYSIS_V1 } from './product-analysis';
import type { AnalysisPrompt } from '@/types/analysis';

export const ANALYSIS_PROMPT_REGISTRY: Record<string, Omit<AnalysisPrompt, 'id' | 'createdBy' | 'createdAt'>> = {
  'product-analysis': PRODUCT_ANALYSIS_V1,
};

export const getRegisteredAnalysisPrompt = (slug: string) => ANALYSIS_PROMPT_REGISTRY[slug];
export const getRegisteredAnalysisPromptSlugs = () => Object.keys(ANALYSIS_PROMPT_REGISTRY);
```

### 3. Database Query Layer
CRUD operations for analysis prompts (mirrors template pattern):

```typescript
// src/lib/db/analysis-prompts.ts
import { createClient } from '@/lib/supabase/server';
import type { AnalysisPrompt } from '@/types/analysis';

export async function fetchAnalysisPromptBySlug(
  slug: string,
  version: number | 'latest' = 'latest'
): Promise<AnalysisPrompt | null> {
  const supabase = await createClient();

  let query = supabase
    .from('analysis_prompts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active');

  if (version === 'latest') {
    query = query.order('version', { ascending: false }).limit(1);
  } else {
    query = query.eq('version', version);
  }

  const { data, error } = await query.single();

  if (error || !data) return null;

  return {
    id: data.id,
    slug: data.slug,
    version: data.version,
    status: data.status,
    promptText: data.prompt_text,
    responseSchema: data.response_schema,
    createdBy: data.created_by,
    createdAt: new Date(data.created_at)
  };
}

export async function getAllActiveAnalysisPrompts(): Promise<AnalysisPrompt[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from('analysis_prompts')
    .select('*')
    .eq('status', 'active')
    .order('slug');

  return data?.map(row => ({
    id: row.id,
    slug: row.slug,
    version: row.version,
    status: row.status,
    promptText: row.prompt_text,
    responseSchema: row.response_schema,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at)
  })) || [];
}
```

## Acceptance Criteria
- [ ] Product analysis prompt defined with all 5 fields (product, color, material, shape, features)
- [ ] Registry exports prompt and helper functions
- [ ] DB query layer provides fetchBySlug and getAll functions
- [ ] Type definitions match database schema
- [ ] Follows existing template pattern architecture

## Dependencies
- Task 01 (migrations must be applied first)
