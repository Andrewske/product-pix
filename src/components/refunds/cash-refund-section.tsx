// src/components/refunds/cash-refund-section.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EligiblePurchase } from '@/types';
import { CashRefundModal } from './cash-refund-modal';
import { formatDistanceToNow } from 'date-fns';

export function CashRefundSection() {
  const [eligiblePurchases, setEligiblePurchases] = useState<EligiblePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<EligiblePurchase | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchEligibility();
  }, []);

  const fetchEligibility = async () => {
    try {
      const response = await fetch('/api/refunds/cash/eligibility');
      if (response.ok) {
        const data = await response.json();
        setEligiblePurchases(data.eligiblePurchases);
      }
    } catch (error) {
      console.error('Error fetching refund eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundClick = (purchase: EligiblePurchase) => {
    setSelectedPurchase(purchase);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedPurchase(null);
  };

  const handleRefundSuccess = () => {
    // Refresh eligibility list
    fetchEligibility();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Refunds</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Cash Refunds</CardTitle>
          <CardDescription>
            Request a refund for unused credits within 30 days of purchase
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eligiblePurchases.length === 0 ? (
            <p className="text-muted-foreground">
              No eligible purchases for cash refund. Refunds are available for unused credits within 30 days of purchase.
            </p>
          ) : (
            <div className="space-y-4">
              {eligiblePurchases.map((purchase) => (
                <div
                  key={purchase.purchaseId}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(purchase.date), { addSuffix: true })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {purchase.creditsUnused} of {purchase.creditsGranted} credits unused
                    </p>
                  </div>
                  <Button
                    onClick={() => handleRefundClick(purchase)}
                    variant="outline"
                  >
                    Request Refund
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPurchase && (
        <CashRefundModal
          purchase={selectedPurchase}
          isOpen={modalOpen}
          onClose={handleModalClose}
          onSuccess={handleRefundSuccess}
        />
      )}
    </>
  );
}