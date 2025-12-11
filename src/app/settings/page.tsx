import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { SettingsTabs } from '@/components/settings';
import { PageContainer } from '@/components/layout/page-container';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <PageContainer narrow>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      <Suspense fallback={
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      }>
        <SettingsTabs />
      </Suspense>
    </PageContainer>
  );
}