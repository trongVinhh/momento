-- Migration: Add level to bot_sessions table
ALTER TABLE public.bot_sessions ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'Intermediate' NOT NULL;
