-- Admin Dashboard Database Schema
-- Run this in Supabase SQL Editor

-- Create bikes table for inventory management
CREATE TABLE IF NOT EXISTS public.bikes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
    price_per_day INTEGER NOT NULL, -- Store in VND cents for precision
    location VARCHAR(200),
    fuel_type VARCHAR(20) DEFAULT 'gasoline',
    transmission VARCHAR(20) DEFAULT 'manual',
    engine_capacity INTEGER DEFAULT 150, -- in cc
    features JSONB DEFAULT '[]'::jsonb,
    condition VARCHAR(20) DEFAULT 'excellent' CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
    images JSONB DEFAULT '[]'::jsonb,
    last_maintenance TIMESTAMP WITH TIME ZONE,
    next_maintenance TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table for rental management
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    bike_id UUID REFERENCES public.bikes(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    price_per_day INTEGER NOT NULL, -- Store in VND cents
    total_amount INTEGER NOT NULL, -- Store in VND cents
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    pickup_location VARCHAR(200),
    return_location VARCHAR(200),
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table for admin messaging
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'admin', 'broadcast')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to users table if needed
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'blocked'));

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bikes_status ON public.bikes(status);
CREATE INDEX IF NOT EXISTS idx_bikes_location ON public.bikes(location);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bike_id ON public.bookings(bike_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Enable RLS on new tables
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (permissive for admin functionality)
-- Bikes policies
DROP POLICY IF EXISTS "bikes_allow_all" ON public.bikes;
CREATE POLICY "bikes_allow_all" ON public.bikes
    FOR ALL USING (true);

-- Bookings policies  
DROP POLICY IF EXISTS "bookings_allow_all" ON public.bookings;
CREATE POLICY "bookings_allow_all" ON public.bookings
    FOR ALL USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "notifications_allow_all" ON public.notifications;
CREATE POLICY "notifications_allow_all" ON public.notifications
    FOR ALL USING (true);

-- Insert sample bikes data for testing
INSERT INTO public.bikes (model, brand, year, license_plate, status, price_per_day, location, fuel_type, transmission, engine_capacity, condition) VALUES
('Wave Alpha', 'Honda', 2023, '29A1-12345', 'available', 15000000, 'District 1, Ho Chi Minh City', 'gasoline', 'automatic', 110, 'excellent'),
('Exciter 155', 'Yamaha', 2023, '29A1-67890', 'available', 20000000, 'District 3, Ho Chi Minh City', 'gasoline', 'manual', 155, 'excellent'),
('Winner X', 'Honda', 2022, '29A1-11111', 'rented', 18000000, 'District 7, Ho Chi Minh City', 'gasoline', 'manual', 150, 'good'),
('Air Blade', 'Honda', 2023, '29A1-22222', 'available', 16000000, 'District 1, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent'),
('Grande', 'Yamaha', 2022, '29A1-33333', 'maintenance', 17000000, 'District 5, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'good')
ON CONFLICT (license_plate) DO NOTHING;

-- Insert sample booking data for testing
INSERT INTO public.bookings (user_id, bike_id, start_date, end_date, total_days, price_per_day, total_amount, status, payment_status, pickup_location, return_location) 
SELECT 
    u.id,
    b.id,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '3 days',
    3,
    b.price_per_day,
    b.price_per_day * 3,
    'active',
    'paid',
    'District 1, Ho Chi Minh City',
    'District 1, Ho Chi Minh City'
FROM public.users u
CROSS JOIN public.bikes b
WHERE u.role = 'customer' 
AND b.status = 'rented'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create update trigger for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers
DROP TRIGGER IF EXISTS update_bikes_updated_at ON public.bikes;
CREATE TRIGGER update_bikes_updated_at BEFORE UPDATE ON public.bikes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions for authenticated users
GRANT ALL ON public.bikes TO authenticated;
GRANT ALL ON public.bookings TO authenticated;
GRANT ALL ON public.notifications TO authenticated; 