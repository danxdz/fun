-- Add GitHub token column to Users table for repository creation
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "githubToken" TEXT DEFAULT '';