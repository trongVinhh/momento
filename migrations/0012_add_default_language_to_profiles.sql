-- Migration: Add default_language to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_language VARCHAR(50) DEFAULT 'Japanese' NOT NULL;
