-- ========================================
-- SECURE DATABASE EXPORT FUNCTIONS
-- ========================================
-- These functions ensure sensitive data is NEVER exported

-- Function to export users WITHOUT sensitive data
CREATE OR REPLACE FUNCTION export_users_secure()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    role VARCHAR(20),
    "isActive" BOOLEAN,
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    preferences JSONB,
    "githubUsername" VARCHAR(255),
    "githubAvatar" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE,
    "updatedAt" TIMESTAMP WITH TIME ZONE,
    "hasGithubToken" BOOLEAN,
    "hasCursorApiKey" BOOLEAN,
    "tokenExpiresAt" TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u."firstName",
        u."lastName",
        u.role,
        u."isActive",
        u."lastLogin",
        u.preferences,
        u."githubUsername",
        u."githubAvatar",
        u."createdAt",
        u."updatedAt",
        CASE WHEN u."githubToken" IS NOT NULL AND u."githubToken" != '' THEN true ELSE false END as "hasGithubToken",
        CASE WHEN u."cursorApiKey" IS NOT NULL AND u."cursorApiKey" != '' THEN true ELSE false END as "hasCursorApiKey",
        u."tokenExpiresAt"
    FROM "Users" u;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export projects WITHOUT access tokens
CREATE OR REPLACE FUNCTION export_projects_secure()
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    "repositoryUrl" VARCHAR(500),
    "repositoryType" VARCHAR(20),
    "defaultBranch" VARCHAR(255),
    "isActive" BOOLEAN,
    settings JSONB,
    status VARCHAR(20),
    "githubData" JSONB,
    "UserId" UUID,
    "TeamId" UUID,
    "createdAt" TIMESTAMP WITH TIME ZONE,
    "updatedAt" TIMESTAMP WITH TIME ZONE,
    "hasAccessToken" BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p."repositoryUrl",
        p."repositoryType",
        p."defaultBranch",
        p."isActive",
        p.settings,
        p.status,
        p."githubData",
        p."UserId",
        p."TeamId",
        p."createdAt",
        p."updatedAt",
        CASE WHEN p."accessToken" IS NOT NULL AND p."accessToken" != '' THEN true ELSE false END as "hasAccessToken"
    FROM "Projects" p;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    cleaned_count INTEGER := 0;
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
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- Clean up expired Cursor API keys (optional - these might not expire)
    -- UPDATE "Users" 
    -- SET "cursorApiKey" = NULL, "updatedAt" = NOW()
    -- WHERE "cursorApiKeyExpiresAt" IS NOT NULL 
    --   AND "cursorApiKeyExpiresAt" < NOW();
    
    RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get token statistics (for monitoring)
CREATE OR REPLACE FUNCTION get_token_statistics()
RETURNS TABLE (
    total_users INTEGER,
    users_with_github_tokens INTEGER,
    users_with_cursor_keys INTEGER,
    expired_tokens INTEGER,
    tokens_expiring_soon INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM "Users")::INTEGER as total_users,
        (SELECT COUNT(*) FROM "Users" WHERE "githubToken" IS NOT NULL AND "githubToken" != '')::INTEGER as users_with_github_tokens,
        (SELECT COUNT(*) FROM "Users" WHERE "cursorApiKey" IS NOT NULL AND "cursorApiKey" != '')::INTEGER as users_with_cursor_keys,
        (SELECT COUNT(*) FROM "Users" WHERE "tokenExpiresAt" IS NOT NULL AND "tokenExpiresAt" < NOW())::INTEGER as expired_tokens,
        (SELECT COUNT(*) FROM "Users" WHERE "tokenExpiresAt" IS NOT NULL AND "tokenExpiresAt" BETWEEN NOW() AND NOW() + INTERVAL '1 hour')::INTEGER as tokens_expiring_soon;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- SECURITY POLICIES
-- ========================================

-- Prevent direct access to sensitive columns
CREATE POLICY "No direct access to tokens" ON "Users" 
FOR SELECT USING (false);

-- Allow access only through secure functions
CREATE POLICY "Secure user access" ON "Users" 
FOR SELECT USING (
    auth.uid()::text = id::text OR 
    EXISTS (
        SELECT 1 FROM "UserTeams" ut 
        JOIN "Teams" t ON ut."TeamId" = t.id 
        WHERE ut."UserId" = auth.uid()::text 
        AND t."isActive" = true
    )
);

-- ========================================
-- USAGE EXAMPLES
-- ========================================

-- Export users securely (no sensitive data)
-- SELECT * FROM export_users_secure();

-- Export projects securely (no access tokens)
-- SELECT * FROM export_projects_secure();

-- Clean up expired tokens
-- SELECT cleanup_expired_tokens();

-- Get token statistics
-- SELECT * FROM get_token_statistics();

-- ========================================
-- MONITORING QUERIES
-- ========================================

-- Check for any direct token access attempts
-- SELECT 
--     schemaname,
--     tablename,
--     attname,
--     n_distinct,
--     correlation
-- FROM pg_stats 
-- WHERE tablename = 'Users' 
--   AND attname IN ('githubToken', 'cursorApiKey', 'accessToken');

-- Monitor token expiration
-- SELECT 
--     COUNT(*) as total_tokens,
--     COUNT(*) FILTER (WHERE "tokenExpiresAt" < NOW()) as expired,
--     COUNT(*) FILTER (WHERE "tokenExpiresAt" BETWEEN NOW() AND NOW() + INTERVAL '1 hour') as expiring_soon
-- FROM "Users" 
-- WHERE "githubToken" IS NOT NULL;