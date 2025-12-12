-- Add new transaction types for refund system

ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'image_refund';
ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'cash_refund_reversal';