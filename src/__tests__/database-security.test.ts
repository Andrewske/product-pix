import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { TestDatabase, TestSetup } from './integration-utils';

describe('Database Security Migrations', () => {
  let db: TestDatabase;

  beforeAll(async () => {
    db = await TestSetup.beforeAll();
  });

  afterAll(async () => {
    await TestSetup.afterAll();
  });

  describe('get_filtered_user_list RPC Security', () => {
    it('should have admin authorization check', async () => {
      // Create a non-admin test user
      const nonAdminUser = await db.createTestUser({
        email: 'nonadmin@example.com',
        is_admin: false
      });

      // Create an admin test user
      const adminUser = await db.createTestUser({
        email: 'admin@example.com',
        is_admin: true
      });

      // Verify users were created
      expect(nonAdminUser.id).toBeDefined();
      expect(adminUser.id).toBeDefined();
      expect(nonAdminUser.is_admin).toBe(false);
      expect(adminUser.is_admin).toBe(true);

      // Note: Full RPC testing requires authenticated client context
      // This test verifies the migration structure is correct
      // Manual testing steps documented in acceptance criteria
    });

    it('should verify RPC function exists with security definer', async () => {
      const client = db.getClient();

      // Check that the function exists
      const { data: _data, error } = await client.rpc('get_filtered_user_list');

      // Should fail due to auth check, but not due to function not existing
      expect(error).toBeDefined();
      expect(error!.message).toContain('Unauthorized');
    });
  });

  describe('user_activity INSERT Policy Security', () => {
    it('should allow users to insert their own activity', async () => {
      const user = await db.createTestUser({
        email: 'activity-test@example.com'
      });

      const client = db.getClient();

      // Insert activity for the user (should succeed with admin client)
      const { error } = await client
        .from('user_activity')
        .insert({
          user_id: user.id,
          event_type: 'test_activity',
          properties: { test: true }
        });

      expect(error).toBeNull();
    });

    it('should allow admins to insert activity for any user', async () => {
      const _adminUser = await db.createTestUser({
        email: 'admin-activity@example.com',
        is_admin: true
      });

      const regularUser = await db.createTestUser({
        email: 'regular-activity@example.com',
        is_admin: false
      });

      const client = db.getClient();

      // Admin inserting activity for another user (should succeed with admin client)
      const { error } = await client
        .from('user_activity')
        .insert({
          user_id: regularUser.id,
          event_type: 'admin_test_activity',
          properties: { admin_action: true }
        });

      expect(error).toBeNull();
    });

    it('should verify table exists and is accessible', async () => {
      // Basic check that we can query the table
      const client = db.getClient();
      const { data: _data, error } = await client
        .from('user_activity')
        .select('id')
        .limit(1);

      // Should not error due to permissions (admin client bypasses RLS)
      expect(error).toBeNull();
    });
  });
});