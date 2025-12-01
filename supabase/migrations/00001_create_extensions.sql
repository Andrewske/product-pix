-- supabase/migrations/00001_create_extensions.sql
-- Enable required extensions

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm" SCHEMA public;        -- Text search