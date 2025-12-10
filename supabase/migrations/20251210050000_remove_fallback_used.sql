-- Remove fallback_used column from generation_costs table
-- This column is no longer needed since we removed fallback pricing

ALTER TABLE generation_costs DROP COLUMN IF EXISTS fallback_used;