-- Automatic Car Status Management
-- This migration adds automatic status updates based on active reservations

-- Step 1: Add auto_manage_status column to cars table
ALTER TABLE public.cars ADD COLUMN IF NOT EXISTS auto_manage_status BOOLEAN DEFAULT true;

-- Step 2: Create function to check if a car has active reservations
CREATE OR REPLACE FUNCTION check_car_has_active_reservation(car_id_param BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    has_active BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM public.reservations 
        WHERE car_id = car_id_param 
        AND status IN ('pending', 'confirmed', 'active')
        AND start_date <= CURRENT_DATE 
        AND end_date >= CURRENT_DATE
    ) INTO has_active;
    
    RETURN has_active;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create function to auto-update car status
CREATE OR REPLACE FUNCTION auto_update_car_status()
RETURNS TRIGGER AS $$
DECLARE
    car_rec RECORD;
    new_status TEXT;
BEGIN
    -- Get all cars that have auto_manage_status enabled
    FOR car_rec IN 
        SELECT id, auto_manage_status 
        FROM public.cars 
        WHERE auto_manage_status = true
    LOOP
        -- Check if car has active reservations
        IF check_car_has_active_reservation(car_rec.id) THEN
            new_status := 'loue';
        ELSE
            new_status := 'disponible';
        END IF;
        
        -- Update car status if it changed
        UPDATE public.cars 
        SET status = new_status 
        WHERE id = car_rec.id 
        AND status != new_status;
    END LOOP;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create trigger on reservations table
DROP TRIGGER IF EXISTS trigger_auto_update_car_status_on_reservation ON public.reservations;
CREATE TRIGGER trigger_auto_update_car_status_on_reservation
    AFTER INSERT OR UPDATE OR DELETE ON public.reservations
    FOR EACH STATEMENT
    EXECUTE FUNCTION auto_update_car_status();

-- Step 5: Create function to update specific car status after reservation change
CREATE OR REPLACE FUNCTION update_single_car_status()
RETURNS TRIGGER AS $$
DECLARE
    target_car_id BIGINT;
    car_auto_manage BOOLEAN;
    new_status TEXT;
BEGIN
    -- Determine which car to update
    IF TG_OP = 'DELETE' THEN
        target_car_id := OLD.car_id;
    ELSE
        target_car_id := NEW.car_id;
    END IF;
    
    -- Check if car has auto_manage_status enabled
    SELECT auto_manage_status INTO car_auto_manage 
    FROM public.cars 
    WHERE id = target_car_id;
    
    -- Only update if auto-manage is enabled
    IF car_auto_manage THEN
        -- Check if car has active reservations
        IF check_car_has_active_reservation(target_car_id) THEN
            new_status := 'loue';
        ELSE
            new_status := 'disponible';
        END IF;
        
        -- Update car status
        UPDATE public.cars 
        SET status = new_status 
        WHERE id = target_car_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create more efficient row-level trigger
DROP TRIGGER IF EXISTS trigger_update_car_status_on_reservation_change ON public.reservations;
CREATE TRIGGER trigger_update_car_status_on_reservation_change
    AFTER INSERT OR UPDATE OR DELETE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_single_car_status();

-- Step 7: Manually run initial status update for all cars
-- This ensures all existing cars have correct status
DO $$
DECLARE
    car_rec RECORD;
    new_status TEXT;
BEGIN
    FOR car_rec IN SELECT id FROM public.cars WHERE auto_manage_status = true
    LOOP
        IF check_car_has_active_reservation(car_rec.id) THEN
            new_status := 'loue';
        ELSE
            new_status := 'disponible';
        END IF;
        
        UPDATE public.cars 
        SET status = new_status 
        WHERE id = car_rec.id;
    END LOOP;
END $$;

-- Step 8: Create function that admin can call to disable auto-management for a car
COMMENT ON COLUMN public.cars.auto_manage_status IS 'When true, car status is automatically updated based on reservations. When false, admin has manual control.';
