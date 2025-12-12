// src/app/batch/page.tsx
import { requireAuth } from '@/lib/auth/server';
import { getUserBatches } from '@/lib/db/batch';
import { BatchList } from '@/components/batch/batch-list';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function BatchListPage() {
  const user = await requireAuth();

  const batches = await getUserBatches(user.id, { limit: 50 });

  return (
    <PageContainer>
      <SectionHeader
        title="Batch Processing"
        description="Upload CSV files to generate multiple product photos at once"
      />
      <div className="flex justify-end mb-8">
        <Link href="/batch/new">
          <Button>Create Batch</Button>
        </Link>
      </div>

      <BatchList initialBatches={batches} />
    </PageContainer>
  );
}

