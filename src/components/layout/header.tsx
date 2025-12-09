// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { useUserProfile, signOut } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export function Header() {
  const { user, profile, loading } = useUserProfile();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <span className="text-xl font-bold">ProductPix</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-4">
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : user ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost">Gallery</Button>
                </Link>
                <Link href="/generate">
                  <Button variant="ghost">Generate</Button>
                </Link>
                <Link href="/batch">
                  <Button variant="ghost">Batches</Button>
                </Link>

                {/* Credits badge */}
                <Badge variant="secondary">
                  {profile?.credit_balance ?? 0} credits
                </Badge>

                {/* User menu */}
                <Button variant="ghost" onClick={handleSignOut}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link href="/signup">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
