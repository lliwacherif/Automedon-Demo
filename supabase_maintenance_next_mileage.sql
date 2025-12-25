-- Add next_due_mileage field to maintenance_records
-- This field tracks when the next oil change is due

ALTER TABLE public.maintenance_records 
ADD COLUMN IF NOT EXISTS next_due_mileage INTEGER;

COMMENT ON COLUMN public.maintenance_records.next_due_mileage IS 'Odometer reading at which the next maintenance (especially oil change) is required';
