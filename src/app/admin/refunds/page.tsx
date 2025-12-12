import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RefundApprovalQueue } from '@/components/admin/refund-approval-queue';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeader } from '@/components/ui/section-header';

export default async function AdminRefundsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Double-check admin status (defense in depth)
  const { data: userProfile, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (error || !userProfile?.is_admin) {
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