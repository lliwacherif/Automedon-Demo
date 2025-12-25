-- ============================================
-- OPTION 1: Create Bucket via SQL (might fail due to permissions)
-- ============================================
-- Uncomment and run this if you have superuser access:
-- insert into storage.buckets (id, name, public)
-- values ('contracts', 'contracts', true)
-- on conflict (id) do nothing;


-- ============================================
-- OPTION 2: Manual Bucket Creation (RECOMMENDED)
-- ============================================
-- If the SQL INSERT above fails, please create the bucket manually:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Storage section
-- 3. Click "New Bucket"
-- 4. Name: contracts
-- 5. Public bucket: YES (check the box)
-- 6. Click Create


-- ============================================
-- After creating the bucket (either way above), run these policies:
-- ============================================

-- First, remove any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated select" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Create new policies for the contracts bucket
CREATE POLICY "Allow public uploads to contracts"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "Allow public reads from contracts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contracts');

CREATE POLICY "Allow authenticated delete from contracts"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contracts');

CREATE POLICY "Allow authenticated update in contracts"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'contracts');
