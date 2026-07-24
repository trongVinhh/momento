-- Migration: Add audio_path to bot_messages table
ALTER TABLE public.bot_messages ADD COLUMN IF NOT EXISTS audio_path TEXT;
