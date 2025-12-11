// src/components/layout/header.tsx
'use client';

import Link from 'next/link';
import { HelpCircle, Sparkles } from 'lucide-react';
import { useUserProfile } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserMenu } from './user-menu';
import { ThemeToggle } from '@/components/theme-toggle';

export function Header() {
  const { user, profile, loading } = useUserProfile();

  return (
    <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/60 rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
            <Sparkles className="w-5 h-5 text-accent-foreground" />
          </div>
          ProductPix
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4">
          <Link href="/help">
            <Button variant="ghost" size="icon" aria-label="Help">
              <HelpCircle className="h-5 w-5" />
            </Button>
          </Link>
          <ThemeToggle />
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
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm text-sm font-medium text-muted-foreground shadow-sm">
                {profile?.credit_balance ?? 0} credits
              </div>

              {/* User menu */}
              <UserMenu />
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
    </header>
  );
}
