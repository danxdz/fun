-- Add missing githubToken field to Users table
-- Run this in your Supabase SQL Editor

-- Add githubToken column to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "githubToken" TEXT DEFAULT '';

-- Update the column to allow NULL values (since it's optional)
ALTER TABLE "Users" ALTER COLUMN "githubToken" DROP NOT NULL;

-- Add index for githubToken if needed
CREATE INDEX IF NOT EXISTS idx_users_github_token ON "Users"("githubToken") WHERE "githubToken" IS NOT NULL AND "githubToken" != '';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Users' AND column_name = 'githubToken';