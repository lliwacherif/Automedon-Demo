-- =============================================
-- Fix: Auto-generate reservation_number
-- =============================================

-- 1. Create function to generate unique reservation numbers
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

-- 2. Create trigger function to set the number on insert
CREATE OR REPLACE FUNCTION set_reservation_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.reservation_number IS NULL OR NEW.reservation_number = '' THEN
        NEW.reservation_number := generate_reservation_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger to the table
DROP TRIGGER IF EXISTS trigger_set_reservation_number ON reservations;
CREATE TRIGGER trigger_set_reservation_number
    BEFORE INSERT ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION set_reservation_number();
