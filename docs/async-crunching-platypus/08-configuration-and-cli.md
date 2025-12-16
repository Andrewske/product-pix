# Configuration and CLI Support

## Files to Modify
- `prompt-bench.toml` (add analysis configuration)
- `prompt-bench/cli.ts` (add CLI flags for analysis options)

## Implementation Details

### 1. Update prompt-bench.toml
Add analysis configuration section:

```toml
[defaults]
template = "ecommerce-base"
batch_file = "fixtures/basic-batch.json"
evaluation_model = "claude-sonnet-4"
analysis_model = "gemini-2.0-flash"  # NEW

[defaults.analysis]
enabled = true                        # NEW - can disable analysis globally
cache_enabled = true                  # NEW - can disable cache for testing
prompt_slug = "product-analysis"      # NEW - which analysis prompt to use

[defaults.report]
insights = true
show_urls = false

[defaults.improve]
max_iterations = 5
target_score = 8.5
auto_approve = false
```

### 2. Add CLI Flags to Test Command
Extend the test command to support analysis overrides:

```typescript
// prompt-bench/cli.ts

// In command parsing (where test command flags are handled):
interface TestCommandOptions {
  template?: string;
  batch?: string;
  analysisModel?: string;      // NEW: --analysis-model
  noAnalysis?: boolean;         // NEW: --no-analysis
  noCache?: boolean;            // NEW: --no-cache
}

// Example command line usage:
// bun bench test --template ecommerce-base --batch fixtures/batch.json
// bun bench test --analysis-model gemini-2.0-flash-exp
// bun bench test --no-analysis
// bun bench test --no-cache
```

### 3. Update Config Loading
Ensure config loader merges CLI flags with toml defaults:

```typescript
// In config loading function:
const config = {
  ...loadedFromToml,
  analysisModel: options.analysisModel || loadedFromToml.analysisModel,
  analysisEnabled: !options.noAnalysis && loadedFromToml.analysis?.enabled !== false,
  analysisCacheEnabled: !options.noCache && loadedFromToml.analysis?.cacheEnabled !== false,
  analysisPromptSlug: loadedFromToml.analysis?.promptSlug || 'product-analysis'
};
```

### 4. Add Help Text
Update CLI help output to document new flags:

```typescript
// In help/usage output:
console.log(`
  Analysis Options:
    --analysis-model <model>    Override analysis model (default: gemini-2.0-flash)
    --no-analysis               Disable AI product analysis
    --no-cache                  Disable analysis cache (force fresh analysis)
`);
```

## Acceptance Criteria
- [ ] `prompt-bench.toml` has `[defaults.analysis]` section
- [ ] Config defaults to analysis enabled, cache enabled
- [ ] CLI flags `--analysis-model`, `--no-analysis`, `--no-cache` work
- [ ] CLI flags override TOML config values
- [ ] Help text documents new flags
- [ ] Config validation ensures valid model names
- [ ] Backwards compatible (old configs without analysis section still work)

## CLI Examples

**Use default analysis:**
```bash
bun bench test --template ecommerce-base --batch fixtures/batch.json
# Uses gemini-2.0-flash from config
```

**Override analysis model:**
```bash
bun bench test --template ecommerce-base --batch fixtures/batch.json --analysis-model gemini-2.0-flash-exp
# Uses experimental model
```

**Disable analysis:**
```bash
bun bench test --template ecommerce-base --batch fixtures/batch.json --no-analysis
# Skips AI analysis, uses manual variables only
```

**Disable cache for testing:**
```bash
bun bench test --template ecommerce-base --batch fixtures/batch.json --no-cache
# Forces fresh analysis, ignores cache
```

## Dependencies
- Task 05 (product analyzer expects these config values)
- Task 07 (orchestrator reads from config)
