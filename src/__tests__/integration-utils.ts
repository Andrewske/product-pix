import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import type { User } from '@/types';

// Test database utilities for integration tests
export class TestDatabase {
  private supabase: ReturnType<typeof createAdminClient>;

  constructor() {
    this.supabase = createAdminClient();
  }

  // Clean up all test data
  async cleanup(): Promise<void> {
    // Delete in reverse dependency order to avoid foreign key constraints
    await this.supabase.from('credit_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('batch_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('batch_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('generated_images').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('uploads').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  }

  // Create a test user directly in the database
  async createTestUser(overrides: Partial<Database['public']['Tables']['users']['Insert']> = {}): Promise<User> {
    const userId = overrides.id || `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const email = overrides.email || `test-${userId}@example.com`;

    const userData: Database['public']['Tables']['users']['Insert'] = {
      id: userId,
      email,
      display_name: overrides.display_name || `Test User ${userId}`,
      credit_balance: overrides.credit_balance ?? 100,
      tier: overrides.tier || 'free',
      created_at: overrides.created_at || new Date().toISOString(),
      updated_at: overrides.updated_at || new Date().toISOString(),
      preferences: overrides.preferences || null,
      stripe_customer_id: overrides.stripe_customer_id || null,
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test user: ${error.message}`);
    }

    return data;
  }

  // Get a user by ID
  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  // Update user credits directly (bypassing business logic for testing)
  async setUserCredits(userId: string, credits: number): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ credit_balance: credits, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to set user credits: ${error.message}`);
    }
  }

  // Create a test job
  async createTestJob(userId: string, overrides: Partial<Database['public']['Tables']['jobs']['Insert']> = {}): Promise<Database['public']['Tables']['jobs']['Row']> {
    const jobId = overrides.id || `test-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const jobData: Database['public']['Tables']['jobs']['Insert'] = {
      id: jobId,
      user_id: userId,
      status: overrides.status || 'pending',
      prompt: overrides.prompt || 'Test prompt',
      template_slug: overrides.template_slug || 'test-template',
      parameters: overrides.parameters || { model: 'test-model' },
      created_at: overrides.created_at || new Date().toISOString(),
      completed_at: overrides.completed_at || null,
      error_message: overrides.error_message || null,
      upload_id: overrides.upload_id || null,
      template_id: overrides.template_id || null,
      credits_charged: overrides.credits_charged || 0,
      max_retries: overrides.max_retries || 3,
      retry_count: overrides.retry_count || 0,
      started_at: overrides.started_at || null,
    };

    const { data, error } = await this.supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test job: ${error.message}`);
    }

    return data;
  }

  // Create a test upload
  async createTestUpload(userId: string, overrides: Partial<Database['public']['Tables']['uploads']['Insert']> = {}): Promise<Database['public']['Tables']['uploads']['Row']> {
    const uploadId = overrides.id || `test-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const uploadData: Database['public']['Tables']['uploads']['Insert'] = {
      id: uploadId,
      user_id: userId,
      filename: overrides.filename || 'test-image.jpg',
      file_size: overrides.file_size || 1024,
      mime_type: overrides.mime_type || 'image/jpeg',
      file_key: overrides.file_key || `uploads/${uploadId}.jpg`,
      created_at: overrides.created_at || new Date().toISOString(),
      deleted_at: overrides.deleted_at || null,
      height: overrides.height || null,
      width: overrides.width || null,
    };

    const { data, error } = await this.supabase
      .from('uploads')
      .insert(uploadData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create test upload: ${error.message}`);
    }

    return data;
  }

  // Get raw Supabase client for advanced operations
  getClient(): ReturnType<typeof createAdminClient> {
    return this.supabase;
  }
}

// Transaction wrapper for test isolation
export async function withTransaction<T>(
  operation: (db: TestDatabase) => Promise<T>
): Promise<T> {
  const db = new TestDatabase();

  try {
    // Note: Supabase doesn't support nested transactions in the same way as raw SQL
    // This is a simplified approach - in production, you'd want proper transaction isolation
    const result = await operation(db);
    return result;
  } catch (error) {
    // Cleanup on error
    await db.cleanup();
    throw error;
  }
}

// Auth utilities for integration tests
export class TestAuth {
  private supabase: ReturnType<typeof createClient>;

  constructor() {
    // Create a client with test credentials
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  // Generate a mock JWT token for testing (simplified - in real tests you'd use proper auth)
  // Note: This is for testing purposes only and doesn't create real authenticated sessions
  generateMockToken(userId: string): string {
    // This is a mock JWT structure - in real integration tests,
    // you'd need to set up proper Supabase auth or mock the auth layer
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: userId,
      email: `test-${userId}@example.com`,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    })).toString('base64url');
    const signature = 'mock-signature'; // Mock signature

    return `${header}.${payload}.${signature}`;
  }

  // Get client for auth operations
  getClient(): ReturnType<typeof createClient> {
    return this.supabase;
  }
}

// Test data factories
export const TestDataFactory = {
  user: (overrides: Partial<Database['public']['Tables']['users']['Insert']> = {}): Database['public']['Tables']['users']['Insert'] => ({
    id: `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    email: `test-${Date.now()}@example.com`,
    display_name: 'Test User',
    credit_balance: 100,
    tier: 'free',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  job: (userId: string, overrides: Partial<Database['public']['Tables']['jobs']['Insert']> = {}): Database['public']['Tables']['jobs']['Insert'] => ({
    id: `test-job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    status: 'pending',
    prompt: 'Test prompt for image generation',
    template_slug: 'test-template',
    parameters: { model: 'gemini-3-pro-image-preview' },
    created_at: new Date().toISOString(),
    credits_charged: 0,
    max_retries: 3,
    retry_count: 0,
    ...overrides,
  }),

  upload: (userId: string, overrides: Partial<Database['public']['Tables']['uploads']['Insert']> = {}): Database['public']['Tables']['uploads']['Insert'] => ({
    id: `test-upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    user_id: userId,
    filename: 'test-image.jpg',
    file_size: 1024,
    mime_type: 'image/jpeg',
    file_key: `uploads/test-${Date.now()}.jpg`,
    created_at: new Date().toISOString(),
    ...overrides,
  }),
};

// Global test database instance
let globalTestDb: TestDatabase | null = null;

// Get or create global test database instance
export function getTestDatabase(): TestDatabase {
  if (!globalTestDb) {
    globalTestDb = new TestDatabase();
  }
  return globalTestDb;
}

// Setup and teardown helpers for test suites
export const TestSetup = {
  // Setup before all tests in a suite
  async beforeAll(): Promise<TestDatabase> {
    const db = getTestDatabase();
    await db.cleanup();
    return db;
  },

  // Cleanup after all tests in a suite
  async afterAll(): Promise<void> {
    if (globalTestDb) {
      await globalTestDb.cleanup();
      globalTestDb = null;
    }
  },

  // Setup before each test
  async beforeEach(): Promise<TestDatabase> {
    const db = getTestDatabase();
    // Note: Individual test cleanup is handled by the test itself
    return db;
  },

  // Cleanup after each test (optional - use if needed)
  async afterEach(): Promise<void> {
    // Individual test cleanup is typically handled in the test
  },
};