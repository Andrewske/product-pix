import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import {
  createSession,
  saveSession,
  loadSession,
  listSessions,
  deleteSession,
} from '@bench/core/state';

const TEST_SESSIONS_DIR = 'prompt-bench/sessions-test';

describe('state management', () => {
  beforeEach(async () => {
    // Create test directory
    await fs.mkdir(TEST_SESSIONS_DIR, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_SESSIONS_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('createSession', () => {
    it('creates session with defaults', () => {
      const session = createSession('test-template', 1);

      expect(session.sessionId).toMatch(/^[0-9a-f-]{36}$/);
      expect(session.templateSlug).toBe('test-template');
      expect(session.templateVersion).toBe(1);
      expect(session.generations).toEqual([]);
      expect(session.currentPopulation).toEqual([]);
      expect(session.scoreHistory).toEqual([]);
      expect(session.config.populationSize).toBe(8);
    });

    it('creates session with custom config', () => {
      const session = createSession('test-template', 1, {
        populationSize: 12,
        maxGenerations: 5,
      });

      expect(session.config.populationSize).toBe(12);
      expect(session.config.maxGenerations).toBe(5);
    });
  });

  describe('saveSession / loadSession', () => {
    it('round-trips session state', async () => {
      const session = createSession('test-template', 1);

      const saveResult = await saveSession(session, TEST_SESSIONS_DIR);
      expect(saveResult.ok).toBe(true);

      const loadResult = await loadSession(session.sessionId, TEST_SESSIONS_DIR);
      expect(loadResult.ok).toBe(true);
      if (loadResult.ok) {
        expect(loadResult.data.sessionId).toBe(session.sessionId);
        expect(loadResult.data.templateSlug).toBe('test-template');
      }
    });

    it('returns error for non-existent session', async () => {
      const result = await loadSession('non-existent-id', TEST_SESSIONS_DIR);
      expect(result.ok).toBe(false);
    });
  });

  describe('listSessions', () => {
    it('lists all sessions', async () => {
      const s1 = createSession('template-1', 1);
      const s2 = createSession('template-2', 1);

      await saveSession(s1, TEST_SESSIONS_DIR);
      await saveSession(s2, TEST_SESSIONS_DIR);

      const result = await listSessions(TEST_SESSIONS_DIR);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.length).toBe(2);
        expect(result.data.map(s => s.sessionId).sort()).toEqual([s1.sessionId, s2.sessionId].sort());
      }
    });

    it('returns empty array when no sessions exist', async () => {
      const result = await listSessions(TEST_SESSIONS_DIR);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([]);
      }
    });
  });

  describe('deleteSession', () => {
    it('deletes existing session', async () => {
      const session = createSession('test-template', 1);
      await saveSession(session, TEST_SESSIONS_DIR);

      const deleteResult = await deleteSession(session.sessionId, TEST_SESSIONS_DIR);
      expect(deleteResult.ok).toBe(true);

      const loadResult = await loadSession(session.sessionId, TEST_SESSIONS_DIR);
      expect(loadResult.ok).toBe(false);
    });

    it('returns error for non-existent session', async () => {
      const result = await deleteSession('non-existent-id', TEST_SESSIONS_DIR);
      expect(result.ok).toBe(false);
    });
  });
});