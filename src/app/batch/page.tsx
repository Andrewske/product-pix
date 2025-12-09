// src/app/batch/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserBatches } from '@/lib/db/batch';
import { BatchList } from '@/components/batch/batch-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function BatchListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const batches = await getUserBatches(user.id, { limit: 50 });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Batch Processing</h1>
          <p className="text-muted-foreground mt-2">
            Upload CSV files to generate multiple product photos at once
          </p>
        </div>
        <Link href="/batch/new">
          <Button>Create Batch</Button>
        </Link>
      </div>

      <BatchList initialBatches={batches} />
    </div>
  );
}

