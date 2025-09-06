-- Remove password column from Users table
-- This column is not needed since we're using GitHub OAuth

-- First, check if the column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Users' AND column_name = 'password';

-- Remove the password column if it exists
ALTER TABLE "Users" DROP COLUMN IF EXISTS "password";

-- Verify the column was removed
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Users' 
ORDER BY ordinal_position;