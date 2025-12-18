'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/lib/auth/hooks';
import { getCreditHistory } from '@/lib/db/credits';
import { getPricingForModal } from '@/lib/stripe/checkout-actions';
import type { CreditTransaction, TransactionType } from '@/types';
import type { PricingPack } from '@/lib/pricing/utils';

const getTransactionTypeColor = (type: TransactionType): string => {
  switch (type) {
    case 'purchase':
      return 'bg-success/10 text-success border-success/20';
    case 'generation':
      return 'bg-primary/10 text-primary border-primary/20';
    case 'refund':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'bonus':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'expiration':
      return 'bg-destructive/10 text-destructive border-destructive/20';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const formatTransactionType = (type: TransactionType): string => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatAmount = (amount: number): string => {
  const sign = amount > 0 ? '+' : '';
  return `${sign}${amount}`;
};

export function CreditsTab(): React.ReactElement {
  const { user } = useUserProfile();
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [packs, setPacks] = useState<Record<string, PricingPack> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [history, pricing] = await Promise.all([
          getCreditHistory(user.id),
          getPricingForModal()
        ]);
        setTransactions(history);
        setPacks(pricing);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load credit history');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <Card  className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Credit History</h3>
            <p className="text-sm text-muted-foreground">Your credit transactions and balance changes</p>
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="text-right space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card  className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Credit History</h3>
             <p className="text-sm text-destructive">
               Error loading credit history: {error}
             </p>
           </div>
         </div>
       </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card  className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Credit History</h3>
            <p className="text-sm text-muted-foreground">No credit transactions yet</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Your credit purchases, generations, and other transactions will appear here.
            </p>
             <Link href="/pricing" className="text-sm text-primary hover:underline">
               Buy credits →
             </Link>
           </div>
         </div>
       </Card>
    );
  }

  return (
    <Card  className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Credit History</h3>
          <p className="text-sm text-muted-foreground">Your credit transactions and balance changes</p>
        </div>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/5 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={getTransactionTypeColor(transaction.transaction_type)}
                  >
                    {formatTransactionType(transaction.transaction_type)}
                  </Badge>
                  <span className="font-medium">
                    {formatAmount(transaction.amount)} credits
                  </span>
                </div>
                 {transaction.description && (
                   <p className="text-sm text-muted-foreground">
                     {transaction.description}
                   </p>
                 )}
                 {transaction.transaction_type === 'pack_purchase' && (
                   <div className="text-sm text-muted-foreground mt-1">
                     {transaction.amount} credits purchased
                   </div>
                 )}
                <p className="text-xs text-muted-foreground">
                  {new Date(transaction.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Balance: {transaction.balance_after}
                </p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </Card>
  );
}
