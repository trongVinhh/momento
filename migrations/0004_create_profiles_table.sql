-- Migration: Create Profiles Table & Setup Auto-sync Triggers

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80' NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Setup Security Policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read profiles' AND tablename = 'profiles') THEN
    DROP POLICY "Allow public read profiles" ON public.profiles;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow users to update their own profile' AND tablename = 'profiles') THEN
    DROP POLICY "Allow users to update their own profile" ON public.profiles;
  END IF;
END
$$;

CREATE POLICY "Allow public read profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow users to update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Create trigger function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(split_part(NEW.email, '@', 1), 'Traveler'),
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Backfill profiles for existing users who registered before this migration
INSERT INTO public.profiles (id, email, display_name, avatar_url)
SELECT 
  id, 
  email, 
  COALESCE(split_part(email, '@', 1), 'Traveler'),
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&q=80'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
