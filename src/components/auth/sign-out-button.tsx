'use client';

import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/auth';

export function SignOutButton(): React.ReactElement {
  const router = useRouter();

  const handleSignOut = async (): Promise<void> => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-gray-600 hover:text-gray-900"
    >
      Sign out
    </button>
  );
}
