-- Remove duplicate businesses (keep only the oldest one per owner/name combination)
DELETE FROM public.businesses
WHERE id IN (
  SELECT id
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY owner_id, name ORDER BY created_at ASC) as rn
    FROM public.businesses
  ) t
  WHERE t.rn > 1
);

-- Now add the unique constraint to prevent future duplicates
ALTER TABLE public.businesses
ADD CONSTRAINT unique_business_name_per_owner UNIQUE (owner_id, name);