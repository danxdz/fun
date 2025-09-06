-- Add cursorApiKey column to Users table
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "cursorApiKey" TEXT DEFAULT '';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Users' 
ORDER BY ordinal_position;