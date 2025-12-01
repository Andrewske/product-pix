// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { useUserProfile, signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export function Header() {
  const { user, profile, loading } = useUserProfile();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">ProductPix</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 animate-pulse rounded" />
            ) : user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Gallery
                </Link>
                <Link
                  href="/generate"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Generate
                </Link>

                {/* Credits badge */}
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {profile?.credit_balance ?? 0} credits
                </span>

                {/* User menu */}
                <button
                  onClick={handleSignOut}
                  className="text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
