-- ==================== STEP 3: Create Bookings Table ====================
-- Run this after Step 2

DROP TABLE IF EXISTS public.bookings CASCADE;

CREATE TABLE public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    bike_id UUID REFERENCES public.bikes(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    price_per_day INTEGER NOT NULL,
    total_amount INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    payment_status VARCHAR(20) DEFAULT 'pending',
    pickup_location VARCHAR(200),
    return_location VARCHAR(200),
    notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 