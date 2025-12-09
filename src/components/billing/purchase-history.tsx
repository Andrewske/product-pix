'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createAdminClient } from '@/lib/supabase/admin';

interface PurchaseData {
  id: string;
  amount_cents: number;
  credits_granted: number;
  purchase_type: string;
  created_at: string;
}

export function PurchaseHistory() {
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from('stripe_purchases')
          .select('id, amount_cents, credits_granted, purchase_type, created_at')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .order('created_at', { ascending: false });

        if (!error && data) {
          setPurchases(data);
        }
      } catch (error) {
        console.error('Failed to fetch purchases:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (purchases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription>No purchases yet</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Your credit purchases and subscription renewals will appear here.
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
        <CardTitle>Purchase History</CardTitle>
        <CardDescription>Your credit purchases and subscription activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {purchase.purchase_type.replace('_', ' ')}
                  </Badge>
                  <span className="font-medium">
                    +{purchase.credits_granted} credits
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(purchase.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  ${(purchase.amount_cents / 100).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
