-- Simple database schema for testing Supabase connection
-- Run this in your Supabase SQL Editor

-- 1. Enable UUID extension (if not enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('customer', 'admin')) NOT NULL DEFAULT 'customer',
  is_active BOOLEAN DEFAULT true,
  language_preference TEXT DEFAULT 'vi',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);

-- 7. Create RLS policies for notifications table
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- 8. Allow service role to bypass RLS for creating notifications
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- 9. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON public.notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Insert some test data (optional)
-- Uncomment below if you want sample data

/*
INSERT INTO public.users (email, full_name, phone_number, role) VALUES 
  ('test@example.com', 'Test User', '0123456789', 'customer'),
  ('admin@example.com', 'Admin User', '0987654321', 'admin')
ON CONFLICT (email) DO NOTHING;
*/

-- Success message
SELECT 'Database schema created successfully! 🎉' as status; 