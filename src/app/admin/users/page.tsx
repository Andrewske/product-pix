import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { UsersListPageClient } from '@/components/admin/users-list-page-client';
import { getAdminDashboardStats, getFilteredUserList } from '@/lib/db/admin-stats';

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect('/login');
  }

  const isAdmin = await requireAdmin(currentUser.id);

  if (!isAdmin) {
    redirect('/');
  }

  // Fetch initial data
  const [stats, initialUserList] = await Promise.all([
    getAdminDashboardStats(),
    getFilteredUserList({}, { limit: 20 }),
  ]);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Users</h1>
        <p className="text-muted-foreground">
          Monitor user accounts, activity, and manage user data.
        </p>
      </div>

      <Suspense fallback={<div>Loading users...</div>}>
        <UsersListPageClient
          initialStats={stats}
          initialUserList={initialUserList}
        />
      </Suspense>
    </div>
  );
}