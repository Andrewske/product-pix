'use client';

import { useCredits } from '@/lib/auth/hooks';
import { Badge } from '@/components/ui/badge';
import { Coins } from 'lucide-react';

export function CreditBalanceDisplay() {
  const { credits, loading } = useCredits();

  if (loading) {
    return (
      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
    );
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5">
      <Coins className="h-4 w-4" />
      <span className="font-semibold">{credits}</span>
      <span className="text-xs text-muted-foreground">credits</span>
    </Badge>
  );
}
