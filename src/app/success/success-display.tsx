'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { PageContainer } from '@/components/layout/page-container';

export function SuccessDisplay() {
  const [status, setStatus] = useState<'success' | 'redirecting'>('success');
  const router = useRouter();
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Set up timers for status change and redirect
    statusTimerRef.current = setTimeout(() => {
      setStatus('redirecting');
    }, 2000); // Show success for 2 seconds

    redirectTimerRef.current = setTimeout(() => {
      router.push('/dashboard');
    }, 2500); // Redirect after additional 500ms

    return () => {
      // Clean up both timers
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [router]);

  return (
    <PageContainer>
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card  className="p-8 text-center max-w-md w-full">
          <div aria-live="polite" aria-atomic="true">
            {status === 'success' && (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
                  <CheckCircle className="size-12 text-accent relative z-10 animate-in fade-in duration-500" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold font-display">
                    Payment <span className="gradient-text-studio">Successful</span>
                  </h1>
                  <p className="text-muted-foreground">
                    Your credits have been added to your account
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="size-4" />
                  <span>Redirecting to dashboard...</span>
                </div>
              </div>
            )}

            {status === 'redirecting' && (
              <div className="flex flex-col items-center space-y-6">
                <Spinner size="md" />
                <p className="text-muted-foreground text-sm">Redirecting...</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}