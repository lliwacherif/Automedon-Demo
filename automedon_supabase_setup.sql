-- ================================================================
-- AUTOMEDON - Complete Supabase Setup Script
-- ================================================================
-- Run this script in your Supabase SQL Editor at:
-- https://yccbjuwqykpgjzeohsbw.supabase.co
-- ================================================================

-- ================================================================
-- 1. ADMIN SETTINGS TABLE
-- ================================================================
CREATE TABLE public.admin_settings (
  id integer NOT NULL DEFAULT 1 CHECK (id = 1),
  password_hash text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT admin_settings_pkey PRIMARY KEY (id)
);

-- ================================================================
-- 2. CARS TABLE
-- ================================================================
CREATE TABLE public.cars (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  make text,
  model text NOT NULL,
  brand text,
  year integer,
  license_plate text NOT NULL UNIQUE,
  color text,
  price_per_day numeric,
  mileage integer NOT NULL DEFAULT 0,
  transmission text,
  seats integer,
  fuel_type text,
  description text,
  status text DEFAULT 'disponible'::text CHECK (status = ANY (ARRAY['disponible'::text, 'loue'::text, 'maintenance'::text])),
  image_url text,
  auto_manage_status boolean DEFAULT true,
  CONSTRAINT cars_pkey PRIMARY KEY (id)
);

-- ================================================================
-- 3. RESERVATIONS TABLE
-- ================================================================
CREATE TABLE public.reservations (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  reservation_number character varying NOT NULL UNIQUE,
  user_id uuid,
  client_name character varying NOT NULL,
  client_cin character varying NOT NULL,
  client_phone character varying NOT NULL,
  client_email character varying,
  car_id bigint NOT NULL,
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone NOT NULL,
  pickup_time time without time zone,
  return_time time without time zone,
  pickup_location character varying,
  return_location character varying,
  duration_days integer NOT NULL,
  price_per_day numeric NOT NULL,
  total_price numeric NOT NULL,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'confirmed'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying]::text[])),
  notes text,
  cancellation_reason text,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  advance_payment numeric NOT NULL DEFAULT 0,
  CONSTRAINT reservations_pkey PRIMARY KEY (id),
  CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT reservations_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);

-- ================================================================
-- 4. MAINTENANCE RECORDS TABLE
-- ================================================================
CREATE TABLE public.maintenance_records (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  car_id bigint NOT NULL,
  maintenance_type text NOT NULL CHECK (maintenance_type = ANY (ARRAY['OIL_CHANGE'::text, 'BRAKE_SERVICE'::text, 'REPAIR'::text, 'ROUTINE_CHECK'::text, 'LAVAGE'::text, 'ASSURANCE'::text, 'VIGNETTE'::text, 'LEASING'::text])),
  cost numeric NOT NULL DEFAULT 0,
  odometer integer NOT NULL,
  next_due_mileage integer,
  maintenance_date date NOT NULL,
  notes text,
  provider text,
  CONSTRAINT maintenance_records_pkey PRIMARY KEY (id),
  CONSTRAINT maintenance_records_car_id_fkey FOREIGN KEY (car_id) REFERENCES public.cars(id)
);

-- ================================================================
-- 5. RESERVATION DOCUMENTS TABLE
-- ================================================================
CREATE TABLE public.reservation_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reservation_id bigint NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reservation_documents_pkey PRIMARY KEY (id),
  CONSTRAINT reservation_documents_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.reservations(id)
);

-- ================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservation_documents ENABLE ROW LEVEL SECURITY;

-- Admin Settings Policies
CREATE POLICY "Allow public read of admin settings" ON public.admin_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow public update of admin settings" ON public.admin_settings
  FOR UPDATE USING (true);

CREATE POLICY "Allow public insert of admin settings" ON public.admin_settings
  FOR INSERT WITH CHECK (true);

-- Cars Policies (Public read, authenticated write)
CREATE POLICY "Allow public read of cars" ON public.cars
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert of cars" ON public.cars
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow authenticated update of cars" ON public.cars
  FOR UPDATE USING (true);

CREATE POLICY "Allow authenticated delete of cars" ON public.cars
  FOR DELETE USING (true);

-- Reservations Policies
CREATE POLICY "Allow public read of reservations" ON public.reservations
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert of reservations" ON public.reservations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update of reservations" ON public.reservations
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete of reservations" ON public.reservations
  FOR DELETE USING (true);

-- Maintenance Records Policies
CREATE POLICY "Allow public read of maintenance_records" ON public.maintenance_records
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert of maintenance_records" ON public.maintenance_records
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update of maintenance_records" ON public.maintenance_records
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete of maintenance_records" ON public.maintenance_records
  FOR DELETE USING (true);

-- Reservation Documents Policies
CREATE POLICY "Allow public read of reservation_documents" ON public.reservation_documents
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert of reservation_documents" ON public.reservation_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete of reservation_documents" ON public.reservation_documents
  FOR DELETE USING (true);

-- ================================================================
-- 7. STORAGE BUCKETS
-- ================================================================

-- Create storage bucket for car images
INSERT INTO storage.buckets (id, name, public) VALUES ('car-images', 'car-images', true);

-- Create storage bucket for contracts/documents
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', true);

-- Storage Policies for car-images bucket
CREATE POLICY "Allow public read of car images" ON storage.objects
  FOR SELECT USING (bucket_id = 'car-images');

CREATE POLICY "Allow public upload of car images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'car-images');

CREATE POLICY "Allow public update of car images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'car-images');

CREATE POLICY "Allow public delete of car images" ON storage.objects
  FOR DELETE USING (bucket_id = 'car-images');

-- Storage Policies for contracts bucket
CREATE POLICY "Allow public read of contracts" ON storage.objects
  FOR SELECT USING (bucket_id = 'contracts');

CREATE POLICY "Allow public upload of contracts" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'contracts');

CREATE POLICY "Allow public update of contracts" ON storage.objects
  FOR UPDATE USING (bucket_id = 'contracts');

CREATE POLICY "Allow public delete of contracts" ON storage.objects
  FOR DELETE USING (bucket_id = 'contracts');

-- ================================================================
-- 8. DEFAULT ADMIN PASSWORD (password: admin123)
-- ================================================================
INSERT INTO public.admin_settings (id, password_hash)
VALUES (1, '$2a$10$rQEY1f0kOl7qKL0VDvGY/ePr1WqX8.HV9n0bGqvKaOo0HrJOvxCPa')
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- ================================================================
-- SETUP COMPLETE!
-- ================================================================
-- Default admin password: admin123
-- You can change this from the Settings page after logging in
-- ================================================================

