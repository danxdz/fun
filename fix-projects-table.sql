-- Fix Projects table to allow nullable repositoryUrl and accessToken
-- This enables "Create New Repo" functionality

-- Make repositoryUrl nullable
ALTER TABLE "Projects" ALTER COLUMN "repositoryUrl" DROP NOT NULL;

-- Make accessToken nullable  
ALTER TABLE "Projects" ALTER COLUMN "accessToken" DROP NOT NULL;

-- Add default values for better UX
ALTER TABLE "Projects" ALTER COLUMN "repositoryUrl" SET DEFAULT '';

-- Add default values for better UX
ALTER TABLE "Projects" ALTER COLUMN "accessToken" SET DEFAULT '';