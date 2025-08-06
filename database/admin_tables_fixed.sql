-- FIXED Admin Dashboard Database Schema
-- Run this in Supabase SQL Editor (Step by Step)

-- STEP 1: Create update function first (before any tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 2: Create bikes table
CREATE TABLE IF NOT EXISTS public.bikes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'rented', 'maintenance', 'retired')),
    price_per_day INTEGER NOT NULL, -- Store in VND (not cents)
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

-- STEP 3: Create bookings table  
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    bike_id UUID REFERENCES public.bikes(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    price_per_day INTEGER NOT NULL, -- Store in VND
    total_amount INTEGER NOT NULL, -- Store in VND
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    pickup_location VARCHAR(200),
    return_location VARCHAR(200),
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 4: Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'admin', 'broadcast')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- STEP 5: Add columns to existing users table (safely)
DO $$
BEGIN
    -- Add account_status column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'account_status'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN account_status VARCHAR(20) DEFAULT 'active' 
        CHECK (account_status IN ('active', 'suspended', 'blocked'));
    END IF;

    -- Add email_confirmed_at column if it doesn't exist  
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'email_confirmed_at'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN email_confirmed_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- STEP 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bikes_status ON public.bikes(status);
CREATE INDEX IF NOT EXISTS idx_bikes_location ON public.bikes(location);
CREATE INDEX IF NOT EXISTS idx_bikes_brand ON public.bikes(brand);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_bike_id ON public.bookings(bike_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);

-- STEP 7: Enable RLS on new tables
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- STEP 8: Create RLS policies (ultra-permissive for admin functionality)
-- Drop existing policies first
DROP POLICY IF EXISTS "bikes_allow_all" ON public.bikes;
DROP POLICY IF EXISTS "bookings_allow_all" ON public.bookings;
DROP POLICY IF EXISTS "notifications_allow_all" ON public.notifications;

-- Create new permissive policies
CREATE POLICY "bikes_allow_all" ON public.bikes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "bookings_allow_all" ON public.bookings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "notifications_allow_all" ON public.notifications
    FOR ALL USING (true) WITH CHECK (true);

-- STEP 9: Add update triggers (now that tables exist)
DROP TRIGGER IF EXISTS update_bikes_updated_at ON public.bikes;
CREATE TRIGGER update_bikes_updated_at 
    BEFORE UPDATE ON public.bikes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- STEP 10: Grant permissions
GRANT ALL ON public.bikes TO authenticated, anon;
GRANT ALL ON public.bookings TO authenticated, anon;
GRANT ALL ON public.notifications TO authenticated, anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- STEP 11: Insert sample bikes data for testing (with conflict handling)
INSERT INTO public.bikes (
    model, brand, year, license_plate, status, price_per_day, 
    location, fuel_type, transmission, engine_capacity, condition
) VALUES
('Wave Alpha', 'Honda', 2023, '29A1-12345', 'available', 150000, 'District 1, Ho Chi Minh City', 'gasoline', 'automatic', 110, 'excellent'),
('Exciter 155', 'Yamaha', 2023, '29A1-67890', 'available', 200000, 'District 3, Ho Chi Minh City', 'gasoline', 'manual', 155, 'excellent'),
('Winner X', 'Honda', 2022, '29A1-11111', 'rented', 180000, 'District 7, Ho Chi Minh City', 'gasoline', 'manual', 150, 'good'),
('Air Blade', 'Honda', 2023, '29A1-22222', 'available', 160000, 'District 1, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'excellent'),
('Grande', 'Yamaha', 2022, '29A1-33333', 'maintenance', 170000, 'District 5, Ho Chi Minh City', 'gasoline', 'automatic', 125, 'good'),
('Vision', 'Honda', 2023, '29A1-44444', 'available', 140000, 'District 2, Ho Chi Minh City', 'gasoline', 'automatic', 110, 'excellent'),
('NVX 155', 'Yamaha', 2022, '29A1-55555', 'available', 190000, 'District 4, Ho Chi Minh City', 'gasoline', 'manual', 155, 'good'),
('SH 150i', 'Honda', 2023, '29A1-66666', 'available', 250000, 'District 1, Ho Chi Minh City', 'gasoline', 'automatic', 150, 'excellent')
ON CONFLICT (license_plate) DO NOTHING;

-- STEP 12: Insert sample notifications for testing
INSERT INTO public.notifications (user_id, title, message, type) 
SELECT 
    id,
    'Welcome to CarRent Admin!',
    'Your admin dashboard is now ready. You can manage users, bikes, and bookings from here.',
    'admin'
FROM public.users 
WHERE role = 'admin'
LIMIT 3
ON CONFLICT DO NOTHING;

-- STEP 13: Create a view for admin dashboard stats (optional but useful)
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.bikes) as total_bikes,
    (SELECT COUNT(*) FROM public.bookings WHERE status IN ('confirmed', 'active')) as active_bookings,
    (SELECT COUNT(*) FROM public.bikes WHERE status = 'available') as available_bikes,
    (SELECT COUNT(*) FROM public.bikes WHERE status = 'rented') as rented_bikes,
    (SELECT COUNT(*) FROM public.bikes WHERE status = 'maintenance') as maintenance_bikes,
    (SELECT COUNT(*) FROM public.bookings WHERE status = 'pending') as pending_bookings,
    (SELECT COUNT(*) FROM public.bookings WHERE status = 'completed') as completed_bookings,
    (SELECT COUNT(*) FROM public.bookings WHERE status = 'cancelled') as cancelled_bookings,
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE payment_status = 'paid' AND created_at >= CURRENT_DATE) as today_revenue,
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.bookings WHERE payment_status = 'paid' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_revenue;

-- Grant access to the view
GRANT SELECT ON admin_dashboard_stats TO authenticated, anon;

-- SUCCESS MESSAGE
SELECT 'Admin Dashboard Database Setup Complete! ✅' as status; 