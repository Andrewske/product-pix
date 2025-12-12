import { requireAuth } from '@/lib/auth/server';
import { GeneratePageContent } from '@/components/generate/generate-page-content';

export default async function GeneratePage(): Promise<JSX.Element> {
  await requireAuth();

  return <GeneratePageContent />;
}
