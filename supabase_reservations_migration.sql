-- =============================================
-- GS Cars - Fix Reservations Table Migration
-- =============================================
-- This migration drops the old reservations table and creates a new one with the correct schema

-- Step 1: Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON reservations;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON reservations;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON reservations;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON reservations;

-- Step 2: Drop existing table
DROP TABLE IF EXISTS reservations CASCADE;

-- Step 3: Create reservations table with correct schema
CREATE TABLE reservations (
    id SERIAL PRIMARY KEY,
    reservation_number VARCHAR(20) UNIQUE NOT NULL,
    
    -- Client Information
    client_name VARCHAR(255) NOT NULL,
    client_cin VARCHAR(50) NOT NULL,
    client_phone VARCHAR(50) NOT NULL,
    client_email VARCHAR(255),
    
    -- Reservation Details
    car_id INTEGER NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_days INTEGER NOT NULL,
    
    -- Pricing
    price_per_day DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    
    -- Pickup/Return Locations
    pickup_location VARCHAR(255),
    return_location VARCHAR(255),
    
    -- Notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_car FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT
);

-- Step 4: Create indexes
CREATE INDEX idx_reservation_number ON reservations(reservation_number);
CREATE INDEX idx_reservations_car_id ON reservations(car_id);
CREATE INDEX idx_reservations_dates ON reservations(start_date, end_date);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Step 5: Create function to generate unique reservation numbers
CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_check INTEGER;
BEGIN
    LOOP
        -- Generate format: RES-XXXXXXX (7 random alphanumeric characters)
        new_number := 'RES-' || UPPER(LEFT(MD5(RANDOM()::TEXT), 7));
        
        -- Check if this number already exists
        SELECT COUNT(*) INTO exists_check
        FROM reservations
        WHERE reservation_number = new_number;
        
        EXIT WHEN exists_check = 0;
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create trigger to auto-generate reservation number
CREATE OR REPLACE FUNCTION set_reservation_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reservation_number IS NULL OR NEW.reservation_number = '' THEN
        NEW.reservation_number := generate_reservation_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_reservation_number ON reservations;
CREATE TRIGGER trigger_set_reservation_number
    BEFORE INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION set_reservation_number();

-- Step 7: Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_reservation_timestamp ON reservations;
CREATE TRIGGER trigger_update_reservation_timestamp
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Enable Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Step 9: Create policies for authenticated users
CREATE POLICY "Enable read access for all authenticated users" ON reservations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users" ON reservations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Enable update for authenticated users" ON reservations
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON reservations
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- DONE! Table created with correct schema.
-- =============================================
