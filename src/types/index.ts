// src/types/index.ts
export * from './database';
export type { Json } from './database';
export * from './database.helpers';
export * from './feedback';
export * from './messages';

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

export interface ImageRefundRequest {
  id: string;
  user_id: string;
  image_id: string;
  job_id: string;
  status: 'pending_auto' | 'pending_admin' | 'approved' | 'rejected';
  reason: 'poor_quality' | 'wrong_style' | 'technical_issue' | 'other';
  feedback: string | null;
  credits_refunded: number;
  reviewed_by?: string | null;
  admin_notes?: string | null;
  requested_at: string;
  processed_at?: string | null;
}

export interface PendingRefundWithDetails extends ImageRefundRequest {
  users: {
    email: string;
    display_name?: string;
  };
  generated_images: {
    public_url: string;
    title?: string;
  };
}export * from './analysis';
