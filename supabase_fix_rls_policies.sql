-- Fix RLS policies for reservation_documents table
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.reservation_documents;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.reservation_documents;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.reservation_documents;

-- Option 1: Allow public access (simplest for testing)
CREATE POLICY "Allow public read access"
ON public.reservation_documents FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert access"
ON public.reservation_documents FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public delete access"
ON public.reservation_documents FOR DELETE
TO public
USING (true);

-- If you want to restrict to authenticated users only, use this instead:
-- (Comment out the public policies above and uncomment these)
/*
CREATE POLICY "Allow authenticated read access"
ON public.reservation_documents FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert access"
ON public.reservation_documents FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete access"
ON public.reservation_documents FOR DELETE
TO authenticated
USING (true);
*/
