// src/components/refunds/cash-refund-modal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, DollarSign, Heart } from 'lucide-react';
import { EligiblePurchase } from '@/types';

interface CashRefundModalProps {
  purchase: EligiblePurchase;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CashRefundModal({ purchase, isOpen, onClose, onSuccess }: CashRefundModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRefund = async (percentage: 90 | 100) => {
    setLoading(true);
    try {
      const response = await fetch('/api/refunds/cash', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          purchaseId: purchase.purchaseId,
          percentage,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setSuccess(false);
        }, 3000);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error requesting refund:', error);
      alert('Failed to request refund. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Refund Initiated!</h3>
            <p className="text-center text-muted-foreground">
              Your refund will be processed in 5-10 business days.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose Your Refund</DialogTitle>
          <DialogDescription>
            You have {purchase.creditsUnused} unused credits available for refund
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* 100% Refund Option */}
          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold mb-1">
                {formatAmount(purchase.refundAmount100Cents)}
              </div>
              <div className="text-sm font-medium mb-2">100% back</div>
              <p className="text-xs text-muted-foreground mb-4">
                Get your full refund, no questions asked
              </p>
              <Button
                onClick={() => handleRefund(100)}
                disabled={loading}
                className="w-full"
                variant="default"
              >
                {loading ? 'Processing...' : 'Choose 100%'}
              </Button>
            </div>
          </Card>

          {/* 90% Refund Option */}
          <Card className="p-4 cursor-pointer hover:shadow-md transition-shadow">
            <div className="text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-teal-600" />
              <div className="text-2xl font-bold mb-1">
                {formatAmount(purchase.refundAmount90Cents)}
              </div>
              <div className="text-sm font-medium mb-2">90% back</div>
              <p className="text-xs text-muted-foreground mb-4">
                Help cover costs & support ProductPix
              </p>
              <Button
                onClick={() => handleRefund(90)}
                disabled={loading}
                className="w-full"
                variant="outline"
              >
                {loading ? 'Processing...' : 'Choose 90%'}
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}