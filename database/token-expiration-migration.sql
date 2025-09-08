-- ========================================
-- TOKEN EXPIRATION MIGRATION
-- ========================================
-- This migration adds token expiration fields to improve security

-- Add token expiration fields to Users table
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "tokenExpiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "tokenCreatedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "cursorApiKeyExpiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "cursorApiKeyCreatedAt" TIMESTAMP WITH TIME ZONE;

-- Add token expiration fields to Projects table (for access tokens)
ALTER TABLE "Projects" 
ADD COLUMN IF NOT EXISTS "accessTokenExpiresAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "accessTokenCreatedAt" TIMESTAMP WITH TIME ZONE;

-- Create indexes for efficient token cleanup
CREATE INDEX IF NOT EXISTS idx_users_token_expires ON "Users"("tokenExpiresAt") 
WHERE "tokenExpiresAt" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_cursor_key_expires ON "Users"("cursorApiKeyExpiresAt") 
WHERE "cursorApiKeyExpiresAt" IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_token_expires ON "Projects"("accessTokenExpiresAt") 
WHERE "accessTokenExpiresAt" IS NOT NULL;

-- ========================================
-- UPDATE EXISTING TOKENS WITH EXPIRATION
-- ========================================

-- Set expiration for existing GitHub tokens (24 hours from now)
UPDATE "Users" 
SET 
    "tokenExpiresAt" = NOW() + INTERVAL '24 hours',
    "tokenCreatedAt" = COALESCE("updatedAt", "createdAt")
WHERE "githubToken" IS NOT NULL 
  AND "githubToken" != '' 
  AND "tokenExpiresAt" IS NULL;

-- Set expiration for existing Cursor API keys (7 days from now - they're usually longer-lived)
UPDATE "Users" 
SET 
    "cursorApiKeyExpiresAt" = NOW() + INTERVAL '7 days',
    "cursorApiKeyCreatedAt" = COALESCE("updatedAt", "createdAt")
WHERE "cursorApiKey" IS NOT NULL 
  AND "cursorApiKey" != '' 
  AND "cursorApiKeyExpiresAt" IS NULL;

-- Set expiration for existing project access tokens (24 hours from now)
UPDATE "Projects" 
SET 
    "accessTokenExpiresAt" = NOW() + INTERVAL '24 hours',
    "accessTokenCreatedAt" = COALESCE("updatedAt", "createdAt")
WHERE "accessToken" IS NOT NULL 
  AND "accessToken" != '' 
  AND "accessTokenExpiresAt" IS NULL;

-- ========================================
-- CREATE AUTOMATED CLEANUP JOB
-- ========================================

-- Function to clean up expired tokens (called by cron job)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens_job()
RETURNS TABLE (
    cleaned_github_tokens INTEGER,
    cleaned_cursor_keys INTEGER,
    cleaned_project_tokens INTEGER,
    total_cleaned INTEGER
) AS $$
DECLARE
    github_cleaned INTEGER := 0;
    cursor_cleaned INTEGER := 0;
    project_cleaned INTEGER := 0;
BEGIN
    -- Clean up expired GitHub tokens
    UPDATE "Users" 
    SET 
        "githubToken" = NULL,
        "tokenExpiresAt" = NULL,
        "updatedAt" = NOW()
    WHERE "tokenExpiresAt" IS NOT NULL 
      AND "tokenExpiresAt" < NOW()
      AND "githubToken" IS NOT NULL;
    
    GET DIAGNOSTICS github_cleaned = ROW_COUNT;
    
    -- Clean up expired Cursor API keys
    UPDATE "Users" 
    SET 
        "cursorApiKey" = NULL,
        "cursorApiKeyExpiresAt" = NULL,
        "updatedAt" = NOW()
    WHERE "cursorApiKeyExpiresAt" IS NOT NULL 
      AND "cursorApiKeyExpiresAt" < NOW()
      AND "cursorApiKey" IS NOT NULL;
    
    GET DIAGNOSTICS cursor_cleaned = ROW_COUNT;
    
    -- Clean up expired project access tokens
    UPDATE "Projects" 
    SET 
        "accessToken" = NULL,
        "accessTokenExpiresAt" = NULL,
        "updatedAt" = NOW()
    WHERE "accessTokenExpiresAt" IS NOT NULL 
      AND "accessTokenExpiresAt" < NOW()
      AND "accessToken" IS NOT NULL;
    
    GET DIAGNOSTICS project_cleaned = ROW_COUNT;
    
    -- Log the cleanup
    INSERT INTO "SystemLogs" (level, message, metadata, "createdAt")
    VALUES (
        'INFO',
        'Token cleanup completed',
        jsonb_build_object(
            'github_tokens_cleaned', github_cleaned,
            'cursor_keys_cleaned', cursor_cleaned,
            'project_tokens_cleaned', project_cleaned,
            'total_cleaned', github_cleaned + cursor_cleaned + project_cleaned
        ),
        NOW()
    );
    
    RETURN QUERY SELECT github_cleaned, cursor_cleaned, project_cleaned, 
                        github_cleaned + cursor_cleaned + project_cleaned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- CREATE SYSTEM LOGS TABLE (if not exists)
-- ========================================

CREATE TABLE IF NOT EXISTS "SystemLogs" (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    level VARCHAR(20) NOT NULL CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL')),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON "SystemLogs"(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON "SystemLogs"("createdAt");

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check token expiration status
SELECT 
    'GitHub Tokens' as token_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE "tokenExpiresAt" IS NULL) as no_expiration,
    COUNT(*) FILTER (WHERE "tokenExpiresAt" < NOW()) as expired,
    COUNT(*) FILTER (WHERE "tokenExpiresAt" BETWEEN NOW() AND NOW() + INTERVAL '1 hour') as expiring_soon
FROM "Users" 
WHERE "githubToken" IS NOT NULL AND "githubToken" != ''

UNION ALL

SELECT 
    'Cursor API Keys' as token_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE "cursorApiKeyExpiresAt" IS NULL) as no_expiration,
    COUNT(*) FILTER (WHERE "cursorApiKeyExpiresAt" < NOW()) as expired,
    COUNT(*) FILTER (WHERE "cursorApiKeyExpiresAt" BETWEEN NOW() AND NOW() + INTERVAL '1 hour') as expiring_soon
FROM "Users" 
WHERE "cursorApiKey" IS NOT NULL AND "cursorApiKey" != ''

UNION ALL

SELECT 
    'Project Access Tokens' as token_type,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE "accessTokenExpiresAt" IS NULL) as no_expiration,
    COUNT(*) FILTER (WHERE "accessTokenExpiresAt" < NOW()) as expired,
    COUNT(*) FILTER (WHERE "accessTokenExpiresAt" BETWEEN NOW() AND NOW() + INTERVAL '1 hour') as expiring_soon
FROM "Projects" 
WHERE "accessToken" IS NOT NULL AND "accessToken" != '';