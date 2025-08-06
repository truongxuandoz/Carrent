-- ==================== STEP 2: Create Bikes Table ====================
-- Run this separately after Step 1

DROP TABLE IF EXISTS public.bikes CASCADE;

CREATE TABLE public.bikes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    model VARCHAR(100) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'available',
    price_per_day INTEGER NOT NULL,
    location VARCHAR(200),
    fuel_type VARCHAR(20) DEFAULT 'gasoline',
    transmission VARCHAR(20) DEFAULT 'manual',
    engine_capacity INTEGER DEFAULT 150,
    features JSONB DEFAULT '[]'::jsonb,
    condition VARCHAR(20) DEFAULT 'excellent',
    images JSONB DEFAULT '[]'::jsonb,
    last_maintenance TIMESTAMP WITH TIME ZONE,
    next_maintenance TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 