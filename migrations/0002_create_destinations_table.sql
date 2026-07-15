-- Migration: Create Destinations Table & Setup RLS Policies

-- Create destinations table
CREATE TABLE IF NOT EXISTS public.destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;

-- Setup Security Policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read destinations' AND tablename = 'destinations') THEN
    DROP POLICY "Allow public read destinations" ON public.destinations;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated insert destinations' AND tablename = 'destinations') THEN
    DROP POLICY "Allow authenticated insert destinations" ON public.destinations;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to delete their own destinations' AND tablename = 'destinations') THEN
    DROP POLICY "Allow users to delete their own destinations" ON public.destinations;
  END IF;
END
$$;

-- Re-create Policies
CREATE POLICY "Allow public read destinations"
  ON public.destinations FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert destinations"
  ON public.destinations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own destinations"
  ON public.destinations FOR DELETE
  USING (auth.uid() = user_id);
