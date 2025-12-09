'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchUserPurchases, type PurchaseData } from '@/lib/db/billing';

export function PurchaseHistory() {
  const [purchases, setPurchases] = useState<PurchaseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserPurchases()
      .then(setPurchases)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
          <CardDescription className="text-destructive">
            Error loading purchases: {error}
          </CardDescription>
        </CardHeader>
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
