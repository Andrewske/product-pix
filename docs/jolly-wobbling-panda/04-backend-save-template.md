# Backend: Save Template API

## Files to Modify/Create
- `prompt-bench/ui/server.ts` (modify)

## Implementation Details

Add new API endpoint `/api/notebook/save-template` that creates new template versions with auto-incremented version numbers.

### Route Handler Registration

Add route in the main `fetch()` function:
```typescript
if (url.pathname === '/api/notebook/save-template' && req.method === 'POST')
  return handleSaveTemplate(req);
```

### Handler Implementation

```typescript
const handleSaveTemplate = async (req: Request): Promise<Response> => {
  const body = await req.json();
  const { slug, templateData, variablesSchema, type, outputCount } = body;

  if (!slug || !templateData) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // 1. Fetch current latest version
  const { data: currentTemplate, error: fetchError } = await supabase
    .from('prompt_templates')
    .select('version')
    .eq('slug', slug)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
    return Response.json({ error: `Failed to fetch current version: ${fetchError.message}` }, { status: 500 });
  }

  // 2. Calculate next version (auto-increment)
  const nextVersion = currentTemplate ? currentTemplate.version + 1 : 1;

  // 3. Insert new template version
  const newTemplate = {
    slug,
    version: nextVersion,
    status: 'active',
    type: outputCount > 1 ? 'collection' : 'single',  // Auto-detect from outputCount
    output_count: outputCount || 1,
    template_data: templateData,
    variables_schema: variablesSchema
  };

  const { data: insertResult, error: insertError } = await supabase
    .from('prompt_templates')
    .insert(newTemplate)
    .select()
    .single();

  if (insertError) {
    return Response.json({ error: `Failed to save template: ${insertError.message}` }, { status: 500 });
  }

  logger.info('Template saved', { slug, version: nextVersion });

  return Response.json({
    template: insertResult,
    message: `Saved ${slug} v${nextVersion}`
  });
};
```

### Request Body Schema
```typescript
{
  slug: string;
  templateData: Record<string, unknown>;
  variablesSchema: Record<string, unknown>;
  type?: 'single' | 'collection';  // Optional, auto-detected from outputCount
  outputCount?: number;  // Used to auto-detect type (>1 = collection, else single)
}
```

### Response Schema
```typescript
{
  template: {
    id: string;
    slug: string;
    version: number;
    status: 'active';
    type: 'single' | 'collection';
    output_count: number;
    template_data: Record<string, unknown>;
    variables_schema: Record<string, unknown>;
    created_at: string;
    created_by: string;
  };
  message: string; // e.g., "Saved my-template v4"
}
```

## Acceptance Criteria

- [ ] Route handler registered in `server.ts`
- [ ] Handler validates required fields (slug, templateData)
- [ ] Handler fetches current version correctly
- [ ] Handler auto-increments version number
- [ ] Handler creates new template with status='active'
- [ ] Handler returns 400 for missing fields
- [ ] Handler returns 500 for database errors
- [ ] Handler returns 200 with template data on success
- [ ] Logger records save event with slug and version
- [ ] New version queryable from database
- [ ] UNIQUE(slug, version) constraint prevents duplicates

## Dependencies

None - independent feature
