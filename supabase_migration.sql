-- GS Cars Fleet Management Schema Migration
-- This migration adds the 'status' column to replace the 'available' boolean

-- Step 1: Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cars' AND column_name = 'status'
    ) THEN
        ALTER TABLE cars ADD COLUMN status TEXT DEFAULT 'disponible';
    END IF;
END $$;

-- Step 2: Migrate existing data from 'available' to 'status' (if available column exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cars' AND column_name = 'available'
    ) THEN
        UPDATE cars SET status = CASE 
            WHEN available = true THEN 'disponible'
            ELSE 'maintenance'
        END;
        -- Drop the old available column
        ALTER TABLE cars DROP COLUMN available;
    END IF;
END $$;

-- Step 3: Add status constraint
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_status_check;
ALTER TABLE cars ADD CONSTRAINT cars_status_check 
CHECK (status IN ('disponible', 'loue', 'maintenance'));

-- Step 4: Ensure brand column has the right constraint
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_brand_check;
ALTER TABLE cars ADD CONSTRAINT cars_brand_check 
CHECK (brand IN ('Renault', 'Dacia', 'Skoda', 'Hyundai'));

-- Step 5: Ensure plate_number is unique
ALTER TABLE cars DROP CONSTRAINT IF EXISTS cars_plate_number_unique;
ALTER TABLE cars ADD CONSTRAINT cars_plate_number_unique UNIQUE (plate_number);

-- Step 6: Set default for status
ALTER TABLE cars ALTER COLUMN status SET DEFAULT 'disponible';

-- Step 7: Add image_url column for optional car images
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cars' AND column_name = 'image_url'
    ) THEN
        ALTER TABLE cars ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Final schema:
-- id (integer, primary key)
-- created_at (timestamp)
-- brand (text, constrained to: Renault, Dacia, Skoda, Hyundai)
-- model (text)
-- plate_number (text, unique)
-- status (text, constrained to: disponible, loue, maintenance, default: disponible)
-- image_url (text, nullable - optional car image)
