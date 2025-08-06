-- SIMPLE Admin Setup - Run STEP BY STEP
-- Copy each step and run separately in Supabase SQL Editor

-- ==================== STEP 1: Function ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql'; 