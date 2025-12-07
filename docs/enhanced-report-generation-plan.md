# Enhanced Report Generation Plan

## Overview

This plan outlines the implementation of an enhanced report generation system for the ProductPix prompt testing framework, replacing basic console output with rich HTML reports and optional AI-powered insights.

## Design Principles

1. **Simplicity first** - No external templating engines or chart libraries
2. **Zero new dependencies** - Use template literals and CSS-based visualizations
3. **Opt-in complexity** - Expensive operations (Claude insights) require explicit flags
4. **Leverage existing code** - Reuse `compare.ts` and `statistics.ts` for comparisons

## Features

### 1. HTML Reports (Default Output)
- Responsive HTML using inline Tailwind CSS
- CSS-based bar charts for score visualization
- Collapsible sections for detailed test data
- Image gallery with lazy loading
- Print-friendly styling

### 2. Version Comparison
- `--baseline <label>` flag for comparing against previous batches
- Side-by-side image comparisons with score deltas
- Prompt diff highlighting showing what changed
- Reuses existing `compare.ts` statistical analysis

### 3. Automated Insights (Opt-in)
- `--insights` flag to enable Claude-powered analysis
- Generates "Key Findings" identifying patterns in results
- Creates "Optimization Recommendations" based on evaluation data
- Adds "Next Steps" with specific prompt improvement suggestions

## Deferred Features

The following features are intentionally deferred to keep the initial implementation focused:

| Feature | Reason | Add Later If... |
|---------|--------|-----------------|
| CSV Export | Console + HTML sufficient for now | Users need spreadsheet analysis |
| Custom Templates | YAGNI - adds complexity | Multiple teams need different formats |
| Trend Tracking | Batch comparison covers the key use case | Need historical analysis across 5+ batches |
| Cost Optimization | Scope creep | Budget tracking becomes a priority |

## Implementation

### Phase 1: Core HTML Report
**Priority:** High

1. **HTML Generation** (`scripts/commands/report.ts`)
   - Inline HTML generation using template literals
   - Tailwind CSS embedded in `<style>` tag (no CDN dependency)
   - CSS-based score bars (no Chart.js)
   - Responsive grid layout for test results

2. **Score Visualization**
   - Horizontal bar charts using CSS `width: ${score * 10}%`
   - Color coding: green (7+), yellow (5-6), red (<5)
   - Summary statistics table (mean, median, std dev)

3. **Image Gallery**
   - Grid of generated images with scores
   - Click to expand for full-size view
   - Lazy loading for performance

### Phase 2: Comparison & Insights
**Priority:** High

4. **Baseline Comparison** (`--baseline` flag)
   - Fetch both batches and compute diff
   - Side-by-side layout in HTML
   - Highlight score improvements/regressions
   - Show prompt text diff with highlighting

5. **AI Insights** (`--insights` flag)
   - Create `scripts/commands/insights.ts` module
   - Call Claude with batch summary data
   - Parse structured response into HTML sections
   - Display only when flag is provided (saves cost/time)

## CLI Interface

```bash
# Generate HTML report (default behavior)
pnpm bench report --label "batch-2025-12-06"

# Compare against baseline batch
pnpm bench report --label "batch-2025-12-06" --baseline "batch-2025-12-05"

# Include AI-powered insights (costs API credits)
pnpm bench report --label "batch-2025-12-06" --insights

# Full report with comparison and insights
pnpm bench report --label "batch-2025-12-06" --baseline "batch-2025-12-05" --insights
```

## File Structure

```
scripts/commands/
├── report.ts          # Enhanced: HTML generation, comparison
└── insights.ts        # New: Claude-powered analysis (opt-in)

reports/               # Output directory
└── batch-2025-12-06.html
```

## Technical Approach

### HTML Generation (No Dependencies)

```typescript
const generateHTML = (data: ReportData): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Batch Report: ${data.label}</title>
  <style>${getTailwindStyles()}</style>
</head>
<body class="bg-gray-50 p-8">
  ${renderHeader(data)}
  ${renderSummary(data)}
  ${renderTestResults(data)}
  ${data.insights ? renderInsights(data.insights) : ''}
</body>
</html>
`;
```

### CSS-Based Charts (No Chart.js)

```typescript
const renderScoreBar = (score: number): string => {
  const width = score * 10;
  const color = score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500';
  return `
    <div class="w-full bg-gray-200 rounded h-4">
      <div class="${color} h-4 rounded" style="width: ${width}%"></div>
    </div>
  `;
};
```

### Insights Module (Opt-in)

```typescript
// Only called when --insights flag is provided
const generateInsights = async (batchData: BatchSummary): Promise<InsightResult> => {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    messages: [{ role: 'user', content: buildInsightsPrompt(batchData) }],
  });
  return parseInsightsResponse(response);
};
```

## Data Flow

```
report --label X [--baseline Y] [--insights]
         │
         ▼
┌─────────────────────┐
│ Fetch batch X data  │
└─────────────────────┘
         │
         ▼ (if --baseline)
┌─────────────────────┐
│ Fetch batch Y data  │
│ Compute comparison  │
└─────────────────────┘
         │
         ▼ (if --insights)
┌─────────────────────┐
│ Call Claude API     │
│ Parse insights      │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Render HTML         │
│ Write to reports/   │
└─────────────────────┘
```

## Success Metrics

- Report generation < 5 seconds (without insights)
- Report generation < 30 seconds (with insights)
- HTML renders correctly in Chrome, Firefox, Safari
- No external runtime dependencies (works offline)
- Clear visual distinction between score levels

## Risk Mitigation

- Graceful degradation if Claude API unavailable for insights
- Informative error messages for missing batch labels
- Backward compatibility: existing `report` command still works
- Output directory created automatically if missing
