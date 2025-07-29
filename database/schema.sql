-- =============================================
-- CarRent Database Schema for Supabase
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- =============================================
-- BIKES TABLE  
-- =============================================
CREATE TABLE bikes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  type TEXT CHECK (type IN ('scooter', 'manual', 'sport', 'electric')) NOT NULL,
  engine_capacity INTEGER,
  fuel_type TEXT CHECK (fuel_type IN ('gasoline', 'electric')) NOT NULL,
  transmission TEXT CHECK (transmission IN ('automatic', 'manual')) NOT NULL,
  color TEXT NOT NULL,
  license_plate TEXT UNIQUE NOT NULL,
  description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  price_per_day DECIMAL(10,2) NOT NULL,
  price_per_hour DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2) NOT NULL,
  insurance DECIMAL(10,2) DEFAULT 0,
  location POINT, -- PostGIS for geolocation
  address TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  is_available BOOLEAN DEFAULT true,
  is_approved BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bike_id UUID REFERENCES bikes(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  pickup_location POINT,
  pickup_address TEXT,
  delivery_location POINT,
  delivery_address TEXT,
  delivery_type TEXT CHECK (delivery_type IN ('pickup', 'delivery')) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  deposit DECIMAL(10,2) NOT NULL,
  insurance DECIMAL(10,2) DEFAULT 0,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')) DEFAULT 'pending',
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'refunded')) DEFAULT 'pending',
  payment_method TEXT CHECK (payment_method IN ('vnpay', 'momo', 'zalopay', 'cash', 'card')),
  payment_transaction_id TEXT,
  notes TEXT,
  admin_notes TEXT,
  confirmed_by UUID REFERENCES users(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS TABLE
-- =============================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  bike_id UUID REFERENCES bikes(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id) -- One review per booking
);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('booking_created', 'booking_confirmed', 'delivery_started', 'booking_completed', 'booking_cancelled', 'payment', 'emergency', 'system')) NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EMERGENCY REPORTS TABLE
-- =============================================
CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('accident', 'breakdown', 'theft', 'other')) NOT NULL,
  description TEXT NOT NULL,
  location POINT,
  address TEXT,
  contact_phone TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT CHECK (status IN ('pending', 'in_progress', 'resolved')) DEFAULT 'pending',
  admin_response TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX idx_bikes_location ON bikes USING GIST(location);
CREATE INDEX idx_bikes_available ON bikes(is_available, is_approved);
CREATE INDEX idx_bikes_owner ON bikes(owner_id);
CREATE INDEX idx_bookings_customer ON bookings(customer_id);
CREATE INDEX idx_bookings_bike ON bookings(bike_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_reviews_bike ON reviews(bike_id);
CREATE INDEX idx_emergency_reports_customer ON emergency_reports(customer_id);

-- =============================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bikes_updated_at BEFORE UPDATE ON bikes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_reports_updated_at BEFORE UPDATE ON emergency_reports FOR EACH ROW EXECUTE FUNCTION update_emergency_reports_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Bikes policies
CREATE POLICY "Anyone can view approved available bikes" ON bikes FOR SELECT USING (is_approved = true AND is_available = true);
CREATE POLICY "Owners can view own bikes" ON bikes FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Owners can update own bikes" ON bikes FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Owners can insert bikes" ON bikes FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins can view all bikes" ON bikes FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all bikes" ON bikes FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Bookings policies
CREATE POLICY "Customers can view own bookings" ON bookings FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Bike owners can view bookings for their bikes" ON bookings FOR SELECT USING (
  bike_id IN (SELECT id FROM bikes WHERE owner_id = auth.uid())
);
CREATE POLICY "Customers can create bookings" ON bookings FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Customers can update own pending bookings" ON bookings FOR UPDATE USING (
  customer_id = auth.uid() AND status = 'pending'
);
CREATE POLICY "Admins can view all bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all bookings" ON bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews for own bookings" ON reviews FOR INSERT WITH CHECK (
  customer_id = auth.uid() AND 
  booking_id IN (SELECT id FROM bookings WHERE customer_id = auth.uid() AND status = 'completed')
);
CREATE POLICY "Customers can update own reviews" ON reviews FOR UPDATE USING (customer_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Emergency reports policies
CREATE POLICY "Customers can view own emergency reports" ON emergency_reports FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "Customers can create emergency reports for own bookings" ON emergency_reports FOR INSERT WITH CHECK (
  customer_id = auth.uid() AND 
  booking_id IN (SELECT id FROM bookings WHERE customer_id = auth.uid())
);
CREATE POLICY "Admins can view all emergency reports" ON emergency_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all emergency reports" ON emergency_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);

-- =============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =============================================

-- Function to update bike rating after new review
CREATE OR REPLACE FUNCTION update_bike_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE bikes SET 
    rating = (SELECT AVG(rating) FROM reviews WHERE bike_id = NEW.bike_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE bike_id = NEW.bike_id)
  WHERE id = NEW.bike_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bike_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_bike_rating();

-- Function to create notification when booking status changes
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip if status didn't change
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Create notification based on new status
  IF NEW.status = 'confirmed' THEN
    INSERT INTO notifications (user_id, title, message, type, booking_id)
    VALUES (
      NEW.customer_id,
      'Đơn hàng đã được xác nhận',
      'Admin đã xác nhận đơn đặt xe của bạn. Xe sẽ được giao trong thời gian sớm nhất.',
      'booking_confirmed',
      NEW.id
    );
  ELSIF NEW.status = 'active' THEN
    INSERT INTO notifications (user_id, title, message, type, booking_id)
    VALUES (
      NEW.customer_id,
      'Xe đang được giao',
      'Đối tác đang trên đường giao xe đến địa chỉ của bạn.',
      'delivery_started',
      NEW.id
    );
  ELSIF NEW.status = 'completed' THEN
    INSERT INTO notifications (user_id, title, message, type, booking_id)
    VALUES (
      NEW.customer_id,
      'Hoàn thành chuyến thuê',
      'Bạn đã hoàn thành chuyến thuê xe. Cảm ơn bạn đã sử dụng dịch vụ!',
      'booking_completed',
      NEW.id
    );
  ELSIF NEW.status = 'cancelled' THEN
    INSERT INTO notifications (user_id, title, message, type, booking_id)
    VALUES (
      NEW.customer_id,
      'Đơn hàng đã bị hủy',
      'Đơn đặt xe đã bị hủy. Vui lòng liên hệ hỗ trợ nếu có thắc mắc.',
      'booking_cancelled',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_booking_notification_trigger
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_booking_notification();

-- =============================================
-- AUTO-CREATE USER PROFILE FUNCTION
-- =============================================

-- Function to create user profile automatically when auth user is created
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile when user signs up
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- =============================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================

-- Insert sample admin user (will be created via Supabase Auth)
-- INSERT INTO users (id, email, full_name, role) VALUES 
-- ('00000000-0000-0000-0000-000000000001', 'admin@carrent.com', 'Admin User', 'admin');

-- Insert sample customer user
-- INSERT INTO users (id, email, full_name, role) VALUES 
-- ('00000000-0000-0000-0000-000000000002', 'customer@carrent.com', 'Customer User', 'customer');

-- Insert sample bikes
-- INSERT INTO bikes (name, brand, model, year, type, fuel_type, transmission, color, license_plate, description, price_per_day, price_per_hour, deposit, location, address, owner_id, is_approved) VALUES 
-- ('Honda Vision 2023', 'Honda', 'Vision', 2023, 'scooter', 'gasoline', 'automatic', 'Đỏ', '29A1-12345', 'Xe mới, tiết kiệm xăng', 150000, 15000, 1000000, POINT(106.6297, 10.8231), '123 Nguyễn Huệ, Q1, TP.HCM', '00000000-0000-0000-0000-000000000001', true); 