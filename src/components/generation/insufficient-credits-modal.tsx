'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CreditCard } from 'lucide-react';
import { getPricingForModal, createPackCheckout } from '@/lib/stripe/checkout-actions';
import type { PricingPack } from '@/lib/pricing/utils';
import type { CreditPackId } from '@/lib/stripe/products';

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
  const [packs, setPacks] = useState<Record<string, PricingPack> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deficit = requiredCredits - currentBalance;

  const formatPrice = (priceCents: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(priceCents / 100);
  };

  useEffect(() => {
    getPricingForModal()
      .then(setPacks)
      .catch((err) => setError(err.message));
  }, []);

  // Find the smallest pack that covers the deficit
  const recommendedPack = packs
    ? Object.entries(packs)
        .sort(([, a], [, b]) => a.credits - b.credits)
        .find(([, pack]) => pack.credits >= deficit)
    : null;

  const handlePurchase = async (packId: string) => {
    setLoading(packId);
    try {
      const { url } = await createPackCheckout(packId as CreditPackId);
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
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-sm text-muted-foreground">
                         {formatPrice(recommendedPack[1].priceCents, recommendedPack[1].currency)}
                       </span>
                     </div>
                     <div className="flex items-center justify-between">
                       <Button
                         size="sm"
                         onClick={() => handlePurchase(recommendedPack[0])}
                         disabled={loading === recommendedPack[0] || !packs}
                       >
                         {loading === recommendedPack[0] ? '...' : 'Buy'}
                       </Button>
                     </div>
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-sm text-muted-foreground">
                         {formatPrice(recommendedPack[1].priceCents, recommendedPack[1].currency)}
                       </span>
                     </div>
                    <div className="flex items-center justify-between">
                      <Button
                        size="sm"
                        onClick={() => handlePurchase(recommendedPack[0])}
                        disabled={loading === recommendedPack[0] || !packs}
                      >
                        {loading === recommendedPack[0] ? '...' : 'Buy'}
                      </Button>
                    </div>
                 </CardContent>
              </Card>
            </div>
          )}

          {error && (
            <div className="text-center p-4 bg-destructive/10 rounded border border-destructive/20">
              <p className="text-sm text-destructive">Failed to load pricing: {error}</p>
            </div>
          )}

          {!packs && !error && (
            <div className="text-center p-4 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Loading pricing...</p>
            </div>
          )}

          <div className="flex gap-2">
            <ButtonLink href="/pricing" variant="outline" className="flex-1">
              View All Options
            </ButtonLink>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
