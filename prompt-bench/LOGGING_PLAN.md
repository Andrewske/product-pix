# Prompt Bench Enhanced Logging Plan

## Overview

This plan outlines the implementation of enhanced logging for prompt-bench to improve debugging capabilities, especially for SSE connection issues and pipeline progress visibility. The logging system is developer-focused and provides both human-readable console output and persistent file logs.

## Current State Analysis

**Prompt Bench Logging Status:**
- CLI commands use basic `console.log/error/warn` for user feedback
- Core modules have scattered `console.warn/error` with no structure
- UI server has minimal error logging for SSE issues
- No correlation IDs or structured error context
- SSE errors show generic "network error" without debugging details

## Implementation Plan

### Phase 1: Core Logger Infrastructure

**1.1 Create Logger Module (`prompt-bench/core/logger.ts`)**
```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
  
  setLevel(level: LogLevel): void;
  setCorrelationId(id: string): void;
}
```

**Features:**
- Human-readable console output with ANSI color codes
- Log levels (debug/info/warn/error) with configurable threshold
- Dual output: colored console + daily rotating log files
- Correlation ID tracking for request tracing
- PST/PDT timezone timestamps

**1.2 Log File Management**
- Directory: `prompt-bench/logs/`
- Daily rotation: `prompt-bench-YYYY-MM-DD.log`
- Max files: 7 (one week retention)
- Plain text format with timestamps, levels, correlation IDs

### Phase 2: SSE Connection Logging

**2.1 Connection Lifecycle Tracking**
```
[14:30:25 INFO] [corr:abc123] SSE connection established for pipeline run
[14:30:25 DEBUG] [corr:abc123] SSE heartbeat sent (interval: 30s)
[14:31:15 WARN] [corr:abc123] SSE connection lost, attempting reconnect (attempt 1/3)
[14:31:20 ERROR] [corr:abc123] SSE connection failed: timeout after 300s
```

**2.2 Detailed Error Context**
```
[14:31:15 ERROR] [corr:abc123] SSE stream error: JSON parse failure
  Message: Unexpected token '{' at position 45
  Raw data: "data: {"phase":"evaluate","current":3,"total":5,"message":"Evaluating... invalid json"
  Phase: evaluate, Position: 3/5
  Connection duration: 45.2s
  Action: Check API response format and retry
```

**2.3 Progress Monitoring**
```
[14:30:25 INFO] [corr:abc123] Pipeline started: multi-angle-hybrid
[14:30:25 DEBUG] [corr:abc123] Phase 'run' step 'load_batch' started
[14:30:26 DEBUG] [corr:abc123] Phase 'run' step 'compile_templates' completed (2.1s)
[14:30:38 INFO] [corr:abc123] Phase 'run' completed: 1/1 generated successfully (12.3s)
[14:30:38 INFO] [corr:abc123] Phase 'evaluate' started: 5 tests to evaluate
[14:31:24 INFO] [corr:abc123] Phase 'evaluate' completed: 5/5 evaluated successfully (45.6s)
```

### Phase 3: Developer Controls

**3.1 CLI Debug Flags**
```bash
# Enable debug logging
bun bench test --template multi-angle-hybrid --batch test.json --debug

# Set specific log level
bun bench test --template multi-angle-hybrid --batch test.json --log-level debug
```

**3.2 Environment Variables**
```bash
# Set default log level (debug/info/warn/error)
PROMPT_BENCH_LOG_LEVEL=debug

# Enable file logging (default: true)
PROMPT_BENCH_LOG_FILE=true

# Custom log directory (default: ./logs)
PROMPT_BENCH_LOG_DIR=./custom-logs
```

### Phase 4: Integration Points

**4.1 Enhanced Error Context**
- Extend `PromptTestError` with correlation ID and context fields
- Add logging helpers to error creation functions
- Include stack traces in debug mode

**4.2 Pipeline Progress Enhancement**
- Modify `ProgressCallback` to include correlation IDs and step details
- Add sub-phase progress tracking in orchestrator
- Log operation timing and performance metrics

**4.3 SSE Server Integration**
- Include correlation ID in SSE stream metadata
- Log connection events with full context
- Enhanced error responses with debugging information

## Implementation Structure

### New Files
- `prompt-bench/core/logger.ts` - Core logging infrastructure
- `prompt-bench/core/logger-console.ts` - Colored console output formatting
- `prompt-bench/core/logger-file.ts` - Daily rotating file output
- `prompt-bench/logs/.gitkeep` - Log directory placeholder

### Modified Files
- `prompt-bench/core/errors.ts` - Add correlation ID support to error types
- `prompt-bench/core/orchestrator.ts` - Enhanced progress callbacks with correlation IDs
- `prompt-bench/ui/server.ts` - SSE logging and error context in responses
- `prompt-bench/commands/test.ts` - Debug flags and correlation ID generation
- `prompt-bench/core/types.ts` - Add logging-related type definitions

## Correlation ID Purpose

Correlation IDs are unique identifiers that track a single pipeline run across all components:

**Problem Solved:**
- SSE "network error" becomes traceable to specific pipeline run
- Client-side errors connect to server-side operations
- Debug complex async workflows (generation → evaluation → streaming)

**Developer Workflow:**
```bash
# Find failing run, get correlation ID from UI/logs
grep "corr:abc123" prompt-bench/logs/*.log
# See complete timeline: CLI → pipeline → SSE → client
```

## Console Output Examples

**Normal Operation:**
```
🧪 Prompt Bench: Test Pipeline
─────────────────────────────────
Template: multi-angle-hybrid
Batch: test.json
Label: multi-angle-20251216-abc123
Correlation ID: abc123
Started: 2025-12-16 14:30:25 PST
─────────────────────────────────

[14:30:25 INFO] Pipeline started: multi-angle-hybrid
[14:30:26 INFO] Phase 'sync' completed (0.2s)
[14:30:38 INFO] Phase 'run' completed: 1/1 generated successfully (12.3s)
[14:31:24 INFO] Phase 'evaluate' completed: 5/5 evaluated successfully (45.6s)
[14:31:24 INFO] Pipeline completed successfully (58.1s total)
```

**Error Scenario:**
```
[14:31:15 ERROR] [corr:abc123] SSE connection error: JSON parse failure
  Message: Unexpected token 'e' at position 78
  Phase: evaluate, Position: 3/5
  Connection duration: 45.2s
  Raw message: "data: {"phase":"evaluate","current":3,"message":"Evaluating...","error":"API quota exceeded"}"
  Action: Check API key limits and retry
```

## Success Criteria

- **SSE Debugging**: Specific error types replace generic "network error"
- **Correlation Tracing**: Complete request lifecycle visibility
- **Developer Experience**: Readable console output with colors
- **Persistence**: Daily log files for historical analysis
- **Performance**: <1% overhead on pipeline execution time

## Implementation Priority

**High Priority (SSE Issues):**
1. Core logger with correlation ID support
2. SSE connection and error logging
3. Structured error responses

**Medium Priority (Progress):**
1. Step-level progress callbacks
2. Client-side progress tracking
3. Debug mode controls

**Low Priority (Enhancements):**
1. Performance metrics
2. Advanced error recovery logging
3. Log analysis tools

## Questions for Implementation

1. Should log levels be configurable per command or global?
2. Any specific color scheme preferences for console output?
3. Should correlation IDs be shortened (first 8 chars) in console for brevity?
4. Want any log filtering options (by correlation ID, phase, etc.)?</content>
<parameter name="filePath">prompt-bench/LOGGING_PLAN.md