-- Migration: Alter moments.destination_id to UUID and add Foreign Key constraint

-- 1. Truncate existing moments to avoid type conversion failures (since old moments had text values like 'tokyo', 'seoul')
TRUNCATE TABLE public.moments;

-- 2. Alter destination_id column type to UUID
ALTER TABLE public.moments 
  ALTER COLUMN destination_id TYPE UUID USING destination_id::uuid;

-- 3. Add foreign key constraint to link moments and destinations
ALTER TABLE public.moments
  ADD CONSTRAINT fk_moments_destination
  FOREIGN KEY (destination_id) 
  REFERENCES public.destinations(id) 
  ON DELETE CASCADE;
