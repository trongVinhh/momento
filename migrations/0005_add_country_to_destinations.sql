-- Migration: Add country column to destinations table

ALTER TABLE public.destinations 
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Việt Nam' NOT NULL;
