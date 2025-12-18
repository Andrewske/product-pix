'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonLink } from '@/components/ui/button-link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { getPricingForModal, createPackCheckout } from '@/lib/stripe/checkout-actions';
import type { PricingPack } from '@/lib/pricing/utils';
import type { CreditPackId } from '@/lib/stripe/products';
import { CostBreakdown } from '@/components/pricing';
import type { GenerationCostBreakdown, GenerationMode } from '@/lib/pricing/types';
import type { Resolution } from '@/lib/pricing/credits';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  currentBalance: number;
  costBreakdown: GenerationCostBreakdown;
  resolution: Resolution;
  mode: GenerationMode;
  addons?: Array<string>;
  onClose: () => void;
}

export function InsufficientCreditsModal({
  isOpen,
  currentBalance,
  costBreakdown,
  resolution,
  mode,
  addons,
  onClose,
}: InsufficientCreditsModalProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [packs, setPacks] = useState<Record<string, PricingPack> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deficit = costBreakdown.total - currentBalance;

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Insufficient Credits
          </DialogTitle>
          <DialogDescription>
            This generation requires the following credits:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <CostBreakdown
            resolution={resolution}
            mode={mode}
            addons={addons}
            variant="default"
          />

          <div className="space-y-2">
            <div className="flex justify-between items-center p-3 bg-muted rounded">
              <span className="text-sm text-muted-foreground">Your balance:</span>
              <span className="font-mono font-medium">{currentBalance} credits</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-destructive/10 border border-destructive/20 rounded">
              <span className="text-sm text-destructive font-medium">Shortfall:</span>
              <span className="font-mono font-semibold text-destructive">{deficit} credits</span>
            </div>
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
              <Spinner size="sm" className="mb-2" />
              <p className="text-sm text-muted-foreground">Loading pricing...</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <ButtonLink href="/pricing" variant="outline" className="flex-1">
            View All Options
          </ButtonLink>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
