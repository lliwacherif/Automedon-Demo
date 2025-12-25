-- Updated Auto Status Migration
-- This ensures cars automatically sync with reservation status

-- The function already checks for these statuses: 'pending', 'confirmed', 'active'
-- When a reservation is 'completed' or 'cancelled', the car becomes 'disponible'
-- When a reservation is 'active' and within date range, the car becomes 'loue'

-- Status Flow:
-- Reservation 'confirmed' -> Car stays 'disponible' (until start_date)
-- Reservation 'active' (within date range) -> Car becomes 'loue'  
-- Reservation 'completed' -> Car becomes 'disponible'
-- Reservation 'cancelled' -> Car becomes 'disponible'

-- To apply: Run the supabase_auto_status_migration.sql file in your Supabase SQL Editor
-- This will set up the triggers that automatically manage car status based on reservations

-- Note: The migration file already exists and is correctly configured.
-- Make sure it has been run in your Supabase database.
