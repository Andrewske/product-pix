-- Add soft delete and audit fields to users table
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN original_email TEXT;