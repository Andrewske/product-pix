'use client';

import { useState } from 'react';
import { CREDIT_PACKS } from '@/lib/stripe/products';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function CreditPacks() {
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (packId: string) => {
    setLoading(packId);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'pack', packId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 text-center">Credit Packs</h2>
      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {Object.entries(CREDIT_PACKS).map(([packId, pack]) => (
          <Card key={packId} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {pack.credits} Credits
                {packId === 'pack_200' && <Badge variant="secondary">Most Popular</Badge>}
              </CardTitle>
              <CardDescription>
                ${(pack.priceCents / 100).toFixed(2)} one-time purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2">
                ${(pack.priceCents / 100).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                ${(pack.priceCents / pack.credits / 100).toFixed(2)} per credit
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => handlePurchase(packId)}
                disabled={loading === packId}
              >
                {loading === packId ? 'Creating...' : 'Buy Now'}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
