'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CreditCard } from 'lucide-react';
import { CREDIT_PACKS } from '@/lib/stripe/products';

interface InsufficientCreditsModalProps {
  currentBalance: number;
  requiredCredits: number;
  onClose: () => void;
}

export function InsufficientCreditsModal({
  currentBalance,
  requiredCredits,
  onClose,
}: InsufficientCreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const deficit = requiredCredits - currentBalance;

  // Find the smallest pack that covers the deficit
  const recommendedPack = Object.entries(CREDIT_PACKS)
    .sort(([, a], [, b]) => a.credits - b.credits)
    .find(([, pack]) => pack.credits >= deficit);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Insufficient Credits
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            You need {deficit} more credits to generate this image.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-4 bg-muted rounded">
            <p className="text-sm text-muted-foreground">Current balance</p>
            <p className="text-2xl font-bold">{currentBalance} credits</p>
          </div>

          {recommendedPack && (
            <div>
              <p className="text-sm font-medium mb-2">Recommended purchase:</p>
              <Card className="border-2 border-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {recommendedPack[1].credits} Credits
                    </span>
                    <Badge variant="secondary">Best fit</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      ${(recommendedPack[1].priceCents / 100).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handlePurchase(recommendedPack[0])}
                      disabled={loading === recommendedPack[0]}
                    >
                      {loading === recommendedPack[0] ? '...' : 'Buy'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" asChild>
              <a href="/pricing">View All Options</a>
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
