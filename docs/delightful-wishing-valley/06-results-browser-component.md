# ResultsBrowser Component

## Files to Modify
- `prompt-bench/ui/server.ts` (modify - add ResultsBrowser component and routing)

## Implementation Details

Build the ResultsBrowser component for viewing, filtering, and comparing experiment results.

### Component Implementation

Add after ExperimentRunner in the `<script type="module">` section:

```javascript
// ============================================================================
// ResultsBrowser Component
// ============================================================================

const ResultsBrowser = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  // Filters
  const [labelFilter, setLabelFilter] = useState('');
  const [minScoreFilter, setMinScoreFilter] = useState('');

  useEffect(() => {
    fetchResults();
  }, [labelFilter, minScoreFilter]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (labelFilter) params.set('label', labelFilter);
      if (minScoreFilter) params.set('minScore', minScoreFilter);

      const res = await fetch(`/api/results?${params}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to fetch results:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (batchLabel) => {
    setExpandedRow(expandedRow === batchLabel ? null : batchLabel);
  };

  return React.createElement('div', { className: 'max-w-7xl mx-auto p-8 space-y-6' },
    // Header
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('h1', { className: 'text-3xl font-bold text-gray-900' }, 'Results Browser'),
      React.createElement(Button, {
        variant: 'secondary',
        onClick: () => window.location.href = '/'
      }, '← Back to Runner')
    ),

    // Filters
    React.createElement(Card, { title: 'Filters' },
      React.createElement('div', { className: 'grid grid-cols-3 gap-4' },
        React.createElement(Input, {
          label: 'Batch Label',
          value: labelFilter,
          onChange: (e) => setLabelFilter(e.target.value),
          placeholder: 'Filter by label...'
        }),
        React.createElement(Input, {
          label: 'Min Score',
          type: 'number',
          step: '0.1',
          value: minScoreFilter,
          onChange: (e) => setMinScoreFilter(e.target.value),
          placeholder: '0.0 - 10.0'
        }),
        React.createElement('div', { className: 'flex items-end' },
          React.createElement(Button, {
            variant: 'secondary',
            onClick: () => {
              setLabelFilter('');
              setMinScoreFilter('');
            }
          }, 'Clear Filters')
        )
      )
    ),

    // Results Table
    React.createElement(Card, { title: `Results (${results.length})` },
      loading ? React.createElement('p', { className: 'text-gray-500' }, 'Loading...') :
      results.length === 0 ? React.createElement('p', { className: 'text-gray-500' }, 'No results found') :
      React.createElement('div', { className: 'space-y-4' },
        results.map(result =>
          React.createElement('div', { key: result.batchLabel },
            // Row header
            React.createElement('div', {
              className: 'flex items-center justify-between p-4 bg-gray-50 rounded cursor-pointer hover:bg-gray-100',
              onClick: () => toggleRow(result.batchLabel)
            },
              React.createElement('div', { className: 'flex-1' },
                React.createElement('div', { className: 'font-medium' }, result.batchLabel),
                React.createElement('div', { className: 'text-sm text-gray-500' },
                  `${result.stats.count} tests | Mean Score: ${result.stats.meanScore.toFixed(2)} | Cost: $${result.stats.totalCost.toFixed(4)}`
                )
              ),
              React.createElement('span', { className: 'text-gray-400' },
                expandedRow === result.batchLabel ? '▼' : '▶'
              )
            ),

            // Expanded comparison view
            expandedRow === result.batchLabel && React.createElement(ComparisonView, { data: result })
          )
        )
      )
    )
  );
};

// ============================================================================
// ComparisonView Component
// ============================================================================

const ComparisonView = ({ data }) => {
  // Group tests by collection (if applicable)
  const images = data.tests
    .filter(t => t.image_url)
    .map(t => ({
      url: t.image_url,
      score: t.prompt_evaluations?.[0]?.score_overall,
      details: t.prompt_evaluations?.[0]?.details
    }));

  // Calculate aggregate metrics
  const scores = data.tests
    .map(t => t.prompt_evaluations?.[0]?.score_overall)
    .filter(s => s !== undefined);

  const avgConsistency = scores.length > 0
    ? data.tests.reduce((sum, t) => sum + (t.prompt_evaluations?.[0]?.details?.consistency || 0), 0) / data.tests.length
    : 0;

  const avgVariety = scores.length > 0
    ? data.tests.reduce((sum, t) => sum + (t.prompt_evaluations?.[0]?.details?.variety || 0), 0) / data.tests.length
    : 0;

  const avgPlausibility = scores.length > 0
    ? data.tests.reduce((sum, t) => sum + (t.prompt_evaluations?.[0]?.details?.physicalPlausibility || 0), 0) / data.tests.length
    : 0;

  return React.createElement('div', { className: 'p-4 border-t space-y-4' },
    // Metrics table
    React.createElement('div', { className: 'grid grid-cols-2 gap-6' },
      React.createElement('div', {},
        React.createElement('h3', { className: 'font-semibold mb-2' }, 'Collection Metrics'),
        React.createElement(MetricsTable, {
          metrics: {
            'Consistency': avgConsistency > 0 ? avgConsistency.toFixed(2) : 'N/A',
            'Variety': avgVariety > 0 ? avgVariety.toFixed(2) : 'N/A',
            'Physical Plausibility': avgPlausibility > 0 ? avgPlausibility.toFixed(2) : 'N/A',
            'Mean Score': data.stats.meanScore.toFixed(2),
          }
        })
      ),
      React.createElement('div', {},
        React.createElement('h3', { className: 'font-semibold mb-2' }, 'Summary'),
        React.createElement(MetricsTable, {
          metrics: {
            'Total Tests': data.stats.count,
            'Total Cost': `$${data.stats.totalCost.toFixed(4)}`,
            'Avg Cost per Test': `$${(data.stats.totalCost / data.stats.count).toFixed(4)}`,
          }
        })
      )
    ),

    // Image grid
    React.createElement('div', {},
      React.createElement('h3', { className: 'font-semibold mb-2' }, 'Generated Images'),
      images.length > 0
        ? React.createElement(ImageGrid, {
            images,
            columns: 5,
            onImageClick: (img) => window.open(img.url, '_blank')
          })
        : React.createElement('p', { className: 'text-gray-500' }, 'No images available')
    )
  );
};
```

### Client-Side Routing

Update the main App component to handle routing:

```javascript
const App = () => {
  const [view, setView] = useState(
    window.location.pathname === '/results' ? 'results' : 'runner'
  );

  // Listen to popstate for browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setView(window.location.pathname === '/results' ? 'results' : 'runner');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return React.createElement('div', {},
    // Nav header
    React.createElement('nav', { className: 'bg-white border-b' },
      React.createElement('div', { className: 'max-w-7xl mx-auto px-8 py-4' },
        React.createElement('div', { className: 'flex gap-6' },
          React.createElement('button', {
            className: `font-medium ${view === 'runner' ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'}`,
            onClick: () => {
              window.history.pushState({}, '', '/');
              setView('runner');
            }
          }, 'Experiment Runner'),
          React.createElement('button', {
            className: `font-medium ${view === 'results' ? 'text-green-600' : 'text-gray-600 hover:text-gray-900'}`,
            onClick: () => {
              window.history.pushState({}, '', '/results');
              setView('results');
            }
          }, 'Results Browser')
        )
      )
    ),

    // Main content
    view === 'runner'
      ? React.createElement(ExperimentRunner)
      : React.createElement(ResultsBrowser)
  );
};
```

## Acceptance Criteria

- [ ] Results table lists all batch runs with stats
- [ ] Filters work (label, min score)
- [ ] Clicking row expands comparison view
- [ ] Comparison view shows metrics table
- [ ] Image grid displays all generated images
- [ ] Clicking image opens in new tab
- [ ] Collection metrics calculate correctly (consistency, variety, plausibility)
- [ ] Client-side routing works (/, /results)
- [ ] Nav header highlights active view
- [ ] Browser back/forward buttons work

## Dependencies

- Task 02 (API Layer) - /api/results must work
- Task 04 (UI Primitives) - components must be defined
- Task 05 (ExperimentRunner) - for navigation reference

## Testing

1. Run some experiments using ExperimentRunner
2. Navigate to /results
3. Verify results appear in table
4. Test filters (label, min score)
5. Click a row to expand
6. Verify metrics display correctly
7. Click an image to open in new tab
8. Use browser back button to return to runner
