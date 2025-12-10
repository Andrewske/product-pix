'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { AccountTab } from './account-tab';
import { CreditsTab } from './credits-tab';
import { BillingTab } from './billing-tab';

export function SettingsTabs() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentTab = searchParams.get('tab') || 'account';

  const handleTabChange = (value: string) => {
    router.push(`/settings?tab=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('account')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'account'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Account
          </button>
          <button
            onClick={() => handleTabChange('billing')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'billing'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => handleTabChange('credits')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'credits'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Credits
          </button>
        </nav>
      </div>

      <div className="py-6">
        {currentTab === 'account' && <AccountTab />}
        {currentTab === 'billing' && <BillingTab />}
        {currentTab === 'credits' && <CreditsTab />}
      </div>
    </div>
  );
}