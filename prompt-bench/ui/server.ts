#!/usr/bin/env bun
import { resolve, join, relative } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { createAdminClient } from '../../src/lib/supabase/admin';
import { testCommand } from '../commands/test';
import { logger } from '../core/logger';
import { runAnalysisPhase, runGenerationPhase, runEvaluationPhase, runConversationGenerationPhase } from '../core/notebook-orchestrator';
import { isOk } from '../core/errors';
import { EVALUATION_PROMPT } from '../core/evaluator';
import { compileTemplate } from '../core/compiler';
import type { AnalysisResult, GenerationResult, EvaluationPhaseResult } from '../core/notebook-orchestrator';
import type { ProgressCallback } from '../core/orchestrator';
import type { BatchFileMetadata, TemplateMetadata } from './types/index';
import type { ConversationGenerationResult } from '../core/types';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const loadBundle = (filename: string): string => {
  try {
    return readFileSync(join(__dirname, 'dist', filename), 'utf-8');
  } catch (err) {
    console.error(`Failed to load bundle ${filename}:`, err);
    return `console.error('Bundle ${filename} not found. Run: bun run bench:ui:build');`;
  }
};

const loadBuiltCSS = (): string => {
  try {
    return readFileSync(join(__dirname, 'dist', 'styles.css'), 'utf-8');
  } catch (err) {
    console.error('Failed to load styles.css:', err);
    return '/* Built CSS not found. Run: bun bench:ui:build */';
  }
};

const serveApp = (bundleName: string, title: string, mountCall: string): Response => {
  const bundle = loadBundle(bundleName)
    .replace(/<\/script>/gi, '<\\/script>');
  const builtCSS = loadBuiltCSS();

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Geist:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        ${builtCSS}
      </style>
    </head>
    <body class="dark bg-background text-foreground antialiased">
      <div id="root"></div>
      <script>
        ${bundle}

        // Mount app using bundled React
        ${mountCall}
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};

Bun.serve({
  port: 8181,
  idleTimeout: 255, // 4.25 minutes max for Bun.serve, for long-running prompt bench operations
  fetch(req: Request) {
    const url = new URL(req.url);

    // Route handlers
    if (url.pathname === '/') return serveHTML();
    if (url.pathname === '/results') return serveHTML(); // Same HTML, client-side routing
    if (url.pathname === '/notebook') return serveNotebookHTML();
    if (url.pathname === '/review') return serveReviewHTML();
    if (url.pathname === '/api/batches') return handleBatches(req);
    if (url.pathname === '/api/templates') return handleTemplates(req);
    if (url.pathname === '/api/results') return handleResults(req);
    if (url.pathname === '/api/run' && req.method === 'POST') return handleRun(req);
    if (url.pathname === '/api/notebook/fixtures') return handleNotebookFixtures(req);
    if (url.pathname === '/api/notebook/analyze' && req.method === 'POST') return handleNotebookAnalyze(req);
    if (url.pathname === '/api/notebook/generate' && req.method === 'POST') return handleNotebookGenerate(req);
    if (url.pathname === '/api/notebook/conversation-generate' && req.method === 'POST') return handleNotebookConversationGenerate(req);
    if (url.pathname === '/api/notebook/evaluate' && req.method === 'POST') return handleNotebookEvaluate(req);
    if (url.pathname === '/api/notebook/compile-prompt' && req.method === 'POST') return handleNotebookCompilePrompt(req);
    if (url.pathname === '/api/notebook/save-template' && req.method === 'POST') return handleSaveTemplate(req);
    if (url.pathname.match(/^\/api\/notebook\/session\/[^/]+$/)) return handleNotebookSession(req);
    if (url.pathname.match(/^\/api\/notebook\/runs\/[^/]+\/archive$/) && req.method === 'POST') return handleArchiveRun(req);
    if (url.pathname === '/api/review/pending') return handleReviewPending(req);
    if (url.pathname === '/api/review/rate' && req.method === 'POST') return handleReviewRate(req);

    return new Response('Not Found', { status: 404 });
  }
});

console.log('🚀 Prompt Bench UI running at http://localhost:8181');

const serveHTML = (): Response =>
  serveApp('experiment.js', 'Prompt Bench - Experiment Runner', 'ExperimentApp.mount();');

const serveNotebookHTML = (): Response =>
  serveApp('notebook.js', 'Prompt Bench - Notebook', 'NotebookApp.mount();');

const serveReviewHTML = (): Response =>
  serveApp('review.js', 'Prompt Bench - Human Review', 'ReviewApp.mount();');
const handleBatches = async (req: Request): Promise<Response> => {
  try {
    const fixturesDir = resolve(process.cwd(), 'prompt-bench/fixtures');
    const files = readdirSync(fixturesDir).filter(f => f.endsWith('.json'));

    const batches: BatchFileMetadata[] = files.map(filename => {
      const fullPath = join(fixturesDir, filename);
      const content = readFileSync(fullPath, 'utf-8');
      const parsed = JSON.parse(content);

      return {
        filename: relative(process.cwd(), fullPath),
        label: parsed.label || filename.replace('.json', ''),
        description: parsed.description,
        testCount: parsed.tests?.length || 0,
      };
    });

    return Response.json({ batches });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load batches: ${message}` }, { status: 500 });
  }
};

const handleTemplates = async (req: Request): Promise<Response> => {
  try {
    const supabase = createAdminClient();

    const { data: templates, error } = await supabase
      .from('prompt_templates')
      .select('slug, version, status, template_data, variables_schema')
      .order('slug', { ascending: true })
      .order('version', { ascending: false });

    if (error) {
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by slug, keeping only latest version per slug
    const uniqueTemplates = templates?.reduce((acc, template) => {
      if (!acc.find(t => t.slug === template.slug)) {
        acc.push(template);
      }
      return acc;
    }, [] as TemplateMetadata[]) || [];

    return Response.json({ templates: uniqueTemplates });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load templates: ${message}` }, { status: 500 });
  }
};

const handleResults = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const label = url.searchParams.get('label');
    const minScore = url.searchParams.get('minScore');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const supabase = createAdminClient();

    let query = supabase
      .from('prompt_tests')
      .select(`
        id,
        batch_label,
        template_id,
        status,
        image_url,
        created_at,
        cost_usd,
        prompt_evaluations (
          score_overall,
          details
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    // Apply filters
    if (label) query = query.eq('batch_label', label);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: tests, error } = await query;

    if (error) {
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by batch_label and calculate stats
    type TestRecord = NonNullable<typeof tests>[number];
    interface GroupedResult {
      batchLabel: string;
      tests: TestRecord[];
      stats: { count: number; meanScore: number; totalCost: number };
    }

    const grouped = (tests || []).reduce<Record<string, GroupedResult>>((acc, test) => {
      const label = test.batch_label || 'unlabeled';

      if (!acc[label]) {
        acc[label] = {
          batchLabel: label,
          tests: [],
          stats: { count: 0, meanScore: 0, totalCost: 0 },
        };
      }

      acc[label].tests.push(test);
      acc[label].stats.count++;
      acc[label].stats.totalCost += test.cost_usd || 0;

      const evaluation = test.prompt_evaluations?.[0];
      if (evaluation) {
        acc[label].stats.meanScore += evaluation.score_overall;
      }

      return acc;
    }, {});

    // Calculate mean scores
    Object.values(grouped).forEach((group) => {
      if (group.stats.count > 0) {
        group.stats.meanScore = group.stats.meanScore / group.stats.count;
      }
    });

    // Filter by minScore if provided
    let results: GroupedResult[] = Object.values(grouped);
    if (minScore) {
      const minScoreNum = parseFloat(minScore);
      results = results.filter((r) => r.stats.meanScore >= minScoreNum);
    }

    return Response.json({ results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load results: ${message}` }, { status: 500 });
  }
};

const createSSERunStream = (template: string, batchFile: string, batchLabel?: string): ReadableStream => {
  return new ReadableStream({
    async start(controller) {
      const connectionStart = Date.now();

      // Log connection established
      logger.debug('SSE connection established', {
        batchLabel,
        connectionDuration: '0s'
      });

      // Progress callback that writes to SSE stream
      const onProgress: ProgressCallback = (
        phase: string,
        current: number,
        total: number,
        message: string
      ) => {
        const data = JSON.stringify({
          phase,
          current,
          total,
          message,
          timestamp: Date.now(),
        });
        controller.enqueue(`data: ${data}\n\n`);

        // Log SSE event sent
        logger.debug('SSE event sent', {
          batchLabel,
          event: 'progress',
          phase,
          progress: `${current}/${total}`
        });
      };

      try {
        // Build CLI args
        const args = ['--template', template, '--batch', batchFile];
        if (batchLabel) args.push('--label', batchLabel);

        // Execute test command with progress callback
        await testCommand(args, onProgress);

        // Send completion event
        controller.enqueue(`data: ${JSON.stringify({ done: true })}\n\n`);

        // Log completion
        const totalDuration = Math.round((Date.now() - connectionStart) / 1000);
        logger.info('SSE connection closed', {
          batchLabel,
          duration: `${totalDuration}s`,
          reason: 'complete'
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        controller.enqueue(`data: ${JSON.stringify({ error: message })}\n\n`);

        // Log connection error
        const elapsed = Math.round((Date.now() - connectionStart) / 1000);
        logger.error('SSE connection error', {
          batchLabel,
          connectionDuration: `${elapsed}s`,
          error: message
        });
      } finally {
        controller.close();
      }
    },
  });
};

const handleRun = async (req: Request): Promise<Response> => {
  let body: { template?: string; batchFile?: string; label?: string };
  try {
    body = await req.json();
  } catch (parseError) {
    const message = parseError instanceof Error ? parseError.message : 'Unknown parse error';
    logger.error('SSE request JSON parse error', {
      rawMessage: 'request body',
      phase: 'request',
      position: 'handleRun',
      error: message
    });
    return Response.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  try {
    const { template, batchFile, label: batchLabel } = body;

    // Validate required fields
    if (!template || !batchFile) {
      return Response.json(
        { error: 'Missing required fields: template, batchFile' },
        { status: 400 }
      );
    }

    const stream = createSSERunStream(template, batchFile, batchLabel);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('SSE run handler error', {
      batchLabel: body.label,
      error: message
    });
    return Response.json({ error: `Failed to start run: ${message}` }, { status: 500 });
  }
};

const handleNotebookFixtures = async (req: Request): Promise<Response> => {
  try {
    const supabase = createAdminClient();

    const { data: fixtures, error } = await supabase
      .from('fixture_images')
      .select('id, filename, r2_url, product')
      .order('product', { ascending: true })
      .order('filename', { ascending: true });

    if (error) {
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by product
    const grouped = (fixtures || []).reduce((acc, fixture) => {
      if (!acc[fixture.product]) {
        acc[fixture.product] = [];
      }
      acc[fixture.product].push(fixture);
      return acc;
    }, {} as Record<string, typeof fixtures>);

    const totalCount = fixtures?.length || 0;
    const productCount = Object.keys(grouped).length;

    return Response.json({
      fixtures: grouped,
      metadata: { totalCount, productCount }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: `Failed to load fixtures: ${message}` }, { status: 500 });
  }
};

const handleNotebookAnalyze = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { sessionId, fixtureImageIds, variables, model, cacheEnabled, customPrompt, customSchema } = body;

    if (!sessionId || !fixtureImageIds || fixtureImageIds.length === 0) {
      return Response.json({ error: 'Missing required fields: sessionId, fixtureImageIds' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Call real orchestrator function
    const result = await runAnalysisPhase({
      sessionId,
      fixtureImageIds,
      variables: variables || {},
      model: model || 'gemini-2.0-flash',
      cacheEnabled: cacheEnabled ?? true,
      customPrompt,
      customSchema
    });

    if (!isOk(result)) {
      logger.error('Notebook analysis failed', {
        sessionId,
        error: result.error.message
      });
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const analysisResult = result.data as any;
    logger.info('Notebook analysis succeeded', {
      sessionId,
      runId: analysisResult.runId
    });

    // Fetch the database record to return to UI
    const { data: dbRecord, error: fetchError } = await supabase
      .from('prompt_tests')
      .select('*')
      .eq('id', analysisResult.runId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch analysis record', {
        sessionId,
        runId: analysisResult.runId,
        error: fetchError.message
      });
      return Response.json({ error: `Failed to fetch result: ${fetchError.message}` }, { status: 500 });
    }

    return Response.json(dbRecord);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook analyze endpoint error', { error: message });
    return Response.json({ error: 'Analysis failed: ' + message }, { status: 500 });
  }
};

const handleNotebookGenerate = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { sessionId, parentRunId, templateSlug, templateData, variables, model, config } = body;

    if (!sessionId || !parentRunId || !templateSlug) {
      return Response.json({ error: 'Missing required fields: sessionId, parentRunId, templateSlug' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Call real orchestrator function
    const result = await runGenerationPhase({
      sessionId,
      parentRunId,
      templateSlug,
      templateData: templateData || {},
      variables: variables || {},
      model,
      config
    });

    if (!isOk(result)) {
      logger.error('Notebook generation failed', {
        sessionId,
        parentRunId,
        error: result.error.message
      });
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const generationResult = result.data as GenerationResult;

    logger.info('Notebook generation succeeded', {
      sessionId,
      runId: generationResult.runId,
      imageUrls: generationResult.imageUrls
    });

    // Fetch the database record to return complete data to UI
    const { data: dbRecord, error: fetchError } = await supabase
      .from('prompt_tests')
      .select('*')
      .eq('id', generationResult.runId)
      .single();

    if (fetchError) {
      logger.error('Failed to fetch generation record', {
        sessionId,
        runId: generationResult.runId,
        error: fetchError.message
      });
      return Response.json({ error: `Failed to fetch result: ${fetchError.message}` }, { status: 500 });
    }

    return Response.json(dbRecord);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook generate endpoint error', { error: message });
    return Response.json({ error: 'Generation failed: ' + message }, { status: 500 });
  }
};

const handleNotebookConversationGenerate = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { sessionId, parentRunId, templateSlug, templateData, variables, model, config, outputCount } = body;

    // Validate required fields
    if (!sessionId || !parentRunId || !templateSlug || !outputCount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate outputCount range
    if (outputCount < 1 || outputCount > 7) {
      return Response.json({ error: 'outputCount must be between 1 and 7' }, { status: 400 });
    }

    // Call orchestrator
    const result = await runConversationGenerationPhase({
      sessionId,
      parentRunId,
      templateSlug,
      templateData: templateData || {},
      variables: variables || {},
      model,
      config,
      outputCount
    });

    if (!isOk(result)) {
      logger.error('Conversation generation failed', { error: result.error.message });
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    const orchestratorResult = result.data as ConversationGenerationResult;
    const supabase = createAdminClient();

    // After the orchestrator fix, there's only ONE record
    // Guard against empty array (defensive programming)
    if (!orchestratorResult.generationRuns.length) {
      logger.error('No generation results returned from orchestrator', { sessionId });
      return Response.json(
        { error: 'No generation results returned' },
        { status: 500 }
      );
    }

    const singleRunId = orchestratorResult.generationRuns[0].runId;
    const { data: dbRecord, error: fetchError } = await supabase
      .from('prompt_tests')
      .select('*')
      .eq('id', singleRunId)  // Single record query
      .single();

    if (fetchError) {
      logger.error('Failed to fetch generation record', {
        sessionId,
        error: fetchError.message
      });
      return Response.json(
        { error: `Failed to fetch result: ${fetchError.message}` },
        { status: 500 }
      );
    }

    // Return single record in array (maintains UI compatibility)
    return Response.json({
      generationRuns: [dbRecord],  // Array with 1 record
      totalTokens: orchestratorResult.totalTokens,
      totalCost: orchestratorResult.totalCost
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook conversation generate endpoint error', { error: message });
    return Response.json({ error: 'Conversation generation failed: ' + message }, { status: 500 });
  }
};

const formatEvaluationResponse = (result: EvaluationPhaseResult): Response => {
  logger.info('Notebook evaluation succeeded', {
    sessionId: result.runId,
    runId: result.runId,
    scoreOverall: result.scoreOverall
  });
  return Response.json(result);
};

const formatEvaluationError = (error: string, status: number = 500): Response => {
  logger.error('Notebook evaluation failed', { error });
  return Response.json({ error }, { status });
};

const handleNotebookEvaluate = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { sessionId, parentRunId, evaluationPrompt, model } = body;

    // Validate required fields
    if (!sessionId || !parentRunId) {
      return formatEvaluationError('Missing required fields: sessionId, parentRunId', 400);
    }

    // Call orchestrator
    const result = await runEvaluationPhase({
      sessionId,
      parentRunId,
      evaluationPrompt: evaluationPrompt || undefined,
      model: model || 'claude-sonnet-4-20250514'
    });

    // Handle result
    if (!isOk(result)) {
      return formatEvaluationError(result.error.message);
    }

    return formatEvaluationResponse(result.data as EvaluationPhaseResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return formatEvaluationError('Evaluation failed: ' + message);
  }
};

const handleNotebookCompilePrompt = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { templateSlug, templateData, variables } = body;

    // Validate required fields
    if (!templateSlug || !templateData) {
      return Response.json({ error: 'Missing required fields: templateSlug, templateData' }, { status: 400 });
    }

    // Fetch template to get variables_schema
    const supabase = createAdminClient();
    const { data: template, error: templateError } = await supabase
      .from('prompt_templates')
      .select('variables_schema')
      .eq('slug', templateSlug)
      .single();

    if (templateError || !template) {
      return Response.json({ error: 'Template not found' }, { status: 404 });
    }

    // Compile the template
    const compileResult = compileTemplate(
      templateData,
      template.variables_schema,
      variables || {}
    );

    if (!isOk(compileResult)) {
      return Response.json({ error: compileResult.error.message }, { status: 400 });
    }

    return Response.json({ prompt: (compileResult.data as any).prompt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json({ error: 'Failed to compile prompt: ' + message }, { status: 500 });
  }
};

const handleNotebookSession = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const sessionId = url.pathname.split('/').pop();

    if (!sessionId) {
      return Response.json({ error: 'Session ID required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Fetch all runs for this session
    const { data: runs, error } = await supabase
      .from('prompt_tests')
      .select(`
        *,
        prompt_evaluations(*)
      `)
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to load notebook session', {
        sessionId,
        error: error.message
      });
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Filter out archived runs (if archived column exists)
    const filteredRuns = runs?.filter(run => run.archived !== true) || [];

    // Group by phase
    const phases = {
      analysis: filteredRuns.filter(r => r.phase === 'analysis'),
      generation: filteredRuns.filter(r => r.phase === 'generation'),
      evaluation: filteredRuns.filter(r => r.phase === 'evaluation')
    };

    logger.info('Loaded notebook session', {
      sessionId,
      analysisRuns: phases.analysis.length,
      generationRuns: phases.generation.length,
      evaluationRuns: phases.evaluation.length
    });

    return Response.json({ sessionId, phases });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook session endpoint error', { error: message });
    return Response.json({ error: 'Failed to load session: ' + message }, { status: 500 });
  }
};

const handleSaveTemplate = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { slug, templateData, variablesSchema, type, outputCount } = body;

    if (!slug || !templateData) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Fetch current latest version
    const { data: currentTemplate, error: fetchError } = await supabase
      .from('prompt_templates')
      .select('version')
      .eq('slug', slug)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows
      return Response.json({ error: `Failed to fetch current version: ${fetchError.message}` }, { status: 500 });
    }

    // 2. Calculate next version (auto-increment)
    const nextVersion = currentTemplate ? currentTemplate.version + 1 : 1;

    // 3. Insert new template version
    const newTemplate = {
      slug,
      version: nextVersion,
      status: 'active',
      type: outputCount > 1 ? 'collection' : 'single',  // Auto-detect from outputCount
      output_count: outputCount || 1,
      template_data: templateData,
      variables_schema: variablesSchema
    };

    const { data: insertResult, error: insertError } = await supabase
      .from('prompt_templates')
      .insert(newTemplate)
      .select()
      .single();

    if (insertError) {
      return Response.json({ error: `Failed to save template: ${insertError.message}` }, { status: 500 });
    }

    logger.info('Template saved', { slug, version: nextVersion });

    return Response.json({
      template: insertResult,
      message: `Saved ${slug} v${nextVersion}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Save template endpoint error', { error: message });
    return Response.json({ error: 'Failed to save template: ' + message }, { status: 500 });
  }
};

const handleArchiveRun = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const runId = url.pathname.split('/').find((part, index, arr) => arr[index - 1] === 'runs');

    if (!runId) {
      return Response.json({ error: 'Run ID required' }, { status: 400 });
    }

    const body = await req.json();
    const { archived } = body;

    if (typeof archived !== 'boolean') {
      return Response.json({ error: 'archived must be a boolean' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Try to update the archived field (will work once migration is applied)
    const { data: updatedRun, error } = await supabase
      .from('prompt_tests')
      .update({ archived })
      .eq('id', runId)
      .select()
      .single();

    if (error) {
      // If the archived column doesn't exist yet, just return success
      // (migration not applied, but UI will still work)
      logger.warn('Archive update failed (migration not applied?)', {
        runId,
        archived,
        error: error.message
      });
      return Response.json({ run: { id: runId, archived } });
    }

    logger.info('Run archived/unarchived', { runId, archived });
    return Response.json({ run: updatedRun });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Archive run endpoint error', { error: message });
    return Response.json({ error: 'Failed to archive run: ' + message }, { status: 500 });
  }
};

const handleReviewPending = async (req: Request): Promise<Response> => {
  try {
    const supabase = createAdminClient();

    const { data: tests, error } = await supabase
      .from('prompt_tests')
      .select(`
        id,
        image_url,
        final_prompt,
        parent_run_id,
        debug_metadata,
        created_at,
        prompt_evaluations!inner (
          score_overall,
          details
        )
      `)
      .eq('phase', 'generation')
      .eq('status', 'completed')
      .eq('prompt_evaluations.evaluator_type', 'llm')
      .not('prompt_evaluations', 'is', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      logger.error('Failed to fetch pending reviews', { error: error.message });
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Filter out tests that already have human evaluations
    const testIds = tests?.map(t => t.id) || [];
    const { data: humanEvals, error: humanError } = await supabase
      .from('prompt_evaluations')
      .select('test_id')
      .in('test_id', testIds)
      .eq('evaluator_type', 'human');

    if (humanError) {
      logger.error('Failed to fetch human evaluations', { error: humanError.message });
      return Response.json({ error: `Database error: ${humanError.message}` }, { status: 500 });
    }

    const ratedTestIds = new Set(humanEvals?.map(e => e.test_id) || []);
    const unratedTests = tests?.filter(t => !ratedTestIds.has(t.id)) || [];

    // Fetch parent runs to get source images
    const parentRunIds = [...new Set(unratedTests.map(t => t.parent_run_id).filter(Boolean))];
    const { data: parentRuns, error: parentError } = await supabase
      .from('prompt_tests')
      .select('id, source_image_url')
      .in('id', parentRunIds);

    if (parentError) {
      logger.error('Failed to fetch parent runs', { error: parentError.message });
    }

    const parentRunMap = new Map(parentRuns?.map(p => [p.id, p.source_image_url]) || []);

    // Transform to camelCase and enrich with source images
    const pending = unratedTests.map(test => {
      const llmEval = test.prompt_evaluations?.[0];
      const debugMetadata = test.debug_metadata as any;
      const imageUrls = debugMetadata?.image_urls as string[] | undefined;

      return {
        id: test.id,
        imageUrl: test.image_url,
        imageUrls: imageUrls && imageUrls.length > 0 ? imageUrls : undefined,
        finalPrompt: test.final_prompt,
        sourceImageUrl: test.parent_run_id ? parentRunMap.get(test.parent_run_id) || null : null,
        llmScore: llmEval?.score_overall || 0,
        llmDetails: llmEval?.details || {},
        createdAt: test.created_at,
      };
    });

    logger.info('Fetched pending reviews', { count: pending.length });
    return Response.json({ pending });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Review pending endpoint error', { error: message });
    return Response.json({ error: 'Failed to load pending reviews: ' + message }, { status: 500 });
  }
};

const handleReviewRate = async (req: Request): Promise<Response> => {
  try {
    const body = await req.json();
    const { testId, score, imageIndex, notes } = body;

    // Validate required fields
    if (!testId || typeof score !== 'number') {
      return Response.json({ error: 'Missing required fields: testId, score' }, { status: 400 });
    }

    // Validate score range
    if (score < 1 || score > 10) {
      return Response.json({ error: 'Score must be between 1 and 10' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // UPSERT human evaluation
    const humanEvaluation = {
      test_id: testId,
      score_overall: score,
      details: { imageIndex, notes },
      evaluator_type: 'human',
      evaluator_model: null,
      cost_usd: 0,
      tokens_used: 0,
    };

    const { data: insertedEval, error: insertError } = await supabase
      .from('prompt_evaluations')
      .upsert(humanEvaluation, {
        onConflict: 'test_id,evaluator_type',
      })
      .select()
      .single();

    if (insertError) {
      logger.error('Failed to save human evaluation', {
        testId,
        error: insertError.message
      });
      return Response.json({ error: `Failed to save rating: ${insertError.message}` }, { status: 500 });
    }

    // Fetch corresponding LLM evaluation for comparison
    const { data: llmEval, error: llmError } = await supabase
      .from('prompt_evaluations')
      .select('score_overall, details')
      .eq('test_id', testId)
      .eq('evaluator_type', 'llm')
      .single();

    if (llmError) {
      logger.warn('LLM evaluation not found for comparison', { testId });
    }

    logger.info('Human rating saved', { testId, score });

    return Response.json({
      humanEvaluation: insertedEval,
      llmEvaluation: llmEval || null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Review rate endpoint error', { error: message });
    return Response.json({ error: 'Failed to save rating: ' + message }, { status: 500 });
  }
};