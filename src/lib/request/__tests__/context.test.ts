import { describe, it, expect } from 'bun:test';
import { requestContext, getRequestContext, setUserId } from '../context';

describe('requestContext', () => {
  it('returns undefined outside context', () => {
    expect(getRequestContext()).toBeUndefined();
  });

  it('returns context inside run()', () => {
    requestContext.run({ requestId: 'test-id' }, () => {
      expect(getRequestContext()?.requestId).toBe('test-id');
    });
  });

  it('setUserId updates context', () => {
    requestContext.run({ requestId: 'test-id' }, () => {
      setUserId('user-123');
      expect(getRequestContext()?.userId).toBe('user-123');
    });
  });

  it('context is isolated between runs', () => {
    requestContext.run({ requestId: 'test-id-1' }, () => {
      expect(getRequestContext()?.requestId).toBe('test-id-1');
    });

    requestContext.run({ requestId: 'test-id-2' }, () => {
      expect(getRequestContext()?.requestId).toBe('test-id-2');
    });
  });

  it('nested contexts work correctly', () => {
    requestContext.run({ requestId: 'outer' }, () => {
      expect(getRequestContext()?.requestId).toBe('outer');

      requestContext.run({ requestId: 'inner' }, () => {
        expect(getRequestContext()?.requestId).toBe('inner');
      });

      expect(getRequestContext()?.requestId).toBe('outer');
    });
  });

  it('setUserId only affects current context', () => {
    requestContext.run({ requestId: 'test-id' }, () => {
      setUserId('user-123');
      expect(getRequestContext()?.userId).toBe('user-123');

      requestContext.run({ requestId: 'inner' }, () => {
        expect(getRequestContext()?.userId).toBeUndefined();
        setUserId('user-456');
        expect(getRequestContext()?.userId).toBe('user-456');
      });

      expect(getRequestContext()?.userId).toBe('user-123');
    });
  });

  it('handles undefined userId initially', () => {
    requestContext.run({ requestId: 'test-id' }, () => {
      expect(getRequestContext()?.userId).toBeUndefined();
      setUserId('user-123');
      expect(getRequestContext()?.userId).toBe('user-123');
    });
  });
});