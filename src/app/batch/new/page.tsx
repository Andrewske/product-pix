import { requireAuth } from '@/lib/auth/server';
import { BatchNewPageContent } from '@/components/batch/batch-new-page-content';

export default async function NewBatchPage(): Promise<JSX.Element> {
  await requireAuth();

  return <BatchNewPageContent />;
}

