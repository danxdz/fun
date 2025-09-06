-- Fix Users table by adding all missing columns
-- This script adds all the columns that the application expects

-- Add githubUsername column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "githubUsername" VARCHAR(255) DEFAULT '';

-- Add githubAvatar column if it doesn't exist  
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "githubAvatar" TEXT DEFAULT '';

-- Add cursorApiKey column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "cursorApiKey" TEXT DEFAULT '';

-- Add firstName column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "firstName" VARCHAR(255) DEFAULT '';

-- Add lastName column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "lastName" VARCHAR(255) DEFAULT '';

-- Add role column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "role" VARCHAR(20) DEFAULT 'user';

-- Add isActive column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Add lastLogin column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP WITH TIME ZONE;

-- Add preferences column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "preferences" JSONB DEFAULT '{}';

-- Add createdAt column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add updatedAt column if it doesn't exist
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Verify all columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Users' 
ORDER BY ordinal_position;