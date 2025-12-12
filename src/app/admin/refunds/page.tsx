import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';
import { RefundApprovalQueue } from '@/components/admin/refund-approval-queue';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeader } from '@/components/ui/section-header';
import React from 'react';

export default async function AdminRefundsPage(): Promise<React.JSX.Element> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const isAdmin = await requireAdmin(user.id);

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <PageContainer>
      <SectionHeader
        title="Refund Approval Queue"
        className="text-left mb-8"
      />
      <div className="max-w-4xl mx-auto">
        <RefundApprovalQueue />
      </div>
    </PageContainer>
  );
}