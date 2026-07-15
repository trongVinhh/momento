-- Migration: Add latitude and longitude columns to destinations table

ALTER TABLE public.destinations
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Set default coordinates (Hanoi: 21.028511, 105.804817) for existing destinations
UPDATE public.destinations
SET 
  latitude = COALESCE(latitude, 21.028511),
  longitude = COALESCE(longitude, 105.804817);
