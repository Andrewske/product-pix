# Prompt Bench UI

Web UI for running prompt-bench experiments with real-time progress monitoring.

## Quick Start

```bash
# Start the UI server
bun run prompt-bench/ui/server.ts

# Open in browser
open http://localhost:3001
```

## Features

- **Experiment Runner**: Configure and run Stage 1-3 experiments
- **Real-time Progress**: Live SSE updates during generation
- **Results Browser**: View, filter, and compare past experiments
- **Notebook**: Interactive phase-based experimentation (analysis → generation → evaluation)
- **Collection Metrics**: Consistency, variety, and plausibility scores
- **Image Gallery**: Side-by-side comparison of generated images

## Usage

### Running an Experiment

1. Select stage (Stage 1, 2, or 3)
2. Choose batch file from fixtures
3. Select template
4. (Optional) Set custom label
5. Click "Run Experiment"
6. Monitor real-time progress
7. View results when complete

### Quick Start Presets

- **Run Stage 1**: Pre-fills form for single vs multi-input comparison
- **Run All Stage 2 Strategies**: Runs category-based, AI-decided, and hybrid templates

### Viewing Results

1. Navigate to "Results Browser"
2. Filter by batch label or minimum score
3. Click any row to expand comparison view
4. View metrics table and image gallery
5. Click images to open full-size in new tab

## Architecture

- **Runtime**: Bun (native server)
- **Frontend**: React 19 (CDN)
- **Styling**: Tailwind CSS (CDN)
- **Real-time**: Server-Sent Events (SSE)
- **Database**: Supabase (via existing admin client)

## Development

The entire UI is in a single file (`server.ts`) for simplicity:
- No build step required
- Edit and refresh to see changes
- React components defined inline with `React.createElement`

## Troubleshooting

**Port already in use:**
```bash
# Change port in server.ts
port: 3002
```

**Batch files not loading:**
- Ensure `prompt-bench/fixtures/*.json` files exist
- Check file format matches BatchFileSchema

**Templates not loading:**
- Run `bun bench sync` to sync templates to database
- Verify Supabase connection

**SSE stream errors:**
- Check that `testCommand` accepts progress callback
- Verify environment variables are loaded (`.env`, `.env.local`)