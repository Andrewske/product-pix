# API Layer Implementation

## Files to Modify
- `prompt-bench/ui/server.ts` (modify - replace stub handlers)

## Implementation Details

Implement the three GET API endpoints that fetch data from the filesystem and database.

### GET /api/batches

Scans `prompt-bench/fixtures/*.json` and returns metadata.

```typescript
const handleBatches = async (req: Request): Promise<Response> => {
  try {
    const fixturesDir = resolve(process.cwd(), 'prompt-bench/fixtures');
    const files = readdirSync(fixturesDir).filter(f => f.endsWith('.json'));

    const batches: BatchFileMetadata[] = files.map(filename => {
      const fullPath = join(fixturesDir, filename);
      const content = readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(content);

      return {
        filename,
        label: parsed.label || filename.replace('.json', ''),
        description: parsed.description,
        testCount: parsed.tests?.length || 0,
      };
    });

    return Response.json({ batches });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load batches: ${message}` }, { status: 500 });
  }
};
```

### GET /api/templates

Queries `prompt_templates` table from Supabase.

```typescript
import { createAdminClient } from '@/lib/supabase/admin';

const handleTemplates = async (req: Request): Promise<Response> => {
  try {
    const supabase = createAdminClient();

    const { data: templates, error } = await supabase
      .from('prompt_templates')
      .select('slug, version, name, type')
      .order('slug', { ascending: true })
      .order('version', { ascending: false });

    if (error) {
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by slug, keeping only latest version per slug
    const uniqueTemplates = templates?.reduce((acc, template) => {
      if (!acc.find(t => t.slug === template.slug)) {
        acc.push(template);
      }
      return acc;
    }, [] as TemplateMetadata[]) || [];

    return Response.json({ templates: uniqueTemplates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load templates: ${message}` }, { status: 500 });
  }
};
```

### GET /api/results

Queries `prompt_tests` with filters and groups by `batch_label`.

```typescript
const handleResults = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const label = url.searchParams.get('label');
    const minScore = url.searchParams.get('minScore');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const supabase = createAdminClient();

    let query = supabase
      .from('prompt_tests')
      .select(`
        id,
        batch_label,
        template_id,
        status,
        image_url,
        created_at,
        cost_usd,
        prompt_evaluations (
          score_overall,
          details
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    // Apply filters
    if (label) query = query.eq('batch_label', label);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: tests, error } = await query;

    if (error) {
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by batch_label and calculate stats
    const grouped = (tests || []).reduce((acc, test) => {
      const label = test.batch_label || 'unlabeled';

      if (!acc[label]) {
        acc[label] = {
          batchLabel: label,
          tests: [],
          stats: { count: 0, meanScore: 0, totalCost: 0 },
        };
      }

      acc[label].tests.push(test);
      acc[label].stats.count++;
      acc[label].stats.totalCost += test.cost_usd || 0;

      const evaluation = test.prompt_evaluations?.[0];
      if (evaluation) {
        acc[label].stats.meanScore += evaluation.score_overall;
      }

      return acc;
    }, {} as Record<string, any>);

    // Calculate mean scores
    Object.values(grouped).forEach((group: any) => {
      if (group.stats.count > 0) {
        group.stats.meanScore = group.stats.meanScore / group.stats.count;
      }
    });

    // Filter by minScore if provided
    let results = Object.values(grouped);
    if (minScore) {
      const minScoreNum = parseFloat(minScore);
      results = results.filter((r: any) => r.stats.meanScore >= minScoreNum);
    }

    return Response.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load results: ${message}` }, { status: 500 });
  }
};
```

## Acceptance Criteria

- [ ] GET /api/batches returns all JSON files from fixtures/ with metadata
- [ ] GET /api/templates returns unique templates (latest version only)
- [ ] GET /api/results returns tests grouped by batch_label
- [ ] Filters work correctly (label, minScore, startDate, endDate)
- [ ] Stats calculation is accurate (count, meanScore, totalCost)
- [ ] Errors return proper HTTP status codes and error messages
- [ ] All endpoints handle empty data gracefully

## Dependencies

- Task 01 (Server Setup) - server must be running

## Testing

```bash
# Test batches endpoint
curl http://localhost:3001/api/batches | jq

# Test templates endpoint
curl http://localhost:3001/api/templates | jq

# Test results endpoint (no filters)
curl http://localhost:3001/api/results | jq

# Test results with filters
curl 'http://localhost:3001/api/results?label=stage1&minScore=8.0' | jq
```
