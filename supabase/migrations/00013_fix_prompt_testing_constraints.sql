-- Migration: Fix constraints on prompt testing tables
-- Adds NOT NULL constraints and ON DELETE CASCADE

-- Fix NOT NULL on prompt_tests.created_at
ALTER TABLE public.prompt_tests
  ALTER COLUMN created_at SET NOT NULL;

-- Fix NOT NULL on prompt_evaluations.created_at
ALTER TABLE public.prompt_evaluations
  ALTER COLUMN created_at SET NOT NULL;

-- Add ON DELETE CASCADE to template_id foreign key
-- First drop the existing constraint, then re-add with CASCADE
ALTER TABLE public.prompt_tests
  DROP CONSTRAINT IF EXISTS prompt_tests_template_id_fkey;

ALTER TABLE public.prompt_tests
  ADD CONSTRAINT prompt_tests_template_id_fkey
  FOREIGN KEY (template_id)
  REFERENCES public.prompt_templates(id)
  ON DELETE CASCADE;
