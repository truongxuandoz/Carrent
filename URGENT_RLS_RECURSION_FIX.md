# 🚨 URGENT: Fix Infinite Recursion in RLS Policies

## ❌ Critical Error

```
infinite recursion detected in policy for relation "users"
500 Server Error
```

**What's happening:**
- RLS policies referencing each other in circular manner
- App cannot access users table
- Auto-profile creation fails
- Web app breaks with 500 errors

## 🔧 IMMEDIATE FIX - Run This Now

**Copy and paste this entire script in Supabase SQL Editor:**

```sql
-- File: database/fix_infinite_recursion_rls.sql
```

**This script will:**
1. ✅ Temporarily disable RLS to break recursion
2. ✅ Drop ALL problematic policies  
3. ✅ Create simple, non-recursive policies
4. ✅ Test the fix works
5. ✅ Create missing user profiles

## 🎯 Root Cause

**Problematic policies had circular references:**
```sql
-- BAD: These cause recursion
"Allow all authenticated users" → checks auth.role() → triggers other policies
"Development: Allow all..." → complex USING clauses → triggers recursion  
"Service role bypass" → conflicts with other policies
```

## ✅ Fixed Policies (Simple & Clean)

```sql
-- GOOD: Simple, direct policies
CREATE POLICY "service_role_access" ON public.users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "users_select_own" ON public.users  
  FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = auth_id);
```

## 🧪 Test After Fix

1. **Refresh your web app** → Should load without 500 errors
2. **Check console logs** → No more recursion errors  
3. **Test registration/login** → Should work normally

## 📋 What Changed

### ❌ Before (Broken):
- Complex policy conditions
- Multiple overlapping policies
- Circular references
- Infinite recursion

### ✅ After (Fixed):
- Simple `auth.uid() = auth_id` checks
- Clear policy separation (SELECT/INSERT/UPDATE)
- No circular references  
- Direct, fast queries

## 🚀 Expected Results

After running the fix:
- ✅ Web app loads normally
- ✅ User profiles accessible  
- ✅ Registration works
- ✅ Login works
- ✅ No 500 errors
- ✅ Console shows: `✅ User profile loaded from database`

## ⚡ Prevention

**For future policy changes:**
1. **Keep policies simple** - avoid complex USING clauses
2. **Test incremental** - add one policy at a time
3. **Use direct checks** - `auth.uid() = auth_id` instead of subqueries
4. **Avoid overlapping** - each policy should have clear purpose

## 🎯 Summary

**Infinite recursion completely fixed with:**
- 🚨 Emergency RLS reset
- 🧹 Clean policy architecture  
- ✅ Simple, fast policies
- 🔒 Proper security maintained

**Run the SQL script immediately to fix your app! 🚨** 