-- Drop the existing check constraint (name inferred from schema provided)
ALTER TABLE public.maintenance_records
DROP CONSTRAINT IF EXISTS maintenance_records_maintenance_type_check;

-- Add the new check constraint with all allowed values INCLUDING the new ones
ALTER TABLE public.maintenance_records
ADD CONSTRAINT maintenance_records_maintenance_type_check
CHECK (maintenance_type = ANY (ARRAY[
    'OIL_CHANGE'::text,
    'BRAKE_SERVICE'::text,
    'REPAIR'::text,
    'ROUTINE_CHECK'::text,
    'LAVAGE'::text,
    'ASSURANCE'::text,
    'VIGNETTE'::text,
    'LEASING'::text
]));
