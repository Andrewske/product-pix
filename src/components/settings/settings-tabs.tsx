'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { AccountTab } from './account-tab';
import { CreditsTab } from './credits-tab';
import { BillingTab } from './billing-tab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function SettingsTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTab = searchParams.get('tab') || 'account';

  const handleTabChange = (value: string) => {
    router.push(`/settings?tab=${value}`, { scroll: false });
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="bg-muted p-1 rounded-lg">
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="credits">Credits</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="space-y-6">
        <AccountTab />
      </TabsContent>
      <TabsContent value="billing" className="space-y-6">
        <BillingTab />
      </TabsContent>
      <TabsContent value="credits" className="space-y-6">
        <CreditsTab />
      </TabsContent>
    </Tabs>
  );
}
