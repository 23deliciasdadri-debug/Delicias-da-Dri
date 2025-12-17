-- Migration: Fix profiles RLS update policy
-- Ensures users can update their own profile
-- First, drop existing update policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
-- Create update policy for profiles
CREATE POLICY "Users can update own profile" ON profiles FOR
UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
-- Also ensure SELECT policy exists
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR
SELECT USING (auth.uid() = id);