-- Migration: Add explicit foreign key constraints to public.profiles

-- 1. Add foreign key for moments.user_id -> profiles.id
ALTER TABLE public.moments
  DROP CONSTRAINT IF EXISTS fk_moments_profiles;

ALTER TABLE public.moments
  ADD CONSTRAINT fk_moments_profiles
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;

-- 2. Add foreign key for destinations.user_id -> profiles.id
ALTER TABLE public.destinations
  DROP CONSTRAINT IF EXISTS fk_destinations_profiles;

ALTER TABLE public.destinations
  ADD CONSTRAINT fk_destinations_profiles
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE CASCADE;
