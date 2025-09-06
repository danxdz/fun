-- Migration: Add missing fields to match application requirements
-- Run this in your Supabase SQL editor

-- ========================================
-- USERS TABLE UPDATES
-- ========================================

-- Add missing columns to Users table
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "githubToken" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "githubUsername" VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS "githubAvatar" TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS "cursorApiKey" TEXT DEFAULT '';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_github_username ON "Users"("githubUsername");

-- Update existing users to have empty strings instead of NULL
UPDATE "Users" 
SET 
  "githubToken" = COALESCE("githubToken", ''),
  "githubUsername" = COALESCE("githubUsername", ''),
  "githubAvatar" = COALESCE("githubAvatar", ''),
  "cursorApiKey" = COALESCE("cursorApiKey", '')
WHERE 
  "githubToken" IS NULL 
  OR "githubUsername" IS NULL 
  OR "githubAvatar" IS NULL 
  OR "cursorApiKey" IS NULL;

-- ========================================
-- PROJECTS TABLE UPDATES
-- ========================================

-- Add missing columns to Projects table
ALTER TABLE "Projects"
ADD COLUMN IF NOT EXISTS "status" VARCHAR(20) DEFAULT 'active' CHECK ("status" IN ('active', 'inactive', 'archived')),
ADD COLUMN IF NOT EXISTS "githubData" JSONB DEFAULT '{}';

-- Add index for status field
CREATE INDEX IF NOT EXISTS idx_projects_status ON "Projects"("status");

-- Update existing projects to have status based on isActive
UPDATE "Projects" 
SET "status" = CASE 
  WHEN "isActive" = true THEN 'active'
  ELSE 'inactive'
END
WHERE "status" IS NULL;

-- ========================================
-- BOTS TABLE UPDATES (if needed)
-- ========================================

-- Ensure Bots table has all required fields
-- (These should already exist based on schema.sql)
ALTER TABLE "Bots"
ADD COLUMN IF NOT EXISTS "description" TEXT DEFAULT '';

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify Users table changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'Users' 
  AND column_name IN ('githubToken', 'githubUsername', 'githubAvatar', 'cursorApiKey')
ORDER BY column_name;

-- Verify Projects table changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'Projects' 
  AND column_name IN ('status', 'githubData')
ORDER BY column_name;

-- Verify Bots table changes
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'Bots' 
  AND column_name IN ('description')
ORDER BY column_name;