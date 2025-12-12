import { requireAuth } from '@/lib/auth/server';
import { Suspense } from 'react';
import { SettingsTabs } from '@/components/settings';
import { PageContainer } from '@/components/layout/page-container';
import { Spinner } from '@/components/ui/spinner';

export default async function SettingsPage() {
  await requireAuth();

  return (
    <PageContainer narrow>
      <h1 className="text-3xl font-bold font-display mb-8">Settings</h1>
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" centered />
        </div>
      }>
        <SettingsTabs />
      </Suspense>
    </PageContainer>
  );
}