-- DATABASE PERFORMANCE OPTIMIZATION
-- This script adds indexes and views to improve query performance

-- ==================== ESSENTIAL INDEXES FOR PERFORMANCE ====================

SELECT '🚀 Creating performance indexes...' as info;

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email_active ON public.users(email) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Bikes table indexes  
CREATE INDEX IF NOT EXISTS idx_bikes_available_approved ON public.bikes(is_available, is_approved) WHERE is_available = true AND is_approved = true;
CREATE INDEX IF NOT EXISTS idx_bikes_type ON public.bikes(type) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_bikes_brand ON public.bikes(brand) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_bikes_price_range ON public.bikes(price_per_day) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_bikes_rating ON public.bikes(rating DESC) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_bikes_created_at ON public.bikes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bikes_owner_id ON public.bikes(owner_id);

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status ON public.bookings(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_bike_status ON public.bookings(bike_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(start_date, end_date);

-- Reviews table indexes
CREATE INDEX IF NOT EXISTS idx_reviews_bike_id ON public.reviews(bike_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ==================== MATERIALIZED VIEWS FOR COMPLEX QUERIES ====================

SELECT '📊 Creating materialized views for dashboard stats...' as info;

-- Dashboard stats view (refreshed periodically)
DROP MATERIALIZED VIEW IF EXISTS admin_dashboard_stats;
CREATE MATERIALIZED VIEW admin_dashboard_stats AS
SELECT 
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.bikes) as total_bikes,
  (SELECT COUNT(*) FROM public.bookings WHERE status IN ('confirmed', 'active')) as active_bookings,
  (SELECT COUNT(*) FROM public.bikes WHERE is_available = true AND is_approved = true) as available_bikes,
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'pending') as pending_bookings,
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'completed') as completed_bookings,
  (SELECT COUNT(*) FROM public.bookings WHERE status = 'cancelled') as cancelled_bookings,
  (SELECT COALESCE(SUM(total_price), 0) FROM public.bookings 
   WHERE payment_status = 'paid' 
   AND created_at >= CURRENT_DATE) as today_revenue,
  (SELECT COALESCE(SUM(total_price), 0) FROM public.bookings 
   WHERE payment_status = 'paid' 
   AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_revenue,
  NOW() as last_updated;

-- Create index on materialized view
CREATE UNIQUE INDEX ON admin_dashboard_stats (last_updated);

-- Popular bikes view
DROP MATERIALIZED VIEW IF EXISTS popular_bikes_view;
CREATE MATERIALIZED VIEW popular_bikes_view AS
SELECT 
  b.id,
  b.name,
  b.brand,
  b.model,
  b.price_per_day,
  b.images,
  b.rating,
  b.review_count,
  COUNT(bk.id) as total_bookings
FROM public.bikes b
LEFT JOIN public.bookings bk ON b.id = bk.bike_id AND bk.status = 'completed'
WHERE b.is_available = true AND b.is_approved = true
GROUP BY b.id, b.name, b.brand, b.model, b.price_per_day, b.images, b.rating, b.review_count
ORDER BY b.rating DESC, COUNT(bk.id) DESC, b.review_count DESC;

-- ==================== FUNCTIONS FOR EFFICIENT QUERIES ====================

SELECT '⚡ Creating optimized functions...' as info;

-- Fast dashboard stats function (uses materialized view)
CREATE OR REPLACE FUNCTION get_fast_dashboard_stats()
RETURNS TABLE(
  total_users bigint,
  total_bikes bigint,
  active_bookings bigint,
  available_bikes bigint,
  pending_bookings bigint,
  completed_bookings bigint,
  cancelled_bookings bigint,
  today_revenue numeric,
  monthly_revenue numeric,
  last_updated timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM admin_dashboard_stats;
$$;

-- Fast popular bikes function
CREATE OR REPLACE FUNCTION get_popular_bikes(limit_count integer DEFAULT 6)
RETURNS TABLE(
  id uuid,
  name text,
  brand text,
  model text,
  price_per_day numeric,
  images jsonb,
  rating numeric,
  review_count integer,
  total_bookings bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM popular_bikes_view LIMIT limit_count;
$$;

-- ==================== AUTO-REFRESH MATERIALIZED VIEWS ====================

SELECT '🔄 Setting up auto-refresh for materialized views...' as info;

-- Function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY admin_dashboard_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_bikes_view;
  
  -- Log refresh
  INSERT INTO public.system_logs (event_type, message, created_at)
  VALUES ('materialized_view_refresh', 'Dashboard stats and popular bikes refreshed', NOW())
  ON CONFLICT DO NOTHING;
END;
$$;

-- Create system logs table if not exists
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== QUERY OPTIMIZATION HINTS ====================

SELECT '💡 Performance optimization completed!' as info;

-- Show current indexes
SELECT 
  'Created indexes:' as info,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Show materialized views
SELECT 
  'Created materialized views:' as info,
  schemaname,
  matviewname,
  ispopulated
FROM pg_matviews 
WHERE schemaname = 'public';

-- Performance recommendations
SELECT '📋 PERFORMANCE RECOMMENDATIONS:' as recommendations;
SELECT '1. Refresh materialized views every 5-15 minutes' as tip;
SELECT '2. Use the optimized service functions in your app' as tip;
SELECT '3. Monitor query performance with EXPLAIN ANALYZE' as tip;
SELECT '4. Consider connection pooling for high traffic' as tip;

-- Manual refresh command (run this periodically)
SELECT '🔧 TO REFRESH STATS MANUALLY: SELECT refresh_dashboard_stats();' as manual_refresh;

SELECT '✅ Database optimization completed!' as status; 