# AGENTS.md

## Code Patterns

**Error handling**: Result type (`ok`/`err`) for operations that can fail
**Validation**: Zod schemas for all external data

## Testing

**@testing-library/react**: Keep for `render()`, `screen`, queries (works with Bun)
**Matchers**: Native Bun only - no custom matchers (jest-dom removed)
**Coverage**: Only `src/lib/prompts/` (excludes index.ts + test files)

## Prompt Bench

**Config**: `prompt-bench.toml` at root (CLI defaults)
**Templates**: `src/lib/prompts/templates/`
**Batches**: `tests/fixtures/` or custom paths
