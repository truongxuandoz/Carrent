-- ==================== STEP 4: Setup Everything Else ====================
-- Run this after Step 3

-- Create notifications table
DROP TABLE IF EXISTS public.notifications CASCADE;

CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add columns to users table if needed
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'active';

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS
ALTER TABLE public.bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
DROP POLICY IF EXISTS "bikes_allow_all" ON public.bikes;
CREATE POLICY "bikes_allow_all" ON public.bikes FOR ALL USING (true);

DROP POLICY IF EXISTS "bookings_allow_all" ON public.bookings;
CREATE POLICY "bookings_allow_all" ON public.bookings FOR ALL USING (true);

DROP POLICY IF EXISTS "notifications_allow_all" ON public.notifications;
CREATE POLICY "notifications_allow_all" ON public.notifications FOR ALL USING (true);

-- Add triggers
DROP TRIGGER IF EXISTS update_bikes_updated_at ON public.bikes;
CREATE TRIGGER update_bikes_updated_at 
    BEFORE UPDATE ON public.bikes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON public.bikes TO authenticated, anon;
GRANT ALL ON public.bookings TO authenticated, anon;
GRANT ALL ON public.notifications TO authenticated, anon;

-- Insert sample data
INSERT INTO public.bikes (model, brand, year, license_plate, status, price_per_day, location) VALUES
('Wave Alpha', 'Honda', 2023, '29A1-12345', 'available', 150000, 'District 1, Ho Chi Minh City'),
('Exciter 155', 'Yamaha', 2023, '29A1-67890', 'available', 200000, 'District 3, Ho Chi Minh City'),
('Winner X', 'Honda', 2022, '29A1-11111', 'rented', 180000, 'District 7, Ho Chi Minh City'),
('Air Blade', 'Honda', 2023, '29A1-22222', 'available', 160000, 'District 1, Ho Chi Minh City'),
('Grande', 'Yamaha', 2022, '29A1-33333', 'maintenance', 170000, 'District 5, Ho Chi Minh City')
ON CONFLICT (license_plate) DO NOTHING;

SELECT 'Setup Complete! ✅' as result; 