# Step 1: Core HTML Report Generation

## Objective

Replace console output in `report.ts` with HTML file generation as the default behavior. The HTML report should be responsive, visually appealing, and work offline (no CDN dependencies).

## Current State

- `scripts/commands/report.ts` outputs to console using `formatReport()` from statistics module
- Fetches tests and evaluations from Supabase
- Shows summary stats, score distribution, top/bottom scores, cost summary
- `--urls` flag shows image URLs

## Target State

- Default output is an HTML file saved to `reports/{label}.html`
- Console output shows path to generated file
- HTML includes all current report data plus image gallery
- CSS-based score visualizations (no Chart.js)
- Inline Tailwind CSS (no CDN)

## Implementation Tasks

### 1. Create reports directory structure

```typescript
// At top of report.ts
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const REPORTS_DIR = join(process.cwd(), 'reports');

// Ensure directory exists
await mkdir(REPORTS_DIR, { recursive: true });
```

### 2. Define ReportData interface

```typescript
interface ReportData {
  label: string;
  generatedAt: string;
  stats: {
    n: number;
    mean: number;
    stdDev: number;
    min: number;
    max: number;
    median: number;
  };
  scoreDistribution: Record<string, number>;
  tests: Array<{
    id: string;
    prompt: string;
    imageUrl: string | null;
    score: number;
    durationMs: number | null;
    costUsd: number | null;
  }>;
  costs: {
    generation: number;
    evaluation: number;
    total: number;
  };
}
```

### 3. Create HTML generation functions

Create these rendering functions using template literals:

```typescript
const generateHTML = (data: ReportData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Batch Report: ${escapeHtml(data.label)}</title>
  <style>${getStyles()}</style>
</head>
<body class="bg-gray-50 min-h-screen">
  <div class="max-w-6xl mx-auto p-8">
    ${renderHeader(data)}
    ${renderSummaryStats(data)}
    ${renderScoreDistribution(data)}
    ${renderTestGrid(data)}
    ${renderCostSummary(data)}
  </div>
</body>
</html>
`;
```

### 4. Implement getStyles() function

Include essential Tailwind utility classes inline. Only include classes actually used:

```typescript
const getStyles = (): string => `
  /* Reset */
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; line-height: 1.5; }

  /* Layout */
  .max-w-6xl { max-width: 72rem; }
  .mx-auto { margin-left: auto; margin-right: auto; }
  .p-8 { padding: 2rem; }
  .p-4 { padding: 1rem; }
  .p-2 { padding: 0.5rem; }
  .mb-8 { margin-bottom: 2rem; }
  .mb-4 { margin-bottom: 1rem; }
  .gap-4 { gap: 1rem; }
  .gap-2 { gap: 0.5rem; }

  /* Grid */
  .grid { display: grid; }
  .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
  .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
  .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

  /* Flexbox */
  .flex { display: flex; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }

  /* Colors */
  .bg-gray-50 { background-color: #f9fafb; }
  .bg-white { background-color: #fff; }
  .bg-gray-200 { background-color: #e5e7eb; }
  .bg-green-500 { background-color: #22c55e; }
  .bg-yellow-500 { background-color: #eab308; }
  .bg-red-500 { background-color: #ef4444; }
  .text-gray-500 { color: #6b7280; }
  .text-gray-700 { color: #374151; }
  .text-gray-900 { color: #111827; }

  /* Typography */
  .text-sm { font-size: 0.875rem; }
  .text-lg { font-size: 1.125rem; }
  .text-2xl { font-size: 1.5rem; }
  .text-3xl { font-size: 1.875rem; }
  .font-semibold { font-weight: 600; }
  .font-bold { font-weight: 700; }

  /* Borders & Shadows */
  .rounded { border-radius: 0.25rem; }
  .rounded-lg { border-radius: 0.5rem; }
  .shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .shadow-md { box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
  .border { border: 1px solid #e5e7eb; }

  /* Images */
  .aspect-square { aspect-ratio: 1; }
  .object-cover { object-fit: cover; }
  .w-full { width: 100%; }
  .h-4 { height: 1rem; }
  .min-h-screen { min-height: 100vh; }

  /* Score bar */
  .score-bar { height: 1rem; border-radius: 0.25rem; transition: width 0.3s; }

  /* Print styles */
  @media print {
    body { background: white; }
    .no-print { display: none; }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .grid-cols-3, .grid-cols-4 { grid-template-columns: repeat(2, 1fr); }
  }
`;
```

### 5. Implement render functions

#### renderHeader
```typescript
const renderHeader = (data: ReportData): string => `
  <header class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Batch Report</h1>
    <p class="text-gray-500">${escapeHtml(data.label)}</p>
    <p class="text-sm text-gray-500">Generated: ${data.generatedAt}</p>
  </header>
`;
```

#### renderSummaryStats
```typescript
const renderSummaryStats = (data: ReportData): string => `
  <section class="bg-white rounded-lg shadow p-4 mb-8">
    <h2 class="text-lg font-semibold mb-4">Summary Statistics</h2>
    <div class="grid grid-cols-3 gap-4">
      ${renderStatCard('Tests', data.stats.n.toString())}
      ${renderStatCard('Mean Score', data.stats.mean.toFixed(2) + '/10')}
      ${renderStatCard('Std Dev', data.stats.stdDev.toFixed(2))}
      ${renderStatCard('Median', data.stats.median.toFixed(1))}
      ${renderStatCard('Min', data.stats.min.toFixed(1))}
      ${renderStatCard('Max', data.stats.max.toFixed(1))}
    </div>
  </section>
`;

const renderStatCard = (label: string, value: string): string => `
  <div class="p-4 bg-gray-50 rounded">
    <p class="text-sm text-gray-500">${label}</p>
    <p class="text-2xl font-bold text-gray-900">${value}</p>
  </div>
`;
```

#### renderScoreDistribution
```typescript
const renderScoreDistribution = (data: ReportData): string => {
  const maxCount = Math.max(...Object.values(data.scoreDistribution));

  const bars = Object.entries(data.scoreDistribution)
    .map(([range, count]) => {
      const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
      const color = getDistributionColor(range);
      return `
        <div class="flex items-center gap-2 mb-2">
          <span class="text-sm text-gray-700 w-32">${range}</span>
          <div class="flex-1 bg-gray-200 rounded h-4">
            <div class="score-bar ${color}" style="width: ${width}%"></div>
          </div>
          <span class="text-sm text-gray-500 w-8">${count}</span>
        </div>
      `;
    })
    .join('');

  return `
    <section class="bg-white rounded-lg shadow p-4 mb-8">
      <h2 class="text-lg font-semibold mb-4">Score Distribution</h2>
      ${bars}
    </section>
  `;
};

const getDistributionColor = (range: string): string => {
  if (range.includes('Poor')) return 'bg-red-500';
  if (range.includes('Below')) return 'bg-yellow-500';
  if (range.includes('Average')) return 'bg-yellow-500';
  if (range.includes('Good')) return 'bg-green-500';
  return 'bg-green-500'; // Excellent
};
```

#### renderTestGrid
```typescript
const renderTestGrid = (data: ReportData): string => {
  const sortedTests = [...data.tests].sort((a, b) => b.score - a.score);

  const cards = sortedTests.map(test => `
    <div class="bg-white rounded-lg shadow overflow-hidden">
      ${test.imageUrl
        ? `<img src="${escapeHtml(test.imageUrl)}" alt="Generated image" class="w-full aspect-square object-cover" loading="lazy">`
        : `<div class="w-full aspect-square bg-gray-200 flex items-center justify-center text-gray-500">No image</div>`
      }
      <div class="p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="font-semibold">${test.score.toFixed(1)}/10</span>
          ${renderScoreBadge(test.score)}
        </div>
        <p class="text-sm text-gray-500 truncate" title="${escapeHtml(test.prompt)}">
          ${escapeHtml(test.prompt.slice(0, 60))}...
        </p>
      </div>
    </div>
  `).join('');

  return `
    <section class="mb-8">
      <h2 class="text-lg font-semibold mb-4">Test Results (${data.tests.length} tests)</h2>
      <div class="grid grid-cols-4 gap-4">
        ${cards}
      </div>
    </section>
  `;
};

const renderScoreBadge = (score: number): string => {
  const color = score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500';
  return `<span class="text-xs text-white ${color} rounded px-2 py-1">${score >= 7 ? 'Good' : score >= 5 ? 'Avg' : 'Low'}</span>`;
};
```

#### renderCostSummary
```typescript
const renderCostSummary = (data: ReportData): string => `
  <section class="bg-white rounded-lg shadow p-4">
    <h2 class="text-lg font-semibold mb-4">Cost Summary</h2>
    <div class="grid grid-cols-3 gap-4">
      ${renderStatCard('Generation', '$' + data.costs.generation.toFixed(4))}
      ${renderStatCard('Evaluation', '$' + data.costs.evaluation.toFixed(4))}
      ${renderStatCard('Total', '$' + data.costs.total.toFixed(4))}
    </div>
  </section>
`;
```

### 6. Add escapeHtml utility

```typescript
const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
```

### 7. Update reportCommand function

```typescript
export const reportCommand = async (args: string[]): Promise<void> => {
  const options = parseReportOptions(args);

  // ... existing data fetching code ...

  // Build report data
  const reportData: ReportData = {
    label: options.label,
    generatedAt: new Date().toISOString(),
    stats: summarize(scores),
    scoreDistribution: getScoreDistribution(scores),
    tests: scoredTests,
    costs: {
      generation: totalGenerationCost,
      evaluation: totalEvalCost,
      total: totalGenerationCost + totalEvalCost,
    },
  };

  // Generate HTML
  const html = generateHTML(reportData);

  // Write to file
  await mkdir(REPORTS_DIR, { recursive: true });
  const outputPath = join(REPORTS_DIR, `${options.label}.html`);
  await writeFile(outputPath, html, 'utf-8');

  console.log(`\n✅ Report generated: ${outputPath}`);
};
```

### 8. Add .gitignore entry

Add to `.gitignore`:
```
reports/
```

## Files to Modify

| File | Changes |
|------|---------|
| `scripts/commands/report.ts` | Replace console output with HTML generation |
| `.gitignore` | Add `reports/` directory |

## Files to Create

None - all code goes in existing `report.ts`

## Testing

1. Run `pnpm bench report --label <existing-batch>`
2. Verify HTML file created in `reports/` directory
3. Open HTML in browser - check responsive layout
4. Test print preview
5. Verify all images load (lazy loading)
6. Check score colors are correct

## Success Criteria

- [ ] HTML file generated at `reports/{label}.html`
- [ ] Page renders correctly in Chrome/Firefox/Safari
- [ ] Works offline (no external CDN requests)
- [ ] Images display in grid with lazy loading
- [ ] Score bars use correct color coding
- [ ] Statistics match console output
- [ ] Print-friendly layout
