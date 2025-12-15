import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { MessagesPageClient } from '@/components/admin/messages-page-client';

export default async function MessagesPage() {
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
        <h1 className="text-3xl font-display font-bold mb-2">User Messages</h1>
        <p className="text-muted-foreground">
          Monitor and respond to user messages with sentiment analysis.
        </p>
      </div>

      <Suspense fallback={<div>Loading messages...</div>}>
        <MessagesPageClient />
      </Suspense>
    </div>
  );
}