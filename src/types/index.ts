// src/types/index.ts
export * from './database';
export type { Json } from './database';
export * from './database.helpers';

export type CashRefundStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface CashRefundRequest {
  id: string;
  user_id: string;
  stripe_purchase_id: string;
  credits_refunded: number;
  refund_amount_cents: number;
  refund_percentage: 90 | 100;
  stripe_refund_id?: string;
  status: CashRefundStatus;
  requested_at: string;
  stripe_processed_at?: string;
  completed_at?: string;
  stripe_error?: string;
}

export interface EligiblePurchase {
  purchaseId: string;
  date: string;
  amountCents: number;
  creditsGranted: number;
  creditsUnused: number;
  refundAmount100Cents: number;
  refundAmount90Cents: number;
}