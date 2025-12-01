-- supabase/migrations/00002_create_types.sql
-- Define enum types for type safety

CREATE TYPE job_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE transaction_type AS ENUM (
  'purchase',
  'generation',
  'refund',
  'bonus',
  'expiration'
);

CREATE TYPE user_tier AS ENUM (
  'free',
  'pro',
  'business'
);