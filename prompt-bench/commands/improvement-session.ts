/**
 * Session management for template improvement system
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { Result } from '@bench/core/errors';
import { ok, err, createError } from '@bench/core/errors';
import type {
  ImprovementSession,
  ImprovementSessionRow,
  TemplateIteration,
  TemplateIterationRow,
  ImprovementConfig,
} from '@bench/core/improvement-types';

// =============================================================================
// Session CRUD Operations
// =============================================================================

/**
 * Create a new improvement session
 */
export const createSession = async (
  templateSlug: string,
  config: ImprovementConfig
): Promise<Result<ImprovementSession>> => {
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any)
    .from('template_improvement_sessions')
    .insert({
      template_slug: templateSlug,
      current_iteration: 0,
      max_iterations: config.maxIterations,
      target_score: config.targetScore,
      initial_mean_score: null,
      current_mean_score: null,
      total_improvement: 0,
      total_cost_usd: 0,
      config: config,
      status: 'active',
    })
    .select()
    .single();

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to create session: ${error.message}`)
    );
  }

  return ok(parseSessionRow(data));
};

/**
 * Load an existing session by ID
 */
export const loadSession = async (
  sessionId: string
): Promise<Result<ImprovementSession>> => {
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any)
    .from('template_improvement_sessions')
    .select('*')
    .eq('session_id', sessionId)
    .single();

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to load session: ${error.message}`)
    );
  }

  if (!data) {
    return err(createError('DATABASE_ERROR', `Session not found: ${sessionId}`));
  }

  return ok(parseSessionRow(data));
};

/**
 * Load the most recent active session for a template
 */
export const loadActiveSession = async (
  templateSlug: string
): Promise<Result<ImprovementSession | null>> => {
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any)
    .from('template_improvement_sessions')
    .select('*')
    .eq('template_slug', templateSlug)
    .eq('status', 'active')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to load active session: ${error.message}`)
    );
  }

  if (!data) {
    return ok(null);
  }

  return ok(parseSessionRow(data));
};

/**
 * Update session state
 */
export const updateSession = async (
  sessionId: string,
  updates: Partial<{
    currentIteration: number;
    currentMeanScore: number | null;
    totalImprovement: number;
    totalCostUsd: number;
    status: 'active' | 'completed' | 'abandoned';
  }>
): Promise<Result<void>> => {
  const supabase = createAdminClient();

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.currentIteration !== undefined) {
    updateData.current_iteration = updates.currentIteration;
  }
  if (updates.currentMeanScore !== undefined) {
    updateData.current_mean_score = updates.currentMeanScore;
  }
  if (updates.totalImprovement !== undefined) {
    updateData.total_improvement = updates.totalImprovement;
  }
  if (updates.totalCostUsd !== undefined) {
    updateData.total_cost_usd = updates.totalCostUsd;
  }
  if (updates.status !== undefined) {
    updateData.status = updates.status;
  }

  const { error } = await (supabase as any)
    .from('template_improvement_sessions')
    .update(updateData)
    .eq('session_id', sessionId);

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to update session: ${error.message}`)
    );
  }

  return ok(undefined);
};

/**
 * List all sessions for a template
 */
export const listSessions = async (
  templateSlug: string,
  options?: {
    status?: 'active' | 'completed' | 'abandoned';
    limit?: number;
  }
): Promise<Result<ImprovementSession[]>> => {
  const supabase = createAdminClient();

  let query = (supabase as any)
    .from('template_improvement_sessions')
    .select('*')
    .eq('template_slug', templateSlug);

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  query = query.order('started_at', { ascending: false });

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to list sessions: ${error.message}`)
    );
  }

  return ok((data || []).map(parseSessionRow));
};

/**
 * Archive a session (mark as completed)
 */
export const archiveSession = async (sessionId: string): Promise<Result<void>> => {
  return updateSession(sessionId, { status: 'completed' });
};

/**
 * Delete a session and all its iterations
 */
export const deleteSession = async (sessionId: string): Promise<Result<void>> => {
  const supabase = createAdminClient();

  const { error } = await (supabase as any)
    .from('template_improvement_sessions')
    .delete()
    .eq('session_id', sessionId);

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to delete session: ${error.message}`)
    );
  }

  return ok(undefined);
};

// =============================================================================
// Iteration Operations
// =============================================================================

/**
 * Save an iteration to the database
 */
export const saveIteration = async (
  iteration: Omit<TemplateIteration, 'id' | 'timestamp'>
): Promise<Result<TemplateIteration>> => {
  const supabase = createAdminClient();

  const row: Omit<TemplateIterationRow, 'id' | 'timestamp'> = {
    session_id: iteration.sessionId,
    iteration_number: iteration.iterationNumber,
    baseline_template: iteration.baselineTemplate,
    improved_template: iteration.improvedTemplate,
    changes: iteration.changes,
    user_modifications: iteration.userModifications,
    baseline_batch_label: iteration.baselineBatchLabel,
    improved_batch_label: iteration.improvedBatchLabel,
    baseline_results: iteration.baselineResults,
    improved_results: iteration.improvedResults,
    delta: iteration.delta,
    analysis: iteration.analysis,
    suggestions: iteration.suggestions,
    costs: iteration.costs,
  };

  const { data, error } = await (supabase as any)
    .from('template_iterations')
    .insert(row)
    .select()
    .single();

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to save iteration: ${error.message}`)
    );
  }

  return ok(parseIterationRow(data));
};

/**
 * Load iterations for a session
 */
export const loadIterations = async (
  sessionId: string
): Promise<Result<TemplateIteration[]>> => {
  const supabase = createAdminClient();

  const { data, error } = await (supabase as any)
    .from('template_iterations')
    .select('*')
    .eq('session_id', sessionId)
    .order('iteration_number', { ascending: true });

  if (error) {
    return err(
      createError('DATABASE_ERROR', `Failed to load iterations: ${error.message}`)
    );
  }

  return ok((data || []).map(parseIterationRow));
};

// =============================================================================
// Parsing Helpers
// =============================================================================

const parseSessionRow = (row: ImprovementSessionRow): ImprovementSession => {
  return {
    sessionId: row.session_id,
    templateSlug: row.template_slug,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    status: row.status,
    currentIteration: row.current_iteration,
    maxIterations: row.max_iterations,
    targetScore: row.target_score,
    initialMeanScore: row.initial_mean_score,
    currentMeanScore: row.current_mean_score,
    totalImprovement: Number(row.total_improvement),
    totalCostUsd: Number(row.total_cost_usd),
    config: row.config as ImprovementConfig,
  };
};

const parseIterationRow = (row: TemplateIterationRow): TemplateIteration => {
  return {
    id: row.id,
    sessionId: row.session_id,
    iterationNumber: row.iteration_number,
    timestamp: row.timestamp,
    baselineTemplate: row.baseline_template,
    improvedTemplate: row.improved_template,
    changes: row.changes,
    userModifications: row.user_modifications,
    baselineBatchLabel: row.baseline_batch_label,
    improvedBatchLabel: row.improved_batch_label,
    baselineResults: row.baseline_results,
    improvedResults: row.improved_results,
    delta: row.delta,
    analysis: row.analysis,
    suggestions: row.suggestions,
    costs: row.costs,
  };
};

