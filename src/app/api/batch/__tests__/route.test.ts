import { POST, GET } from '@/app/api/batch/route';
import { withAuth } from '@/lib/auth/api-middleware';

// Mock the withAuth function
jest.mock('@/lib/auth/api-middleware', () => ({
  withAuth: jest.fn(),
}));

const mockWithAuth = withAuth as jest.MockedFunction<typeof withAuth>;

describe('Batch Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export POST handler wrapped with withAuth', () => {
    // The POST export should be the result of withAuth(createBatchHandler)
    expect(mockWithAuth).toHaveBeenCalledTimes(2); // Once for POST, once for GET

    // Verify that POST is defined and is a function
    expect(typeof POST).toBe('function');
  });

  it('should export GET handler wrapped with withAuth', () => {
    // The GET export should be the result of withAuth(getBatchesHandler)
    expect(mockWithAuth).toHaveBeenCalledTimes(2); // Once for POST, once for GET

    // Verify that GET is defined and is a function
    expect(typeof GET).toBe('function');
  });
});