import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { AnalyticsPageClient } from '@/components/admin/analytics-page-client';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect('/login');
  }

  const isAdmin = await requireAdmin(currentUser.id);

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold mb-2">Message Analytics</h1>
        <p className="text-muted-foreground">
          Monitor message sentiment, categories, and recent activity.
        </p>
      </div>

      <Suspense fallback={<div>Loading analytics...</div>}>
        <AnalyticsPageClient />
      </Suspense>
    </div>
  );
}