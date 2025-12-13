import { describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import { createLogger } from '../index';
import { requestContext } from '@/lib/request/context';

describe('createLogger', () => {
  let stdoutSpy: ReturnType<typeof spyOn>;
  let stderrSpy: ReturnType<typeof spyOn>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    stdoutSpy = spyOn(process.stdout, 'write').mockImplementation(() => true);
    stderrSpy = spyOn(process.stderr, 'write').mockImplementation(() => true);
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
    process.env = originalEnv;
  });

  describe('log level filtering', () => {
    it('logs debug when LOG_LEVEL=debug', () => {
      process.env.LOG_LEVEL = 'debug';
      const logger = createLogger();

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(stdoutSpy).toHaveBeenCalledTimes(3);
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it('logs info and above when LOG_LEVEL=info', () => {
      process.env.LOG_LEVEL = 'info';
      const logger = createLogger();

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(stdoutSpy).toHaveBeenCalledTimes(2);
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it('logs warn and above when LOG_LEVEL=warn', () => {
      process.env.LOG_LEVEL = 'warn';
      const logger = createLogger();

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it('logs only error when LOG_LEVEL=error', () => {
      process.env.LOG_LEVEL = 'error';
      const logger = createLogger();

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(stdoutSpy).toHaveBeenCalledTimes(0);
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it('defaults to info level when LOG_LEVEL is not set', () => {
      delete process.env.LOG_LEVEL;
      const logger = createLogger();

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(stdoutSpy).toHaveBeenCalledTimes(2);
      expect(stderrSpy).toHaveBeenCalledTimes(1);
    });

    it('defaults to info level when LOG_LEVEL is invalid', () => {
      process.env.LOG_LEVEL = 'invalid';
      const logger = createLogger();

      logger.debug('debug message');
      logger.info('info message');

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('output format', () => {
    beforeEach(() => {
      process.env.LOG_LEVEL = 'debug';
    });

    it('outputs JSON with timestamp, level, and message', () => {
      const logger = createLogger();

      logger.info('test message');

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse((stdoutSpy.mock.calls[0][0] as string).trim());

      expect(output).toHaveProperty('timestamp');
      expect(output.level).toBe('info');
      expect(output.message).toBe('test message');
      expect(output).not.toHaveProperty('context');
    });

    it('includes context when provided', () => {
      const logger = createLogger();
      const context = { userId: '123', action: 'login' };

      logger.info('user logged in', context);

      expect(stdoutSpy).toHaveBeenCalledTimes(1);
      const output = JSON.parse((stdoutSpy.mock.calls[0][0] as string).trim());

      expect(output.context).toEqual(context);
    });

    it('writes error logs to stderr', () => {
      const logger = createLogger();

      logger.error('error message');

      expect(stderrSpy).toHaveBeenCalledTimes(1);
      expect(stdoutSpy).toHaveBeenCalledTimes(0);

      const output = JSON.parse((stderrSpy.mock.calls[0][0] as string).trim());
      expect(output.level).toBe('error');
      expect(output.message).toBe('error message');
    });

    it('writes info/warn/debug logs to stdout', () => {
      const logger = createLogger();

      logger.info('info message');
      logger.warn('warn message');
      logger.debug('debug message');

      expect(stdoutSpy).toHaveBeenCalledTimes(3);
      expect(stderrSpy).toHaveBeenCalledTimes(0);
    });
  });

  describe('timestamp format', () => {
    it('uses ISO string format for timestamp', () => {
      process.env.LOG_LEVEL = 'info';
      const logger = createLogger();

      const before = new Date();
      logger.info('test');
      const after = new Date();

      const output = JSON.parse((stdoutSpy.mock.calls[0][0] as string).trim());
      const timestamp = new Date(output.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(output.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('context handling', () => {
    it('handles empty context object', () => {
      process.env.LOG_LEVEL = 'info';
      const logger = createLogger();

      logger.info('message', {});

      const output = JSON.parse((stdoutSpy.mock.calls[0][0] as string).trim());
      expect(output.context).toEqual({});
    });

    it('handles complex context objects', () => {
      process.env.LOG_LEVEL = 'info';
      const logger = createLogger();

      const context = {
        user: { id: 123, name: 'John' },
        metadata: { source: 'api', version: '1.0' },
        tags: ['important', 'user-action']
      };

      logger.info('complex log', context);

      const output = JSON.parse((stdoutSpy.mock.calls[0][0] as string).trim());
      expect(output.context).toEqual(context);
    });
  });

  describe('automatic context injection', () => {
    let getStoreSpy: ReturnType<typeof spyOn>;

    beforeEach(() => {
      getStoreSpy = spyOn(requestContext, 'getStore');
    });

    afterEach(() => {
      getStoreSpy.mockRestore();
    });

    it('auto-injects requestId when available', () => {
      process.env.LOG_LEVEL = 'info';
      getStoreSpy.mockReturnValue({ requestId: 'req-123', userId: undefined, route: undefined });
      const logger = createLogger();

      logger.info('test message');

      const output = JSON.parse((stdoutSpy.mock.calls[0][0] as string).trim());
      expect(output.requestId).toBe('req-123');
      expect(output.userId).toBeUndefined();
      expect(output.route).toBeUndefined();
    });

    it('auto-injects userId when available', () => {
      process.env.LOG_LEVEL = 'info';
      getStoreSpy.mockReturnValue({ requestId: 'req-123', userId: 'user-456', route: undefined });
      const logger = createLogger();

      logger.info('test message');

      const output = JSON.parse((stdoutSpy.mock.calls[0][0] as string).trim());
      expect(output.requestId).toBe('req-123');
      expect(output.userId).toBe('user-456');
      expect(output.route).toBeUndefined();
    });

    it('auto-injects route when available', () => {
      process.env.LOG_LEVEL = 'info';
      getStoreSpy.mockReturnValue({ requestId: 'req-123', userId: 'user-456', route: '/api/test' });
      const logger = createLogger();

      logger.info('test message');

      const output = JSON.parse((stdoutSpy.mock.calls[0][0] as string).trim());
      expect(output.requestId).toBe('req-123');
      expect(output.userId).toBe('user-456');
      expect(output.route).toBe('/api/test');
    });

    it('does not inject context when AsyncLocalStorage is empty', () => {
      process.env.LOG_LEVEL = 'info';
      getStoreSpy.mockReturnValue(undefined);
      const logger = createLogger();

      logger.info('test message');

      const output = JSON.parse((stdoutSpy.mock.calls[0][0] as string).trim());
      expect(output.requestId).toBeUndefined();
      expect(output.userId).toBeUndefined();
      expect(output.route).toBeUndefined();
    });

    it('merges manual context with auto-injected context', () => {
      process.env.LOG_LEVEL = 'info';
      getStoreSpy.mockReturnValue({ requestId: 'req-123', userId: 'user-456', route: '/api/test' });
      const logger = createLogger();
      const manualContext = { action: 'login', status: 'success' };

      logger.info('user logged in', manualContext);

      const output = JSON.parse((stdoutSpy.mock.calls[0][0] as string).trim());
      expect(output.requestId).toBe('req-123');
      expect(output.userId).toBe('user-456');
      expect(output.route).toBe('/api/test');
      expect(output.context).toEqual(manualContext);
    });
  });
});
