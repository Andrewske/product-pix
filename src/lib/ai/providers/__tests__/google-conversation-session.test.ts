import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { GoogleConversationSession } from '../gemini';

// Mock the entire @google/genai module
const mockSendMessage = mock(() => Promise.resolve({
  candidates: [{
    content: {
      parts: [{
        inlineData: {
          data: 'dGVzdA==',
          mimeType: 'image/png',
        },
      }],
    },
  }],
}));
const mockGetHistory = mock(() => []);
const mockCreateChat = mock(() => ({
  sendMessage: mockSendMessage,
  getHistory: mockGetHistory,
}));

const mockChats = {
  create: mockCreateChat,
};

const mockGoogleGenAI = mock(() => ({
  chats: mockChats,
}));

// Mock before importing
mock.module('@google/genai', () => ({
  GoogleGenAI: mockGoogleGenAI,
}));

describe('GoogleConversationSession', () => {
  let session: GoogleConversationSession;

  beforeEach(() => {
    // Reset mocks
    mockSendMessage.mockReset();
    mockGetHistory.mockReset();
    mockCreateChat.mockReset();
    mockGoogleGenAI.mockReset();

    session = new GoogleConversationSession();
  });

  describe('initialize', () => {
    it('creates chat with reference images in history', async () => {
      // Mock the client
      const mockClient = { chats: mockChats };
      (session as any).client = mockClient;

      const referenceImages = [
        { buffer: Buffer.from('image1'), mimeType: 'image/png', label: 'Front view' },
        { buffer: Buffer.from('image2'), mimeType: 'image/jpeg' },
      ];
      const systemContext = 'Generate product photos';

      await session.initialize(referenceImages, systemContext);

      expect(mockCreateChat).toHaveBeenCalledWith({
        model: expect.any(String),
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
        history: [
          {
            role: 'user',
            parts: [
              { text: systemContext },
              { text: 'Reference image 1: Front view' },
              {
                inlineData: {
                  data: 'aW1hZ2Ux', // base64 of 'image1'
                  mimeType: 'image/png',
                },
              },
              {
                inlineData: {
                  data: 'aW1hZ2Uy', // base64 of 'image2'
                  mimeType: 'image/jpeg',
                },
              },
            ],
          },
        ],
      });

      expect(session.getMessageCount()).toBe(1);
    });

    it('includes labels as text parts before images', async () => {
      // Mock the client
      const mockClient = { chats: mockChats };
      (session as any).client = mockClient;

      const referenceImages = [
        { buffer: Buffer.from('test'), mimeType: 'image/png', label: 'Test label' },
      ];

      await session.initialize(referenceImages, 'Context');

      expect(mockCreateChat).toHaveBeenCalledWith(
        expect.objectContaining({
          history: expect.arrayContaining([
            expect.objectContaining({
              parts: expect.arrayContaining([
                { text: 'Reference image 1: Test label' },
                {
                  inlineData: {
                    data: 'dGVzdA==', // base64 of 'test'
                    mimeType: 'image/png',
                  },
                },
              ]),
            }),
          ]),
        })
      );
    });
  });

  describe('generateNext', () => {
    beforeEach(() => {
      // Mock the client and initialize session for most tests
      const mockClient = { chats: mockChats };
      (session as any).client = mockClient;
      (session as any).chat = {
        sendMessage: mockSendMessage,
        getHistory: mockGetHistory,
      };
      (session as any).messageCount = 1;
    });

    it('returns error if not initialized', async () => {
      (session as any).chat = null;

      const response = await session.generateNext('test prompt', {
        aspectRatio: '1:1',
        resolution: '1k',
      });

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.code).toBe('INVALID_INPUT');
        expect(response.error).toContain('not initialized');
      }
    });

    it('rejects unsupported aspect ratios', async () => {
      const response = await session.generateNext('test prompt', {
        aspectRatio: '2:3', // unsupported
        resolution: '1k',
      });

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.code).toBe('INVALID_INPUT');
        expect(response.error).toContain('Unsupported aspect ratio');
      }
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('extracts image from response candidates', async () => {
      const mockResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: 'dGVzdGltYWdl', // base64 'testimage'
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 20,
          totalTokenCount: 30,
        },
      };

      mockSendMessage.mockResolvedValue(mockResponse);

      const response = await session.generateNext('test prompt', {
        aspectRatio: '1:1',
        resolution: '1k',
      });

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.imageData).toBe('dGVzdGltYWdl');
        expect(response.mimeType).toBe('image/png');
        expect(response.usage).toEqual({
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        });
      }
    });

    it('handles rate limit errors', async () => {
      mockSendMessage.mockRejectedValue({
        status: 429,
        message: 'Rate limit exceeded',
      });

      const response = await session.generateNext('test prompt', {
        aspectRatio: '1:1',
        resolution: '1k',
      });

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.code).toBe('RATE_LIMITED');
        expect(response.retryable).toBe(true);
      }
    });

    it('handles content filter errors', async () => {
      mockSendMessage.mockRejectedValue({
        message: 'Content was blocked due to safety policies',
      });

      const response = await session.generateNext('test prompt', {
        aspectRatio: '1:1',
        resolution: '1k',
      });

      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.code).toBe('PROVIDER_ERROR');
        expect(response.retryable).toBe(true);
      }
    });

    it('increments message count on success only', async () => {
      // Mock successful response
      mockSendMessage.mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    data: 'dGVzdA==',
                    mimeType: 'image/png',
                  },
                },
              ],
            },
          },
        ],
      });

      await session.generateNext('test prompt', {
        aspectRatio: '1:1',
        resolution: '1k',
      });

      expect(session.getMessageCount()).toBe(2);

      // Mock failure response
      mockSendMessage.mockRejectedValue(new Error('API error'));

      await session.generateNext('test prompt', {
        aspectRatio: '1:1',
        resolution: '1k',
      });

      // Message count should not increment on failure
      expect(session.getMessageCount()).toBe(2);
    });
  });
});