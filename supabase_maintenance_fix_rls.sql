-- ⚠️ RUN THIS IF YOU ALREADY RAN THE ORIGINAL MIGRATION
-- This script fixes the 401 Unauthorized error by updating the RLS policies

-- Drop the old restrictive policies
DROP POLICY IF EXISTS "Admins can view all maintenance records" ON public.maintenance_records;
DROP POLICY IF EXISTS "Admins can insert maintenance records" ON public.maintenance_records;
DROP POLICY IF EXISTS "Admins can update maintenance records" ON public.maintenance_records;
DROP POLICY IF EXISTS "Admins can delete maintenance records" ON public.maintenance_records;

-- Create new permissive policies (since admin auth is separate from Supabase)
CREATE POLICY "Allow all to view maintenance records"
    ON public.maintenance_records FOR SELECT
    USING (true);

CREATE POLICY "Allow all to insert maintenance records"
    ON public.maintenance_records FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all to update maintenance records"
    ON public.maintenance_records FOR UPDATE
    USING (true);

CREATE POLICY "Allow all to delete maintenance records"
    ON public.maintenance_records FOR DELETE
    USING (true);
