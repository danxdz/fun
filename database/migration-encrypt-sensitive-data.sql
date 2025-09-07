-- Migration: Encrypt existing sensitive data
-- Run this in your Supabase SQL editor AFTER deploying the encryption code

-- ========================================
-- IMPORTANT SECURITY NOTICE
-- ========================================
-- This migration will encrypt existing sensitive data in your database.
-- Make sure to:
-- 1. Deploy the updated server code with encryption functions FIRST
-- 2. Set ENCRYPTION_KEY environment variable in Railway
-- 3. Test the encryption/decryption functions
-- 4. Only then run this migration

-- ========================================
-- BACKUP RECOMMENDATION
-- ========================================
-- Before running this migration, backup your Users table:
-- CREATE TABLE "Users_backup" AS SELECT * FROM "Users";

-- ========================================
-- MIGRATION NOTES
-- ========================================
-- This migration assumes that:
-- 1. The server code has been updated with encryption functions
-- 2. ENCRYPTION_KEY environment variable is set
-- 3. All new data will be encrypted automatically

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check current data (before encryption)
SELECT 
  id, 
  email, 
  githubUsername,
  CASE 
    WHEN "githubToken" IS NOT NULL AND "githubToken" != '' 
    THEN 'HAS_TOKEN' 
    ELSE 'NO_TOKEN' 
  END as github_token_status,
  CASE 
    WHEN "cursorApiKey" IS NOT NULL AND "cursorApiKey" != '' 
    THEN 'HAS_KEY' 
    ELSE 'NO_KEY' 
  END as cursor_key_status
FROM "Users" 
WHERE "githubToken" IS NOT NULL OR "cursorApiKey" IS NOT NULL;

-- ========================================
-- MANUAL ENCRYPTION INSTRUCTIONS
-- ========================================
-- Since encryption must be done server-side with the ENCRYPTION_KEY,
-- you'll need to run a server-side script to encrypt existing data.
-- 
-- The server should provide an endpoint like:
-- POST /api/admin/encrypt-existing-data
-- 
-- This endpoint should:
-- 1. Fetch all users with sensitive data
-- 2. Encrypt githubToken and cursorApiKey fields
-- 3. Update the database with encrypted values
-- 4. Log the encryption process

-- ========================================
-- POST-MIGRATION VERIFICATION
-- ========================================

-- After encryption, verify data is encrypted (should show encrypted strings)
SELECT 
  id, 
  email, 
  githubUsername,
  CASE 
    WHEN "githubToken" LIKE '%:%:%' 
    THEN 'ENCRYPTED' 
    ELSE 'NOT_ENCRYPTED' 
  END as github_token_status,
  CASE 
    WHEN "cursorApiKey" LIKE '%:%:%' 
    THEN 'ENCRYPTED' 
    ELSE 'NOT_ENCRYPTED' 
  END as cursor_key_status
FROM "Users" 
WHERE "githubToken" IS NOT NULL OR "cursorApiKey" IS NOT NULL;

-- ========================================
-- CLEANUP (OPTIONAL)
-- ========================================
-- After successful migration and verification:
-- DROP TABLE IF EXISTS "Users_backup";