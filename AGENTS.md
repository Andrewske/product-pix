# AGENTS.md - ProductPix Development Guide

## Commands
- **Build**: `bun run build`
- **Dev**: `bun run dev`
- **Lint**: `bun run lint`
- **Test all**: `bun run test`
- **Test single**: `bun test src/lib/prompts/compiler.test.ts`
- **Test watch**: `bun run test:watch`
- **Test coverage**: `bun run test:coverage`

## Code Style
- **FP First**: Pure functions, immutability, composition over classes/OOP
- **Types**: Strict TypeScript, no `any`/`unknown` without guards, no `!` assertions
- **Imports**: Absolute paths with `@/` alias, barrel exports via index.ts
- **Naming**: kebab-case (files), camelCase (functions/vars), PascalCase (types)
- **Functions**: ≤20 lines, ≤3 nesting levels, single responsibility
- **Error Handling**: Result type (`ok`/`err`) for operations that can fail
- **Validation**: Zod schemas for all external data
- **Coverage**: 70% minimum for branches/functions/lines/statements

## Testing
- **Framework**: Bun test, ESM support
- **Location**: `src/**/__tests__/**/*.test.ts`
- **Path mapping**: `@/*` resolves to `./src/*`
- **Coverage**: Only `src/lib/prompts/` (excludes index.ts and test files)

## Linting
- **Config**: Next.js ESLint config with TypeScript support
- **Ignores**: `.next/`, `out/`, `build/`, `next-env.d.ts`

## TypeScript
- **Target**: ES2017, strict mode enabled
- **Paths**: `@/*` → `./src/*`
- **JSX**: React JSX transform
- **Modules**: ESNext with bundler resolution

## Prompt Bench
- **Config**: `prompt-bench.toml` in project root for default CLI options
- **Commands**: `bun bench <command>` (test, run, evaluate, compare, report, sync)
- **Templates**: Located in `src/lib/prompts/templates/`
- **Batches**: JSON files in `tests/fixtures/` or custom paths</content>
<parameter name="filePath">AGENTS.md