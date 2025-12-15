# UI Primitives Components

## Files to Modify
- `prompt-bench/ui/server.ts` (modify - add component definitions to HTML)

## Implementation Details

Add shadcn/ui-inspired primitive components inline in the HTML's `<script>` tag.

### Component Structure

These components go in the `<script type="module">` section after React imports:

```javascript
const { useState, useEffect } = React;
const { createRoot } = ReactDOM;

// ============================================================================
// UI Primitives (~150 LOC)
// ============================================================================

const Button = ({ variant = 'primary', children, disabled, ...props }) => {
  const baseStyles = 'px-4 py-2 rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    ghost: 'bg-transparent hover:bg-gray-100',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return React.createElement('button', {
    className: `${baseStyles} ${variants[variant]}`,
    disabled,
    ...props
  }, children);
};

const Select = ({ label, options, value, onChange, ...props }) => {
  return React.createElement('div', { className: 'flex flex-col gap-1' },
    label && React.createElement('label', { className: 'text-sm font-medium text-gray-700' }, label),
    React.createElement('select', {
      className: 'px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500',
      value,
      onChange: (e) => onChange(e.target.value),
      ...props
    }, options.map(opt =>
      React.createElement('option', { key: opt.value, value: opt.value }, opt.label)
    ))
  );
};

const Input = ({ label, ...props }) => {
  return React.createElement('div', { className: 'flex flex-col gap-1' },
    label && React.createElement('label', { className: 'text-sm font-medium text-gray-700' }, label),
    React.createElement('input', {
      className: 'px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500',
      ...props
    })
  );
};

const Card = ({ title, children, ...props }) => {
  return React.createElement('div', {
    className: 'bg-white rounded-lg shadow p-6',
    ...props
  },
    title && React.createElement('h2', { className: 'text-lg font-semibold mb-4' }, title),
    children
  );
};

const Badge = ({ status, children }) => {
  const styles = {
    completed: 'bg-green-100 text-green-800',
    running: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800',
  };

  return React.createElement('span', {
    className: `inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${styles[status] || styles.pending}`
  }, children);
};

const ProgressBar = ({ current, total, label, className = '' }) => {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return React.createElement('div', { className: `w-full ${className}` },
    React.createElement('div', { className: 'flex justify-between mb-1' },
      React.createElement('span', { className: 'text-sm font-medium text-gray-700' }, label || 'Progress'),
      React.createElement('span', { className: 'text-sm font-medium text-gray-700' }, `${percentage}%`)
    ),
    React.createElement('div', { className: 'w-full bg-gray-200 rounded-full h-2.5' },
      React.createElement('div', {
        className: 'bg-green-600 h-2.5 rounded-full transition-all duration-300',
        style: { width: `${percentage}%` }
      })
    )
  );
};

const Table = ({ columns, data, onRowClick }) => {
  return React.createElement('div', { className: 'overflow-x-auto' },
    React.createElement('table', { className: 'min-w-full divide-y divide-gray-200' },
      React.createElement('thead', { className: 'bg-gray-50' },
        React.createElement('tr', {},
          columns.map(col =>
            React.createElement('th', {
              key: col,
              className: 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
            }, col)
          )
        )
      ),
      React.createElement('tbody', { className: 'bg-white divide-y divide-gray-200' },
        data.map((row, idx) =>
          React.createElement('tr', {
            key: idx,
            className: onRowClick ? 'cursor-pointer hover:bg-gray-50' : '',
            onClick: onRowClick ? () => onRowClick(row) : undefined
          },
            Object.values(row).map((cell, cellIdx) =>
              React.createElement('td', {
                key: cellIdx,
                className: 'px-6 py-4 whitespace-nowrap text-sm text-gray-900'
              }, cell)
            )
          )
        )
      )
    )
  );
};

const ImageGrid = ({ images, columns = 3, onImageClick }) => {
  return React.createElement('div', {
    className: `grid gap-4`,
    style: { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
  },
    images.map((img, idx) =>
      React.createElement('div', {
        key: idx,
        className: 'relative aspect-square rounded overflow-hidden cursor-pointer hover:opacity-90',
        onClick: onImageClick ? () => onImageClick(img) : undefined
      },
        React.createElement('img', {
          src: img.url,
          alt: img.alt || `Image ${idx + 1}`,
          className: 'w-full h-full object-cover'
        }),
        img.score && React.createElement('div', {
          className: 'absolute top-2 right-2'
        },
          React.createElement(Badge, { status: img.score >= 8 ? 'completed' : 'pending' },
            img.score.toFixed(1)
          )
        )
      )
    )
  );
};

const MetricsTable = ({ metrics }) => {
  return React.createElement('table', { className: 'min-w-full' },
    React.createElement('tbody', { className: 'divide-y divide-gray-200' },
      Object.entries(metrics).map(([key, value]) =>
        React.createElement('tr', { key },
          React.createElement('td', { className: 'py-2 pr-4 text-sm font-medium text-gray-700' }, key),
          React.createElement('td', { className: 'py-2 text-sm text-gray-900' }, value)
        )
      )
    )
  );
};
```

## Acceptance Criteria

- [ ] All 8 primitive components are defined (Button, Select, Input, Card, Badge, ProgressBar, Table, ImageGrid, MetricsTable)
- [ ] Button supports 4 variants (primary, secondary, ghost, danger)
- [ ] Badge supports 4 statuses (completed, running, failed, pending)
- [ ] Select and Input render labels when provided
- [ ] ProgressBar calculates percentage correctly
- [ ] Table renders headers and rows
- [ ] ImageGrid supports custom column count
- [ ] All components use Tailwind classes
- [ ] Components match shadcn/ui aesthetic (clean, minimal)

## Dependencies

- Task 01 (Server Setup) - HTML structure exists

## Testing

Add a test page to verify components:

```javascript
// Add to App component temporarily
const TestComponents = () => {
  const [value, setValue] = useState('option1');

  return React.createElement('div', { className: 'p-8 space-y-8' },
    React.createElement(Card, { title: 'Buttons' },
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement(Button, { variant: 'primary' }, 'Primary'),
        React.createElement(Button, { variant: 'secondary' }, 'Secondary'),
        React.createElement(Button, { variant: 'ghost' }, 'Ghost'),
        React.createElement(Button, { variant: 'danger' }, 'Danger'),
        React.createElement(Button, { disabled: true }, 'Disabled')
      )
    ),
    React.createElement(Card, { title: 'Form Inputs' },
      React.createElement(Select, {
        label: 'Select Option',
        options: [
          { value: 'option1', label: 'Option 1' },
          { value: 'option2', label: 'Option 2' }
        ],
        value,
        onChange: setValue
      }),
      React.createElement(Input, { label: 'Text Input', placeholder: 'Enter text...' })
    ),
    React.createElement(Card, { title: 'Progress' },
      React.createElement(ProgressBar, { current: 7, total: 10, label: 'Processing...' })
    ),
    React.createElement(Card, { title: 'Badges' },
      React.createElement('div', { className: 'flex gap-2' },
        React.createElement(Badge, { status: 'completed' }, 'Completed'),
        React.createElement(Badge, { status: 'running' }, 'Running'),
        React.createElement(Badge, { status: 'failed' }, 'Failed'),
        React.createElement(Badge, { status: 'pending' }, 'Pending')
      )
    )
  );
};
```
