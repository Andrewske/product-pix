# AGENTS.md

## Critical Rules

**Package manager**: `bun` only - NEVER use npm/yarn/pnpm
**TypeScript strict**: Never `any`/unguarded `unknown`/`!` - explicit types at module boundaries
**Function limits**: ≤20 lines, ≤3 nesting levels
**Naming**: kebab-case (files), camelCase (vars), PascalCase (types)
**Imports**: Absolute paths preferred via `@/*` (src) and `@bench/*` (prompt-bench)
**Logging**: Centralized only - no scattered console logs
**Markdown**: Never create .md files unless explicitly requested

## Code Patterns

**Error handling**: Result type (`ok`/`err`) for operations that can fail
**Validation**: Zod schemas for all external data
**Return types**: Explicit return types required on exported functions in `src/lib/**/*.ts`, `src/app/api/**/route.ts`, `src/hooks/**/*.ts` (module boundaries). Internal code relies on inference. Exemptions: inline callbacks, HOFs, typed expressions, `as const` patterns.
**Error messages**: Include location, cause, state for debugging

## Testing

**Framework**: Pure Bun test - NO Jest, NO @testing-library/jest-dom
**@testing-library/react**: Keep for `render()`, `screen`, queries (works with Bun)
**Matchers**: Native Bun only - no custom matchers (jest-dom removed)
  - Element exists: `expect(el).not.toBeNull()`
  - Attributes: `expect(el?.getAttribute('x')).toBe('y')`
  - Classes: `expect(el?.classList.contains('x')).toBe(true)`
  - Text: `expect(el?.textContent).toContain('x')`
**Imports**: `describe`, `it`, `expect`, `beforeEach`, `mock` from `'bun:test'`
**Coverage**: Only `src/lib/prompts/` (excludes index.ts + test files)

## Architecture

**Tailwind v4**: CSS-first config via `@import "tailwindcss"` in globals.css - NO tailwind.config.js
**TypeScript configs**: Dual setup - `tsconfig.json` (CLI+tests) vs `tsconfig.build.json` (Next.js build excludes prompt-bench/)
**R2 uploads**: Browser → presigned URL → R2 directly (NOT through server)
**Supabase RLS**: Use `admin` client for server-side operations that bypass RLS
**UI aesthetic**: Clean/minimal/inviting - NOT dev-tool or crypto dashboard style

## Prompt Bench

**Config**: `prompt-bench.toml` at root (CLI defaults)
**Templates**: `src/lib/prompts/templates/`
**Batches**: `tests/fixtures/` or custom paths
