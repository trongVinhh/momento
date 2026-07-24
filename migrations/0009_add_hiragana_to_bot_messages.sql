-- 9. Add hiragana column to bot_messages table
ALTER TABLE public.bot_messages ADD COLUMN IF NOT EXISTS hiragana TEXT;
