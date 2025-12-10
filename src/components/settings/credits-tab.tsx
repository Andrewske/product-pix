'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/lib/auth/hooks';
import { getCreditHistory } from '@/lib/db/credits';
import type { CreditTransaction, TransactionType } from '@/types';

const getTransactionTypeColor = (type: TransactionType): string => {
  switch (type) {
    case 'purchase':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'generation':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'refund':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'bonus':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'expiration':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchCreditHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const history = await getCreditHistory(user.id);
        setTransactions(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load credit history');
      } finally {
        setLoading(false);
      }
    };

    fetchCreditHistory();
  }, [user?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
          <CardDescription>Your credit transactions and balance changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded">
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
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
          <CardDescription className="text-destructive">
            Error loading credit history: {error}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Credit History</CardTitle>
          <CardDescription>No credit transactions yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your credit purchases, generations, and other transactions will appear here.
          </p>
          <a href="/pricing" className="text-sm text-blue-600 hover:underline">
            Buy credits →
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit History</CardTitle>
        <CardDescription>Your credit transactions and balance changes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-4 border rounded">
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
      </CardContent>
    </Card>
  );
}