import { createClient } from '@/lib/supabase/server';
import { UserTimeline } from '@/components/admin/user-timeline';
import { UserStats } from '@/components/admin/user-stats';
import { getUserById } from '@/lib/db/users';
import { requireAdmin } from '@/lib/auth/admin';
import { redirect } from 'next/navigation';

export default async function UserDetailPage({
  params
}: {
  params: { userId: string }
}) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  if (!currentUser) {
    redirect('/login');
  }

  const isAdmin = await requireAdmin(currentUser.id);

  if (!isAdmin) {
    redirect('/');
  }

  const user = await getUserById(params.userId);
  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <h1 className="text-2xl font-bold mb-4">User Details</h1>
          <UserStats user={user} />
        </div>

        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">Activity Timeline</h2>
          <UserTimeline userId={params.userId} />
        </div>
      </div>
    </div>
  );
}