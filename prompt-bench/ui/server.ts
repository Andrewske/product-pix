#!/usr/bin/env bun
import { resolve, join, relative } from 'node:path';
import { readdirSync, readFileSync } from 'node:fs';
import { config } from 'dotenv';
import { createAdminClient } from '../../src/lib/supabase/admin';
import { testCommand } from '../commands/test';
import { logger } from '../core/logger';
import { runAnalysisPhase, runGenerationPhase, runEvaluationPhase } from '../core/notebook-orchestrator';
import { isOk } from '../core/errors';
import { EVALUATION_PROMPT } from '../core/evaluator';
import type { AnalysisResult, GenerationResult, EvaluationPhaseResult } from '../core/notebook-orchestrator';
import type { ProgressCallback } from '../core/orchestrator';
import type { BatchFileMetadata, TemplateMetadata } from './types/index';

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

Bun.serve({
  port: 8181,
  idleTimeout: 255, // 4.25 minutes max for Bun.serve, for long-running prompt bench operations
  fetch(req: Request) {
    const url = new URL(req.url);

    // Route handlers
    if (url.pathname === '/') return serveHTML();
    if (url.pathname === '/results') return serveHTML(); // Same HTML, client-side routing
    if (url.pathname === '/notebook') return serveNotebookHTML();
    if (url.pathname === '/api/batches') return handleBatches(req);
    if (url.pathname === '/api/templates') return handleTemplates(req);
    if (url.pathname === '/api/results') return handleResults(req);
    if (url.pathname === '/api/run' && req.method === 'POST') return handleRun(req);
    if (url.pathname === '/api/notebook/fixtures') return handleNotebookFixtures(req);
    if (url.pathname === '/api/notebook/analyze' && req.method === 'POST') return handleNotebookAnalyze(req);
    if (url.pathname === '/api/notebook/generate' && req.method === 'POST') return handleNotebookGenerate(req);
    if (url.pathname === '/api/notebook/evaluate' && req.method === 'POST') return handleNotebookEvaluate(req);
    if (url.pathname.match(/^\/api\/notebook\/session\/[^/]+$/)) return handleNotebookSession(req);

    return new Response('Not Found', { status: 404 });
  }
});

console.log('🚀 Prompt Bench UI running at http://localhost:8181');

const serveHTML = (): Response => {
  const experimentBundle = loadBundle('experiment.js')
    .replace(/<\/script>/gi, '<\\/script>'); // Escape closing script tags

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prompt Bench - Experiment Runner</title>
      <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
    </head>
    <body>
      <div id="root"></div>
      <script>
        ${experimentBundle}

        // Mount app using bundled React
        ExperimentApp.mount();
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};

const serveNotebookHTML = (): Response => {
  const notebookBundle = loadBundle('notebook.js')
    .replace(/<\/script>/gi, '<\\/script>'); // Escape closing script tags

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Prompt Bench - Notebook</title>
      <script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
    </head>
    <body>
      <div id="root"></div>
      <script>
        ${notebookBundle}

        // Mount app using bundled React
        NotebookApp.mount();
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
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
      .select('slug, version, status')
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
    const { sessionId, parentRunId, templateSlug, templateData, variables } = body;

    if (!sessionId || !parentRunId || !templateSlug) {
      return Response.json({ error: 'Missing required fields: sessionId, parentRunId, templateSlug' }, { status: 400 });
    }

    // Call real orchestrator function
    const result = await runGenerationPhase({
      sessionId,
      parentRunId,
      templateSlug,
      templateData: templateData || {},
      variables: variables || {}
    });

    if (!isOk(result)) {
      logger.error('Notebook generation failed', {
        sessionId,
        parentRunId,
        error: result.error.message
      });
      return Response.json({ error: result.error.message }, { status: 500 });
    }

    logger.info('Notebook generation succeeded', {
      sessionId,
      runId: (result.data as GenerationResult).runId,
      imageUrl: (result.data as GenerationResult).imageUrl
    });

    return Response.json(result.data as GenerationResult);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Notebook generate endpoint error', { error: message });
    return Response.json({ error: 'Generation failed: ' + message }, { status: 500 });
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
      .order('phase', { ascending: true })
      .order('phase_run_number', { ascending: true });

    if (error) {
      logger.error('Failed to load notebook session', {
        sessionId,
        error: error.message
      });
      return Response.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    // Group by phase
    const phases = {
      analysis: runs?.filter(r => r.phase === 'analysis') || [],
      generation: runs?.filter(r => r.phase === 'generation') || [],
      evaluation: runs?.filter(r => r.phase === 'evaluation') || []
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