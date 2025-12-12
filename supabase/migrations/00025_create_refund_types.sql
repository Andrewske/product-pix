-- Create enum types for refund system

CREATE TYPE refund_reason AS ENUM (
  'poor_quality',
  'wrong_style',
  'technical_issue',
  'other'
);

CREATE TYPE refund_status AS ENUM (
  'pending_auto',
  'pending_admin',
  'approved',
  'rejected'
);

CREATE TYPE cash_refund_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);