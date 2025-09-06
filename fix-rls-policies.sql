-- Fix RLS policies for Users table
-- The current policies are too restrictive and prevent user creation

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON "Users";
DROP POLICY IF EXISTS "Users can update own profile" ON "Users";

-- Create more permissive policies that allow INSERT
CREATE POLICY "Users can view own profile" ON "Users" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON "Users" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON "Users" FOR INSERT WITH CHECK (auth.uid() = id);

-- Also fix the upsert issue by allowing both insert and update
CREATE POLICY "Users can upsert own profile" ON "Users" FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);