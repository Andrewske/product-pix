# ProductPix Logging System Implementation Plan

## Executive Summary

Design a comprehensive, dual-context logging system for ProductPix:
1. **prompt-bench CLI**: File-based structured logging for development
2. **Next.js App**: Database-backed logging for production session tracking

**Library Choice**: Winston (justified over Pino/tslog)
- Mature, battle-tested in production
- Excellent TypeScript support with explicit types
- Built-in transports (file rotation, console, custom)
- Better error handling (won't crash on logger errors)
- More flexible formatting options
- Trade-off: Slightly slower than Pino, but acceptable for our use case

---

## Architecture Decisions

### 1. Separation of Concerns

**Two Independent Logger Configurations**:
- `/home/kevin/coding/product-pix/src/lib/logging/` - Production app logging
- `/home/kevin/coding/product-pix/prompt-bench/logging/` - CLI tool logging

**Rationale**: Different contexts have fundamentally different requirements:
- CLI needs human-readable file logs with session context
- App needs structured DB logs with user/job/request context
- Separate configs prevent circular dependencies and mixing concerns

### 2. Context Propagation Pattern

**Injection via Function Parameters** (not global state):
```typescript
// Good: Explicit context threading
const logContext = createLogContext({ sessionId, generation: 1 });
await runPhase(template, batch, logContext);

// Bad: Global state
setGlobalLogContext({ sessionId }); // Anti-pattern
```

**Rationale**:
- Pure functions, no hidden state
- Easier testing (inject mock loggers)
- Thread-safe (no race conditions)
- Explicit dependencies

### 3. Database Schema Design

**New Table**: `application_logs`
```sql
CREATE TABLE application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level TEXT NOT NULL,  -- 'debug' | 'info' | 'warn' | 'error'
  
  -- Context linking
  request_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Operation metadata
  operation_type TEXT,  -- 'credit_consume', 'credit_refund', 'job_create', 'generation', etc.
  
  -- Log content
  message TEXT NOT NULL,
  metadata JSONB,  -- Flexible structure for operation-specific data
  error_stack TEXT,  -- Stack trace for errors
  
  -- Performance tracking
  duration_ms INTEGER,
  
  -- Indices
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_app_logs_timestamp ON application_logs(timestamp DESC);
CREATE INDEX idx_app_logs_user ON application_logs(user_id, timestamp DESC);
CREATE INDEX idx_app_logs_job ON application_logs(job_id);
CREATE INDEX idx_app_logs_request ON application_logs(request_id);
CREATE INDEX idx_app_logs_operation ON application_logs(operation_type, timestamp DESC);
CREATE INDEX idx_app_logs_level ON application_logs(level) WHERE level IN ('warn', 'error');
```

**Alternative Considered**: Separate tables per operation type (credit_logs, job_logs)
- **Rejected**: More tables to manage, harder to query across operations
- **Chosen**: Single table with indexed operation_type for flexibility

### 4. Winston Transport Strategy

**prompt-bench (CLI)**:
- `winston.transports.File` with rotation (winston-daily-rotate-file)
- Location: `prompt-bench/logs/`
- Format: Structured JSON lines for machine parsing
- Retention: 7 days, 10MB max per file

**Next.js App**:
- Custom Supabase transport (async DB writes)
- Console transport (for development only)
- Format: Structured objects with context

### 5. Error Handling in Logger

**Never throw from logger** (silent fallback):
```typescript
// Winston config
const logger = winston.createLogger({
  exitOnError: false,
  exceptionHandlers: [/* ... */],
  rejectionHandlers: [/* ... */],
});

// Custom transport error handling
transport.on('error', (error) => {
  console.error('[Logger Error]', error); // Fallback to console
});
```

**Rationale**: Logging failures shouldn't crash the application

---

## File Structure

```
/home/kevin/coding/product-pix/
├── src/lib/logging/
│   ├── index.ts                    # Barrel export
│   ├── types.ts                    # Shared types (LogContext, LogLevel, etc.)
│   ├── logger.ts                   # Winston logger factory
│   ├── transports/
│   │   ├── supabase-transport.ts   # Custom DB transport
│   │   └── console-transport.ts    # Development console
│   ├── context.ts                  # Context creation utilities
│   └── formatters.ts               # Log formatting functions
│
├── prompt-bench/logging/
│   ├── index.ts                    # Barrel export
│   ├── logger.ts                   # CLI-specific logger config
│   ├── context.ts                  # Session context utilities
│   └── formatters.ts               # CLI-specific formatters
│
├── prompt-bench/logs/               # Gitignored log files
│   └── .gitkeep
│
└── supabase/migrations/
    └── 00017_create_application_logs.sql
```

---

## Implementation Details

### Phase 1: Core Infrastructure (prompt-bench)

**1.1 Create CLI Logger Module**

**File**: `/home/kevin/coding/product-pix/prompt-bench/logging/types.ts`
```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface SessionLogContext {
  sessionId?: string;
  generation?: number;
  phase?: 'sync' | 'run' | 'evaluate' | 'report' | 'iterate';
  batchLabel?: string;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: SessionLogContext;
  metadata?: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}
```

**File**: `/home/kevin/coding/product-pix/prompt-bench/logging/logger.ts`
```typescript
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { join } from 'node:path';
import type { SessionLogContext, LogEntry } from './types';

const LOG_DIR = join(process.cwd(), 'prompt-bench', 'logs');

// Custom format for CLI logs
const cliFormat = winston.format.printf((info) => {
  const { timestamp, level, message, context, metadata, error } = info;
  
  let output = `${timestamp} [${level.toUpperCase()}]`;
  
  if (context?.sessionId) {
    output += ` [${context.sessionId.slice(0, 8)}]`;
  }
  
  if (context?.generation !== undefined) {
    output += ` [Gen ${context.generation}]`;
  }
  
  if (context?.phase) {
    output += ` [${context.phase}]`;
  }
  
  output += ` ${message}`;
  
  if (metadata && Object.keys(metadata).length > 0) {
    output += ` ${JSON.stringify(metadata)}`;
  }
  
  if (error) {
    output += `\n  Error: ${error.message}`;
    if (error.stack) {
      output += `\n  Stack: ${error.stack}`;
    }
  }
  
  return output;
});

export const createCliLogger = (): winston.Logger => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      cliFormat
    ),
    transports: [
      new DailyRotateFile({
        dirname: LOG_DIR,
        filename: 'prompt-bench-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '10m',
        maxFiles: '7d',
        zippedArchive: true,
      }),
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          cliFormat
        ),
        silent: process.env.NODE_ENV === 'test',
      }),
    ],
    exitOnError: false,
  });
};

// Logger instance (singleton)
let logger: winston.Logger | null = null;

export const getLogger = (): winston.Logger => {
  if (!logger) {
    logger = createCliLogger();
  }
  return logger;
};

// Context-aware logging helpers
export const createLogContext = (context: SessionLogContext) => ({
  debug: (message: string, metadata?: Record<string, unknown>) => {
    getLogger().debug(message, { context, metadata });
  },
  info: (message: string, metadata?: Record<string, unknown>) => {
    getLogger().info(message, { context, metadata });
  },
  warn: (message: string, metadata?: Record<string, unknown>) => {
    getLogger().warn(message, { context, metadata });
  },
  error: (message: string, error?: Error, metadata?: Record<string, unknown>) => {
    getLogger().error(message, {
      context,
      metadata,
      error: error ? {
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      } : undefined,
    });
  },
});

export type Logger = ReturnType<typeof createLogContext>;
```

**File**: `/home/kevin/coding/product-pix/prompt-bench/logging/index.ts`
```typescript
export { getLogger, createLogContext } from './logger';
export type { Logger } from './logger';
export type { SessionLogContext, LogLevel, LogEntry } from './types';
```

**1.2 Integration with Orchestrator**

**Modify**: `/home/kevin/coding/product-pix/prompt-bench/core/orchestrator.ts`

Add logger parameter to existing functions:
```typescript
import { createLogContext, type Logger } from '@bench/logging';

export const runPipeline = async (
  options: PipelineOptions,
  onProgress?: ProgressCallback
): Promise<Result<PipelineResult>> => {
  const startTime = Date.now();
  
  // Create logger context
  const logger = createLogContext({
    phase: 'sync',
    batchLabel: options.label || generateBatchLabel(options.templateSlug),
  });
  
  logger.info('Starting pipeline', {
    template: options.templateSlug,
    batchFile: options.batchFile,
    skipSync: options.skipSync,
    skipEval: options.skipEval,
  });
  
  try {
    // Phase 1: Sync
    if (!options.skipSync) {
      logger.info('Starting sync phase');
      const syncResult = await syncPhase(options.templateSlug, onProgress, logger);
      // ...
    }
    
    // Continue with phases, passing logger...
  } catch (error) {
    logger.error('Pipeline failed', error instanceof Error ? error : new Error(String(error)));
    // ...
  }
};
```

**1.3 Replace Console Calls**

**Strategy**: Systematic replacement in each file
- Search pattern: `console\.(log|error|warn|info)`
- Replace with appropriate logger method
- Add context where available

**Example (from orchestrator.ts line 344)**:
```typescript
// Before
console.warn(`⚠️  Using fallback pricing for test generation: ${testRecord.id}`);

// After
logger.warn('Using fallback pricing for test generation', {
  testId: testRecord.id,
  model: 'gemini-3-pro-image-preview',
});
```

**1.4 Integration with State Management**

**Modify**: `/home/kevin/coding/product-pix/prompt-bench/core/state.ts`

```typescript
import { createLogContext } from '@bench/logging';

export const saveSession = async (
  state: IterationState,
  sessionsDir: string = SESSIONS_DIR
): Promise<Result<void>> => {
  const logger = createLogContext({
    sessionId: state.sessionId,
    generation: state.generations.length,
  });
  
  logger.debug('Saving session state', {
    generation: state.generations.length,
    populationSize: state.currentPopulation.length,
  });
  
  try {
    // Save logic...
    logger.info('Session saved successfully');
    return ok(undefined);
  } catch (error) {
    logger.error('Failed to save session', error instanceof Error ? error : new Error(String(error)));
    return err(createError('STORAGE_ERROR', `Failed to save session: ${message}`));
  }
};
```

### Phase 2: Production App Logging

**2.1 Create App Logger Module**

**File**: `/home/kevin/coding/product-pix/src/lib/logging/types.ts`
```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type OperationType =
  | 'credit_consume'
  | 'credit_refund'
  | 'credit_add'
  | 'job_create'
  | 'job_status_update'
  | 'generation_start'
  | 'generation_complete'
  | 'generation_failed'
  | 'cost_calculation'
  | 'r2_upload'
  | 'rate_limit_check'
  | 'auth_check';

export interface AppLogContext {
  requestId?: string;
  userId?: string;
  jobId?: string;
  operationType?: OperationType;
}

export interface CreditMetadata {
  amount: number;
  balanceAfter: number;
  transactionId?: string;
}

export interface JobMetadata {
  status: string;
  creditsCharged?: number;
  errorMessage?: string;
}

export interface CostMetadata {
  modelId: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  fallbackUsed: boolean;
}

export type LogMetadata = 
  | CreditMetadata 
  | JobMetadata 
  | CostMetadata 
  | Record<string, unknown>;

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  requestId?: string;
  userId?: string;
  jobId?: string;
  operationType?: OperationType;
  message: string;
  metadata?: LogMetadata;
  errorStack?: string;
  durationMs?: number;
}
```

**File**: `/home/kevin/coding/product-pix/src/lib/logging/transports/supabase-transport.ts`
```typescript
import Transport from 'winston-transport';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LogEntry } from '../types';

export class SupabaseTransport extends Transport {
  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
    
    // Error handling
    this.on('error', (error) => {
      console.error('[SupabaseTransport Error]', error);
    });
  }

  async log(info: any, callback: () => void): Promise<void> {
    setImmediate(() => {
      this.emit('logged', info);
    });

    try {
      const supabase = createAdminClient();
      
      const logEntry: Partial<LogEntry> = {
        timestamp: new Date(info.timestamp),
        level: info.level,
        message: info.message,
        request_id: info.context?.requestId,
        user_id: info.context?.userId,
        job_id: info.context?.jobId,
        operation_type: info.context?.operationType,
        metadata: info.metadata || null,
        error_stack: info.error?.stack || null,
        duration_ms: info.durationMs,
      };

      const { error } = await supabase
        .from('application_logs')
        .insert(logEntry);

      if (error) {
        console.error('[SupabaseTransport] Insert failed:', error);
      }
    } catch (error) {
      console.error('[SupabaseTransport] Unexpected error:', error);
    }

    callback();
  }
}
```

**File**: `/home/kevin/coding/product-pix/src/lib/logging/logger.ts`
```typescript
import winston from 'winston';
import { SupabaseTransport } from './transports/supabase-transport';
import type { AppLogContext, LogMetadata } from './types';

const isDevelopment = process.env.NODE_ENV === 'development';

export const createAppLogger = (): winston.Logger => {
  const transports: winston.transport[] = [
    new SupabaseTransport({ level: 'info' }),
  ];

  if (isDevelopment) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      })
    );
  }

  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports,
    exitOnError: false,
  });
};

// Logger singleton
let logger: winston.Logger | null = null;

export const getLogger = (): winston.Logger => {
  if (!logger) {
    logger = createAppLogger();
  }
  return logger;
};

// Context-aware logger factory
export const createLogger = (context: AppLogContext) => ({
  debug: (message: string, metadata?: LogMetadata) => {
    getLogger().debug(message, { context, metadata });
  },
  
  info: (message: string, metadata?: LogMetadata) => {
    getLogger().info(message, { context, metadata });
  },
  
  warn: (message: string, metadata?: LogMetadata) => {
    getLogger().warn(message, { context, metadata });
  },
  
  error: (message: string, error?: Error, metadata?: LogMetadata) => {
    getLogger().error(message, {
      context,
      metadata,
      error: error ? {
        message: error.message,
        stack: error.stack,
      } : undefined,
    });
  },
});

export type AppLogger = ReturnType<typeof createLogger>;
```

**File**: `/home/kevin/coding/product-pix/src/lib/logging/index.ts`
```typescript
export { createLogger, getLogger } from './logger';
export type { AppLogger } from './logger';
export type { AppLogContext, OperationType, LogMetadata } from './types';
```

**2.2 Integration with Credit Operations**

**Modify**: `/home/kevin/coding/product-pix/src/lib/db/credits.ts`

```typescript
import { createLogger } from '@/lib/logging';

export const consumeCredits = async (
  userId: string,
  amount: number,
  jobId: string,
  description?: string
): Promise<CreditOperationResult> => {
  const logger = createLogger({
    userId,
    jobId,
    operationType: 'credit_consume',
  });
  
  logger.info('Consuming credits', { amount, description });
  
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('consume_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_job_id: jobId,
    p_description: description ?? 'Image generation',
  });

  if (error) {
    logger.error('Failed to consume credits', error, { amount, jobId });
    return { success: false, new_balance: 0 };
  }

  const result = data[0];
  
  if (result.success) {
    logger.info('Credits consumed successfully', {
      amount,
      balanceAfter: result.new_balance,
    });
  } else {
    logger.warn('Credit consumption failed (insufficient balance)', {
      amount,
      currentBalance: result.new_balance,
    });
  }

  return {
    success: result.success,
    new_balance: result.new_balance,
  };
};

export const refundCredits = async (
  userId: string,
  amount: number,
  jobId: string,
  description?: string
): Promise<CreditOperationResult> => {
  const logger = createLogger({
    userId,
    jobId,
    operationType: 'credit_refund',
  });
  
  logger.info('Refunding credits', { amount, description });
  
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('refund_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_job_id: jobId,
    p_description: description ?? 'Refund for failed generation',
  });

  if (error) {
    logger.error('Failed to refund credits', error, { amount, jobId });
    return { success: false, new_balance: 0 };
  }

  const result = data[0];
  
  logger.info('Credits refunded successfully', {
    amount,
    balanceAfter: result.new_balance,
  });

  return {
    success: result.success,
    new_balance: result.new_balance,
  };
};
```

**2.3 Integration with Job Lifecycle**

**Modify**: `/home/kevin/coding/product-pix/src/lib/db/jobs.ts`

```typescript
import { createLogger } from '@/lib/logging';

export const createGenerationJob = async (
  userId: string,
  uploadId: string | null,
  prompt: string,
  parameters: Json = {},
  credits = 1
): Promise<CreateJobResult> => {
  const logger = createLogger({
    userId,
    operationType: 'job_create',
  });
  
  logger.info('Creating generation job', {
    hasUpload: !!uploadId,
    credits,
    promptLength: prompt.length,
  });
  
  const supabase = createAdminClient();

  const { data, error } = await supabase.rpc('create_generation_job', {
    p_user_id: userId,
    p_upload_id: uploadId || '',
    p_prompt: prompt,
    p_parameters: parameters,
    p_credits: credits,
  });

  if (error) {
    logger.error('Failed to create job', error);
    return { success: false, job_id: null, message: error.message };
  }

  const result = data[0];
  
  if (result.success && result.job_id) {
    logger.info('Job created successfully', { jobId: result.job_id });
  } else {
    logger.warn('Job creation failed', { message: result.message });
  }

  return {
    success: result.success,
    job_id: result.job_id,
    message: result.message,
  };
};

export const updateJobStatus = async (
  jobId: string,
  status: JobStatus,
  errorMessage?: string
): Promise<boolean> => {
  const logger = createLogger({
    jobId,
    operationType: 'job_status_update',
  });
  
  logger.info('Updating job status', { status, hasError: !!errorMessage });
  
  const supabase = createAdminClient();

  const updates: Partial<Job> = { status };

  if (status === 'processing') {
    updates.started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed') {
    updates.completed_at = new Date().toISOString();
  }

  if (errorMessage) {
    updates.error_message = errorMessage;
  }

  const { error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId);

  if (error) {
    logger.error('Failed to update job status', error, { status });
    return false;
  }

  logger.info('Job status updated', { status });
  return true;
};
```

**2.4 Integration with Generation Flow**

**Modify**: `/home/kevin/coding/product-pix/src/lib/ai/generate-image.ts`

```typescript
import { createLogger } from '@/lib/logging';
import { randomUUID } from 'crypto';

export const generateImage = async (
  params: GenerateImageParams
): Promise<GenerateImageResult> => {
  const { jobId, userId, prompt, sourceImage, sourceMimeType, config } = params;
  
  const requestId = randomUUID();
  const logger = createLogger({
    requestId,
    userId,
    jobId,
    operationType: 'generation_start',
  });
  
  logger.info('Starting image generation', {
    hasSourceImage: !!sourceImage,
    aspectRatio: config.aspectRatio,
    resolution: config.resolution,
    promptLength: prompt.length,
  });

  const provider = getImageProvider();
  const startTime = Date.now();

  // Mark job as processing
  await updateJobStatus(jobId, 'processing');

  try {
    let result: GenerationResponse;

    if (sourceImage && sourceMimeType) {
      logger.debug('Generating from source image');
      result = await provider.generateFromImage(
        sourceImage,
        sourceMimeType,
        prompt,
        config
      );
    } else {
      logger.debug('Generating from text prompt');
      result = await provider.generateFromText(prompt, config);
    }

    if (!result.success) {
      logger.error('Generation failed', new Error(result.error || 'Unknown error'), {
        retryable: result.retryable,
      });
      
      await updateJobStatus(jobId, 'failed', result.error);

      if (result.retryable) {
        const job = await getJob(jobId);
        if (job && job.credits_charged) {
          await refundCredits(
            userId,
            job.credits_charged,
            jobId,
            `Refund for failed generation: ${result.error}`
          );
        }
      }

      return { success: false, error: result.error };
    }

    // Upload to R2
    logger.debug('Uploading generated image to R2');
    const format = result.mimeType.split('/')[1] as 'png' | 'jpeg' | 'webp';
    const uploadResult = await uploadBase64Image(
      result.imageData,
      userId,
      jobId,
      format
    );

    // Save to database
    const generatedImage = await createGeneratedImage({
      jobId,
      userId,
      fileKey: uploadResult.fileKey,
      publicUrl: uploadResult.publicUrl,
      width: result.width,
      height: result.height,
      fileSize: Buffer.from(result.imageData, 'base64').length,
    });

    // Calculate and log cost
    if (result.usage) {
      const costResult = calculateCost('gemini-3-pro-image-preview', {
        input: result.usage.promptTokens,
        output: result.usage.completionTokens,
      });

      if (costResult.ok) {
        const costData = costResult.data;
        
        logger.info('Cost calculated', {
          modelId: 'gemini-3-pro-image-preview',
          provider: costData.provider,
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
          totalCost: costData.total,
          fallbackUsed: costData.fallbackUsed,
        });

        if (costData.fallbackUsed) {
          logger.warn('Using fallback pricing (model not in config)');
        }

        await createGenerationCost({
          jobId,
          generatedImageId: generatedImage?.id,
          modelId: 'gemini-3-pro-image-preview',
          provider: costData.provider,
          inputTokens: result.usage.promptTokens,
          outputTokens: result.usage.completionTokens,
          inputCostUsd: costData.inputCost,
          outputCostUsd: costData.outputCost,
          totalCostUsd: costData.total,
          fallbackUsed: costData.fallbackUsed,
        });
      } else {
        logger.error('Cost calculation failed', new Error(costResult.error.message));
      }
    } else {
      logger.warn('No usage data from generation provider');
    }

    await updateJobStatus(jobId, 'completed');
    
    const duration = Date.now() - startTime;
    logger.info('Generation completed successfully', {
      durationMs: duration,
      fileSize: Buffer.from(result.imageData, 'base64').length,
    });

    return {
      success: true,
      imageUrl: uploadResult.publicUrl,
      fileKey: uploadResult.fileKey,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error('Unexpected generation error', error instanceof Error ? error : new Error(message), {
      durationMs: duration,
    });
    
    await updateJobStatus(jobId, 'failed', message);

    return {
      success: false,
      error: message,
    };
  }
};
```

**2.5 API Route Integration**

**Modify**: `/home/kevin/coding/product-pix/src/app/api/generate/route.ts`

```typescript
import { createLogger } from '@/lib/logging';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  const logger = createLogger({ requestId, operationType: 'generation_start' });
  
  try {
    logger.debug('Received generation request');
    
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized generation attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Update logger context with userId
    const userLogger = createLogger({
      requestId,
      userId: user.id,
      operationType: 'generation_start',
    });

    // Rate limit check
    userLogger.debug('Checking rate limit');
    const rateLimitResult = await rateLimiters.generation(user.id);
    
    if (!rateLimitResult.success) {
      userLogger.warn('Rate limit exceeded', {
        remaining: rateLimitResult.remaining,
      });
      
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.', retryAfter: 60 },
        {
          status: 429,
          headers: {
            'Retry-After': '60',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          },
        }
      );
    }

    // Validate request
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      userLogger.warn('Invalid request payload', { errors: parsed.error.issues });
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { uploadId, prompt, aspectRatio, resolution } = parsed.data;
    const creditCost = resolution === '4k' ? 3 : resolution === '2k' ? 2 : 1;

    // ... rest of implementation with logging ...

  } catch (error) {
    logger.error('Generate route error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Phase 3: Database Migration

**File**: `/home/kevin/coding/product-pix/supabase/migrations/00017_create_application_logs.sql`

```sql
-- Migration: Create application logs table for production logging
-- Provides structured logging with context linking for debugging and analytics

CREATE TABLE public.application_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Timestamp
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Log level
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error')),
  
  -- Context linking
  request_id UUID,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Operation metadata
  operation_type TEXT,
  
  -- Log content
  message TEXT NOT NULL,
  metadata JSONB,
  error_stack TEXT,
  
  -- Performance tracking
  duration_ms INTEGER,
  
  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices for efficient querying
CREATE INDEX idx_app_logs_timestamp ON application_logs(timestamp DESC);
CREATE INDEX idx_app_logs_user ON application_logs(user_id, timestamp DESC);
CREATE INDEX idx_app_logs_job ON application_logs(job_id);
CREATE INDEX idx_app_logs_request ON application_logs(request_id);
CREATE INDEX idx_app_logs_operation ON application_logs(operation_type, timestamp DESC);
CREATE INDEX idx_app_logs_level_errors ON application_logs(level) WHERE level IN ('warn', 'error');

-- Partial index for recent logs (last 7 days)
CREATE INDEX idx_app_logs_recent ON application_logs(timestamp DESC, level)
  WHERE timestamp > NOW() - INTERVAL '7 days';

-- RLS policies
ALTER TABLE public.application_logs ENABLE ROW LEVEL SECURITY;

-- Service role can manage all logs
CREATE POLICY "Service role can manage all logs"
  ON public.application_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read their own logs
CREATE POLICY "Users can read their own logs"
  ON public.application_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Function to clean up old logs (retention policy: 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM application_logs
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$;

-- Optional: Schedule via pg_cron (if available)
-- SELECT cron.schedule('cleanup-logs', '0 2 * * *', 'SELECT cleanup_old_logs()');

COMMENT ON TABLE application_logs IS 'Application-level structured logs with context linking';
COMMENT ON COLUMN application_logs.request_id IS 'UUID linking related logs within a single request';
COMMENT ON COLUMN application_logs.operation_type IS 'Type of operation being logged (credit_consume, job_create, etc.)';
COMMENT ON COLUMN application_logs.metadata IS 'Flexible JSONB for operation-specific data';
```

### Phase 4: Testing Strategy

**4.1 Unit Tests for Loggers**

**File**: `/home/kevin/coding/product-pix/prompt-bench/logging/__tests__/logger.test.ts`

```typescript
import { createLogContext, getLogger } from '../logger';
import type { SessionLogContext } from '../types';
import winston from 'winston';

describe('CLI Logger', () => {
  let capturedLogs: any[] = [];
  
  beforeEach(() => {
    capturedLogs = [];
    
    // Mock transport to capture logs
    const mockTransport = new winston.transports.Stream({
      stream: {
        write: (log: string) => {
          capturedLogs.push(JSON.parse(log));
        },
      } as any,
    });
    
    // Override logger transports
    const logger = getLogger();
    logger.clear();
    logger.add(mockTransport);
  });

  it('should log with session context', () => {
    const context: SessionLogContext = {
      sessionId: 'test-session-123',
      generation: 1,
      phase: 'run',
    };
    
    const logger = createLogContext(context);
    logger.info('Test message', { foo: 'bar' });
    
    expect(capturedLogs).toHaveLength(1);
    expect(capturedLogs[0]).toMatchObject({
      level: 'info',
      message: 'Test message',
      context,
      metadata: { foo: 'bar' },
    });
  });

  it('should log errors with stack traces', () => {
    const logger = createLogContext({ sessionId: 'test-123' });
    const error = new Error('Test error');
    
    logger.error('Operation failed', error, { operation: 'test' });
    
    expect(capturedLogs).toHaveLength(1);
    expect(capturedLogs[0]).toMatchObject({
      level: 'error',
      message: 'Operation failed',
      error: {
        message: 'Test error',
        stack: expect.stringContaining('Error: Test error'),
      },
    });
  });
});
```

**File**: `/home/kevin/coding/product-pix/src/lib/logging/__tests__/logger.test.ts`

```typescript
import { createLogger } from '../logger';
import type { AppLogContext } from '../types';

describe('App Logger', () => {
  it('should create logger with context', () => {
    const context: AppLogContext = {
      userId: 'user-123',
      jobId: 'job-456',
      operationType: 'credit_consume',
    };
    
    const logger = createLogger(context);
    
    expect(logger).toHaveProperty('debug');
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('warn');
    expect(logger).toHaveProperty('error');
  });

  it('should not throw on logging errors', () => {
    const logger = createLogger({ userId: 'test' });
    
    expect(() => {
      logger.info('Test message', { circular: {} as any });
    }).not.toThrow();
  });
});
```

**4.2 Integration Tests**

**File**: `/home/kevin/coding/product-pix/src/lib/logging/__tests__/integration.test.ts`

```typescript
import { createLogger } from '../logger';
import { createAdminClient } from '@/lib/supabase/admin';

describe('Logging Integration', () => {
  it('should write logs to database', async () => {
    const logger = createLogger({
      requestId: 'test-request',
      userId: 'test-user',
      operationType: 'job_create',
    });
    
    logger.info('Test log entry', { testData: 'foo' });
    
    // Wait for async write
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('application_logs')
      .select('*')
      .eq('request_id', 'test-request')
      .single();
    
    expect(error).toBeNull();
    expect(data).toMatchObject({
      level: 'info',
      message: 'Test log entry',
      request_id: 'test-request',
      user_id: 'test-user',
      operation_type: 'job_create',
    });
  });
});
```

---

## Migration Strategy

### Timeline & Sequencing

**Week 1: CLI Infrastructure**
1. Install dependencies: `bun add winston winston-daily-rotate-file`
2. Create `prompt-bench/logging/` module
3. Create `prompt-bench/logs/.gitkeep` and add to `.gitignore`
4. Write unit tests for CLI logger

**Week 2: CLI Integration**
1. Integrate with orchestrator (runPipeline, phases)
2. Integrate with state management (saveSession, loadSession)
3. Replace console calls in commands/ (iterate, run, evaluate, test)
4. Replace console calls in core/ (evolution, compiler, evaluator)
5. Test full pipeline with logging

**Week 3: App Infrastructure**
1. Install dependencies: `bun add winston winston-transport`
2. Create database migration (00017_create_application_logs.sql)
3. Run migration: `npx supabase db push`
4. Create `src/lib/logging/` module with Supabase transport
5. Write unit tests for app logger

**Week 4: App Integration**
1. Integrate with credit operations (consume, refund, add)
2. Integrate with job lifecycle (create, update status)
3. Integrate with generation flow (generate-image.ts)
4. Integrate with API routes (/api/generate, /api/upload/*)
5. Replace console calls in src/lib/db/

**Week 5: Testing & Refinement**
1. Run integration tests
2. Monitor log volume and performance
3. Adjust log levels if needed
4. Review database query performance
5. Add retention policy automation (pg_cron if available)

### Rollback Plan

If issues arise:
1. **CLI**: Comment out logger calls, revert to console temporarily
2. **App**: Disable Supabase transport, keep console transport
3. **Database**: Logs table can be dropped without affecting app functionality

### Dependencies & Installation

**Add to package.json**:
```json
{
  "dependencies": {
    "winston": "^3.11.0",
    "winston-daily-rotate-file": "^4.7.1",
    "winston-transport": "^4.6.0"
  },
  "devDependencies": {
    "@types/winston": "^2.4.4"
  }
}
```

**Install**:
```bash
bun add winston winston-daily-rotate-file winston-transport
bun add -d @types/winston
```

---

## Addressing User Questions

### 1. Should prompt-bench logs also go to database?

**Recommendation**: No, keep CLI logs file-based only.

**Rationale**:
- CLI is a development tool, not production
- Database coupling adds unnecessary complexity
- File logs are easier to inspect during development
- Iteration sessions already track costs in DB (iteration_costs table)
- Separation of concerns: CLI logs = debugging, DB = analytics

**Alternative**: If long-term analysis is needed, add a --export-logs command to upload session logs to DB post-hoc.

### 2. How to handle logger initialization errors?

**Strategy**: Graceful degradation with fallback to console.

```typescript
export const getLogger = (): winston.Logger => {
  if (!logger) {
    try {
      logger = createCliLogger();
    } catch (error) {
      console.error('[Logger Init Error]', error);
      
      // Fallback to simple console logger
      logger = winston.createLogger({
        transports: [new winston.transports.Console()],
        exitOnError: false,
      });
    }
  }
  return logger;
};
```

**Circular dependencies**: Avoid by:
- Never importing logger in types.ts
- Keep logger.ts as leaf dependency (imports from types, not vice versa)
- Use dependency injection for Supabase client (pass as parameter)

### 3. Custom Winston transport for Supabase?

**Recommendation**: Yes, create custom transport (already included in plan).

**Rationale**:
- Winston transports handle async writes elegantly
- Built-in error handling and retry logic
- Easy to test in isolation
- Can add batching later if needed

**Alternative**: Simple fire-and-forget calls to Supabase.
- **Rejected**: Harder to test, no error handling, couples logging to business logic

### 4. Preserve existing onProgress callback behavior?

**Strategy**: Keep both - onProgress for UI, logger for persistence.

```typescript
export const runPipeline = async (
  options: PipelineOptions,
  onProgress?: ProgressCallback
): Promise<Result<PipelineResult>> => {
  const logger = createLogContext({ batchLabel: options.label });
  
  // Phase 1: Run
  for (let i = 0; i < total; i++) {
    // UI callback (unchanged)
    onProgress?.('run', i, total, `Processing test ${i + 1}/${total}...`);
    
    // Structured logging (new)
    logger.debug('Processing test case', { testIndex: i, total });
    
    // ... test execution ...
  }
};
```

**Rationale**:
- onProgress is for real-time user feedback (CLI progress bars)
- Logger is for debugging and audit trails
- Different concerns, both valuable

### 5. Client-side logging strategy?

**Recommendation**: Phase 6 (future work), not included in this plan.

**Scope for Phase 6**:
- Browser error boundary with logger
- Auth hook errors (useUser failures)
- Client-side API call errors
- Send to /api/logs endpoint, write to DB

**Current Plan**: Server-side only (sufficient for MVP)
- API routes already log auth failures
- Client errors visible in browser console
- Can add client logging later without affecting server implementation

---

## Performance Considerations

### Database Write Volume

**Estimated log volume** (production):
- 100 users/day, 10 generations each = 1,000 generations/day
- Avg 15 log entries per generation (credit ops, job lifecycle, costs) = 15,000 logs/day
- 30-day retention = 450,000 rows max
- ~50KB per row (with metadata) = 22.5GB storage

**Optimization**:
- Index on timestamp (DESC) for recent queries
- Partial index on errors (level = 'error' OR level = 'warn')
- Async writes via Winston transport (non-blocking)
- Consider partitioning by month if volume grows

### File Rotation (CLI)

**Configuration**:
- Daily rotation (new file per day)
- Max 10MB per file (gzip compress)
- 7-day retention (delete old files)
- ~70MB disk space max

**Location**: `prompt-bench/logs/` (gitignored)

### Logger Singleton Performance

**Winston performance** (benchmarks):
- ~10,000 logs/sec with file transport
- ~100,000 logs/sec with console transport
- Async writes don't block main thread

**Our use case**: <100 logs/sec (well within limits)

---

## Monitoring & Observability

### Key Metrics to Track

**CLI (via log analysis)**:
- Session duration distribution
- Phase failure rates (sync, run, evaluate)
- Cost per generation (tracked in CSV already)

**App (via database queries)**:
```sql
-- Error rate by operation type
SELECT operation_type, COUNT(*) as error_count
FROM application_logs
WHERE level = 'error' AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY operation_type;

-- Credit operation failures
SELECT COUNT(*) as failed_credits
FROM application_logs
WHERE operation_type LIKE 'credit_%' 
  AND message LIKE '%failed%'
  AND timestamp > NOW() - INTERVAL '1 day';

-- Slow operations (>5 seconds)
SELECT operation_type, AVG(duration_ms) as avg_ms
FROM application_logs
WHERE duration_ms > 5000
GROUP BY operation_type;
```

### Dashboard Ideas (Future)

- Grafana dashboard showing error rates
- Supabase dashboard with log queries
- Alert on high error rates (>5% in 1 hour)

---

## Known Limitations & Trade-offs

### Winston vs Alternatives

**Pino** (faster, but less flexible):
- Pro: 5x faster than Winston (~50k logs/sec)
- Con: Less mature transport ecosystem
- Con: More complex custom transports

**tslog** (TypeScript-native):
- Pro: Better TypeScript inference
- Con: Smaller community, fewer transports
- Con: No built-in rotation

**Decision**: Winston is best for our use case (mature, flexible, good enough performance)

### Database Logging Latency

**Async writes** mean logs may be delayed by 100-500ms.
- Pro: Non-blocking, doesn't slow down app
- Con: Recent logs may not be queryable immediately
- Mitigation: Console transport in development for real-time debugging

### Context Propagation Overhead

**Passing logger context** through every function adds boilerplate.
- Pro: Explicit, testable, thread-safe
- Con: More verbose than global logger
- Mitigation: Create logger at top of request handler, pass down

**Alternative**: AsyncLocalStorage (Node.js context API)
- **Rejected**: More complex, harder to debug, Next.js compatibility issues

---

## Success Criteria

**Phase 1 Complete (CLI) When**:
- Zero console.log calls in prompt-bench/
- All commands log to prompt-bench/logs/
- Session context in every log line
- Tests pass with logger integration

**Phase 2 Complete (App) When**:
- Zero console.log calls in src/lib/
- Critical operations logged to DB (credits, jobs, generation)
- API routes have request-scoped logging
- Error logs include stack traces

**Overall Success**:
- Debugging sessions reduced from 30min to 5min (can query logs)
- Credit operation failures traceable via user_id + job_id
- Cost tracking anomalies identifiable from logs
- No performance regression (<50ms overhead per request)

---

## Next Steps (After Implementation)

1. **Add log aggregation**: Export to external service (Datadog, LogTail)
2. **Client-side logging**: Browser errors to /api/logs
3. **Structured alerts**: Email on high error rates
4. **Log-based metrics**: Convert logs to time-series metrics
5. **Audit trail**: Use logs for compliance (user actions)

