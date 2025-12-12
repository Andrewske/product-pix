import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { POST } from '../route';

// Mock dependencies
const mockCreateContactMessage = mock(() => Promise.resolve({
  success: true,
  messageId: 'test-message-id'
} as any));

const mockRateLimitersApi = mock(() => Promise.resolve({
  success: true,
  remaining: 59
}));

const mockLoggerInfo = mock(() => {});
const mockLoggerError = mock(() => {});

// Mock modules
mock.module('@/lib/db/contacts', () => ({
  createContactMessage: mockCreateContactMessage,
}));

mock.module('@/lib/rate-limit', () => ({
  rateLimiters: {
    api: mockRateLimitersApi,
  },
}));

mock.module('@/lib/logging', () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
  },
}));

describe('Contact API Route', () => {
  beforeEach(() => {
    // Reset mocks
    mockCreateContactMessage.mockClear();
    mockRateLimitersApi.mockClear();
    mockLoggerInfo.mockClear();
    mockLoggerError.mockClear();
  });

  describe('POST /api/contact', () => {
    it('should accept valid contact form submission', async () => {
      const requestData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'This is a test message with enough content to pass validation.',
      };

      const mockRequest = {
        headers: {
          get: mock((header: string) => {
            if (header === 'x-forwarded-for') return '192.168.1.1';
            if (header === 'user-agent') return 'Test Browser';
            return null;
          }),
        },
        json: () => Promise.resolve(requestData),
      } as any;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(200);
      expect(result).toEqual({
        success: true,
        messageId: 'test-message-id',
      });

      expect(mockRateLimitersApi).toHaveBeenCalledWith('192.168.1.1');
      expect(mockCreateContactMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'This is a test message with enough content to pass validation.',
        })
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith('Contact message submitted successfully', {
        messageId: 'test-message-id',
        email: 'john@example.com',
      });
    });

    it('should handle rate limit exceeded', async () => {
      mockRateLimitersApi.mockResolvedValueOnce({
        success: false,
        remaining: 0,
      });

      const requestData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Valid message content.',
      };

      const mockRequest = {
        headers: {
          get: mock(() => '192.168.1.1'),
        },
        json: () => Promise.resolve(requestData),
      } as any;

      const response = await POST(mockRequest);

      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBe('60');

      const result = await response.json();
      expect(result).toEqual({
        error: 'Too many requests. Please try again later.',
        retryAfter: 60,
      });

      expect(mockCreateContactMessage).not.toHaveBeenCalled();
    });

    it('should reject invalid email format', async () => {
      const requestData = {
        name: 'John Doe',
        email: 'invalid-email',
        message: 'Valid message content.',
      };

      const mockRequest = {
        headers: {
          get: mock(() => '192.168.1.1'),
        },
        json: () => Promise.resolve(requestData),
      } as any;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid request');
      expect(result.details).toBeDefined();
      expect(result.details[0].path).toContain('email');

      expect(mockCreateContactMessage).not.toHaveBeenCalled();
    });

    it('should reject message too short', async () => {
      const requestData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hi',
      };

      const mockRequest = {
        headers: {
          get: mock(() => '192.168.1.1'),
        },
        json: () => Promise.resolve(requestData),
      } as any;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid request');
      expect(result.details).toBeDefined();
      expect(result.details[0].path).toContain('message');

      expect(mockCreateContactMessage).not.toHaveBeenCalled();
    });

    it('should reject empty name', async () => {
      const requestData = {
        name: '',
        email: 'john@example.com',
        message: 'Valid message content.',
      };

      const mockRequest = {
        headers: {
          get: mock(() => '192.168.1.1'),
        },
        json: () => Promise.resolve(requestData),
      } as any;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(400);
      expect(result.error).toBe('Invalid request');
      expect(result.details).toBeDefined();
      expect(result.details[0].path).toContain('name');

      expect(mockCreateContactMessage).not.toHaveBeenCalled();
    });

    it('should handle database error', async () => {
      mockCreateContactMessage.mockResolvedValueOnce({
        success: false,
        error: 'Database connection failed',
      } as any);

      const requestData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Valid message content.',
      };

      const mockRequest = {
        headers: {
          get: mock(() => '192.168.1.1'),
        },
        json: () => Promise.resolve(requestData),
      } as any;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result).toEqual({
        error: 'Failed to send message. Please try again.',
      });

      expect(mockLoggerError).toHaveBeenCalledWith('Failed to create contact message', {
        error: 'Database connection failed',
        email: 'john@example.com',
      });
    });

    it('should normalize email to lowercase and trim fields', async () => {
      const requestData = {
        name: '  John Doe  ',
        email: 'JOHN@EXAMPLE.COM',
        message: '  Valid message content.  ',
      };

      const mockRequest = {
        headers: {
          get: mock(() => '192.168.1.1'),
        },
        json: () => Promise.resolve(requestData),
      } as any;

      await POST(mockRequest);

      expect(mockCreateContactMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'This is a test message with enough content to pass validation.',
        })
      );
    });

    it('should handle missing IP headers gracefully', async () => {
      const requestData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Valid message content.',
      };

      const mockRequest = {
        headers: {
          get: mock(() => null),
        },
        json: () => Promise.resolve(requestData),
      } as any;

      await POST(mockRequest);

      expect(mockRateLimitersApi).toHaveBeenCalledWith('unknown');
      expect(mockCreateContactMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Valid message content.',
        })
      );
    });

    it('should handle unexpected errors', async () => {
      const mockRequest = {
        headers: {
          get: mock(() => '192.168.1.1'),
        },
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as any;

      const response = await POST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(500);
      expect(result).toEqual({
        error: 'Internal server error',
      });

      expect(mockLoggerError).toHaveBeenCalledWith('Unexpected error in contact API', {
        error: expect.any(Error),
      });
    });
  });
});