-- Fix RLS policies for cars table to allow updates

-- First, check what policies exist (you can run this to see current policies)
-- SELECT * FROM pg_policies WHERE tablename = 'cars';

-- Drop existing policies if they're too restrictive
DROP POLICY IF EXISTS "Enable read access for all users" ON public.cars;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.cars;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.cars;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.cars;

-- Create new policies that allow public/authenticated access
CREATE POLICY "Allow public read access"
ON public.cars FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public insert access"
ON public.cars FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Allow public update access"
ON public.cars FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public delete access"
ON public.cars FOR DELETE
TO public
USING (true);

-- Alternative: If you want to restrict to authenticated users only, use this instead:
-- (Comment out the public policies above and uncomment these)
/*
CREATE POLICY "Allow authenticated read access"
ON public.cars FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated insert access"
ON public.cars FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update access"
ON public.cars FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete access"
ON public.cars FOR DELETE
TO authenticated
USING (true);
*/
