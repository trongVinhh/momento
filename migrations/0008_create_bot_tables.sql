-- Migration: Create Bot Sessions & Messages Tables for Kaiwa Learning

-- 1. Create bot_sessions table
CREATE TABLE IF NOT EXISTS public.bot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  language VARCHAR(50) DEFAULT 'Japanese' NOT NULL,
  scenario_title VARCHAR(255) DEFAULT 'Tự do' NOT NULL,
  scenario_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for bot_sessions
ALTER TABLE public.bot_sessions ENABLE ROW LEVEL SECURITY;

-- Setup Security Policies for bot_sessions
CREATE POLICY "Allow users to view their own bot sessions"
  ON public.bot_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert their own bot sessions"
  ON public.bot_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own bot sessions"
  ON public.bot_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own bot sessions"
  ON public.bot_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Create bot_messages table
CREATE TABLE IF NOT EXISTS public.bot_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.bot_sessions(id) ON DELETE CASCADE NOT NULL,
  sender VARCHAR(10) CHECK (sender IN ('user', 'bot')) NOT NULL,
  content TEXT NOT NULL,
  translation TEXT,
  suggestions JSONB, -- List of suggested reply strings for user next turns
  grammar_correction JSONB, -- { corrected: "...", explanation: "..." }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for bot_messages
ALTER TABLE public.bot_messages ENABLE ROW LEVEL SECURITY;

-- Setup Security Policies for bot_messages
CREATE POLICY "Allow users to view messages in their own sessions"
  ON public.bot_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bot_sessions
      WHERE public.bot_sessions.id = public.bot_messages.session_id
      AND public.bot_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to insert messages in their own sessions"
  ON public.bot_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bot_sessions
      WHERE public.bot_sessions.id = session_id
      AND public.bot_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to delete messages in their own sessions"
  ON public.bot_messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bot_sessions
      WHERE public.bot_sessions.id = public.bot_messages.session_id
      AND public.bot_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to update messages in their own sessions"
  ON public.bot_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bot_sessions
      WHERE public.bot_sessions.id = public.bot_messages.session_id
      AND public.bot_sessions.user_id = auth.uid()
    )
  );
