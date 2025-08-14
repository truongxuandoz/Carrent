-- PRODUCTION SECURITY POLICIES
-- Run this when ready to deploy to production
-- IMPORTANT: Only run this after development is complete

-- ==================== USERS TABLE - PRODUCTION POLICIES ====================

-- Drop development permissive policies
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "service_role_access" ON public.users;

-- Create strict production policies
CREATE POLICY "users_select_own_strict" ON public.users
  FOR SELECT USING (
    auth.uid() = auth_id OR 
    (auth.uid() IN (SELECT auth_id FROM public.users WHERE role = 'admin'))
  );

CREATE POLICY "users_insert_own_strict" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "users_update_own_strict" ON public.users
  FOR UPDATE USING (
    auth.uid() = auth_id OR
    (auth.uid() IN (SELECT auth_id FROM public.users WHERE role = 'admin'))
  );

-- Keep service role access for backend operations
CREATE POLICY "service_role_access_prod" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

-- ==================== BIKES TABLE - PRODUCTION POLICIES ====================

DROP POLICY IF EXISTS "bikes_allow_all" ON public.bikes;

-- Public can view approved available bikes
CREATE POLICY "bikes_public_view" ON public.bikes
  FOR SELECT USING (is_approved = true AND is_available = true);

-- Bike owners can manage their bikes
CREATE POLICY "bikes_owner_manage" ON public.bikes
  FOR ALL USING (
    owner_id = auth.uid() OR
    (auth.uid() IN (SELECT auth_id FROM public.users WHERE role = 'admin'))
  );

-- ==================== BOOKINGS TABLE - PRODUCTION POLICIES ====================

DROP POLICY IF EXISTS "bookings_allow_all" ON public.bookings;

-- Customers can view their own bookings
CREATE POLICY "bookings_customer_own" ON public.bookings
  FOR SELECT USING (
    customer_id = auth.uid() OR
    bike_id IN (SELECT id FROM public.bikes WHERE owner_id = auth.uid()) OR
    (auth.uid() IN (SELECT auth_id FROM public.users WHERE role = 'admin'))
  );

-- Customers can create bookings
CREATE POLICY "bookings_customer_create" ON public.bookings
  FOR INSERT WITH CHECK (customer_id = auth.uid());

-- Customers can update their pending bookings
CREATE POLICY "bookings_customer_update" ON public.bookings
  FOR UPDATE USING (
    (customer_id = auth.uid() AND status = 'pending') OR
    bike_id IN (SELECT id FROM public.bikes WHERE owner_id = auth.uid()) OR
    (auth.uid() IN (SELECT auth_id FROM public.users WHERE role = 'admin'))
  );

-- ==================== OTHER TABLES ====================

-- Reviews: Public read, customers create for own bookings
DROP POLICY IF EXISTS "reviews_allow_all" ON public.reviews;

CREATE POLICY "reviews_public_read" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_customer_create" ON public.reviews
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() AND
    booking_id IN (SELECT id FROM public.bookings WHERE customer_id = auth.uid())
  );

-- Notifications: Users see own only
DROP POLICY IF EXISTS "notifications_allow_all" ON public.notifications;

CREATE POLICY "notifications_user_own" ON public.notifications
  FOR ALL USING (
    user_id = auth.uid() OR
    (auth.uid() IN (SELECT auth_id FROM public.users WHERE role = 'admin'))
  );

-- Emergency Reports: Users see own, admins see all
DROP POLICY IF EXISTS "emergency_reports_allow_all" ON public.emergency_reports;

CREATE POLICY "emergency_reports_user_own" ON public.emergency_reports
  FOR ALL USING (
    customer_id = auth.uid() OR
    (auth.uid() IN (SELECT auth_id FROM public.users WHERE role = 'admin'))
  );

-- Verification
SELECT '✅ PRODUCTION SECURITY POLICIES APPLIED!' as status;
SELECT '⚠️ IMPORTANT: Test thoroughly before going live' as warning; 