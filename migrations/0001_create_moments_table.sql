-- Migration: Create Moments Table & Setup RLS Policies

-- Create moments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.moments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  destination_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  date TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Enable RLS
ALTER TABLE public.moments ENABLE ROW LEVEL SECURITY;

-- Setup Security Policies (Drop if exists first to avoid duplicate migration errors)
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read access' AND tablename = 'moments') THEN
    DROP POLICY "Allow public read access" ON public.moments;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow authenticated inserts' AND tablename = 'moments') THEN
    DROP POLICY "Allow authenticated inserts" ON public.moments;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to delete their own moments' AND tablename = 'moments') THEN
    DROP POLICY "Allow users to delete their own moments" ON public.moments;
  END IF;
END
$$;

-- Re-create Policies
CREATE POLICY "Allow public read access" 
  ON public.moments FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated inserts" 
  ON public.moments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own moments" 
  ON public.moments FOR DELETE 
  USING (auth.uid() = user_id);
