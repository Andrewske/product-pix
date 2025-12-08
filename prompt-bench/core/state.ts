/**
 * Session state management for prompt iteration system
 */

import { Result, ok, err, createError } from '@bench/core/errors';
import {
  IterationState,
  IterationStateSchema,
  IterationConfig,
  SessionSummary,
} from '@bench/core/iteration-types';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';

// =============================================================================
// Constants
// =============================================================================

const SESSIONS_DIR = 'prompt-bench/sessions';

const DEFAULT_CONFIG: IterationConfig = {
  populationSize: 8,
  eliteCount: 2,
  mutationRate: 0.6,
  crossoverRate: 0.3,
  wildRate: 0.1,
  convergenceThreshold: 0.05,
  maxGenerations: 10,
};

// =============================================================================
// Session Management Functions
// =============================================================================

/**
 * Create a new iteration session
 */
export const createSession = (
  templateSlug: string,
  templateVersion: number,
  config?: Partial<IterationConfig>
): IterationState => {
  const sessionId = randomUUID();
  const now = new Date().toISOString();

  const mergedConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  return {
    sessionId,
    templateSlug,
    templateVersion,
    createdAt: now,
    updatedAt: now,
    generations: [],
    currentPopulation: [],
    scoreHistory: [],
    config: mergedConfig,
    productTests: [], // Will be populated during session initialization
  };
};

/**
 * Load a session from disk
 */
export const loadSession = async (
  sessionId: string,
  sessionsDir: string = SESSIONS_DIR
): Promise<Result<IterationState>> => {
  const sessionPath = join(sessionsDir, `${sessionId}.json`);

  try {
    const data = await fs.readFile(sessionPath, 'utf-8');
    const parsed = JSON.parse(data);

    // Validate with Zod schema
    const validationResult = IterationStateSchema.safeParse(parsed);
    if (!validationResult.success) {
      return err(createError(
        'VALIDATION_ERROR',
        `Invalid session data: ${validationResult.error.message}`
      ));
    }

    return ok(validationResult.data);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return err(createError('VALIDATION_ERROR', `Session ${sessionId} not found`));
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('STORAGE_ERROR', `Failed to load session: ${message}`));
  }
};

/**
 * Save a session to disk
 */
export const saveSession = async (
  state: IterationState,
  sessionsDir: string = SESSIONS_DIR
): Promise<Result<void>> => {
  const sessionPath = join(sessionsDir, `${state.sessionId}.json`);

  try {
    // Update timestamp
    const updatedState = {
      ...state,
      updatedAt: new Date().toISOString(),
    };

    // Ensure directory exists
    await fs.mkdir(dirname(sessionPath), { recursive: true });

    // Write to temp file first (atomic write)
    const tempPath = `${sessionPath}.tmp`;
    await fs.writeFile(tempPath, JSON.stringify(updatedState, null, 2), 'utf-8');

    // Atomic rename
    await fs.rename(tempPath, sessionPath);

    return ok(undefined);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('STORAGE_ERROR', `Failed to save session: ${message}`));
  }
};

/**
 * List all sessions
 */
export const listSessions = async (
  sessionsDir: string = SESSIONS_DIR
): Promise<Result<SessionSummary[]>> => {
  try {
    // Ensure directory exists
    await fs.mkdir(sessionsDir, { recursive: true });

    const files = await fs.readdir(sessionsDir);
    const sessionFiles = files.filter(f => f.endsWith('.json'));

    const summaries: SessionSummary[] = [];

    for (const file of sessionFiles) {
      const sessionId = file.replace('.json', '');
      const loadResult = await loadSession(sessionId, sessionsDir);

      if (loadResult.ok) {
        const state = loadResult.data;
        const lastGeneration = state.generations[state.generations.length - 1];
        const lastBestScore = lastGeneration?.bestScore ?? null;

        summaries.push({
          sessionId: state.sessionId,
          templateSlug: state.templateSlug,
          createdAt: state.createdAt,
          generationCount: state.generations.length,
          lastBestScore,
        });
      }
      // Skip invalid sessions
    }

    // Sort by creation date (newest first)
    summaries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return ok(summaries);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('STORAGE_ERROR', `Failed to list sessions: ${message}`));
  }
};

/**
 * Delete a session
 */
export const deleteSession = async (
  sessionId: string,
  sessionsDir: string = SESSIONS_DIR
): Promise<Result<void>> => {
  const sessionPath = join(sessionsDir, `${sessionId}.json`);

  try {
    await fs.unlink(sessionPath);
    return ok(undefined);
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return err(createError('VALIDATION_ERROR', `Session ${sessionId} not found`));
    }

    const message = error instanceof Error ? error.message : 'Unknown error';
    return err(createError('STORAGE_ERROR', `Failed to delete session: ${message}`));
  }
};

/**
 * Get the most recent session, optionally filtered by template
 */
export const getLatestSession = async (
  templateSlug?: string,
  sessionsDir: string = SESSIONS_DIR
): Promise<Result<IterationState | null>> => {
  const listResult = await listSessions(sessionsDir);
  if (!listResult.ok) {
    return listResult;
  }

  const sessions = listResult.data.filter(s =>
    !templateSlug || s.templateSlug === templateSlug
  );

  if (sessions.length === 0) {
    return ok(null);
  }

  const latest = sessions[0];
  return loadSession(latest.sessionId);
};