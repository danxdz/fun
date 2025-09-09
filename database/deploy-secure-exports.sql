-- ========================================
-- DEPLOY SECURE EXPORT FUNCTIONS TO PRODUCTION
-- ========================================
-- Run this in your Supabase SQL editor to deploy secure export functions

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
-- VERIFICATION QUERIES
-- ========================================

-- Test the secure export functions
SELECT 'Testing secure user export...' as status;
SELECT * FROM export_users_secure() LIMIT 1;

SELECT 'Testing secure project export...' as status;
SELECT * FROM export_projects_secure() LIMIT 1;

SELECT 'Testing token statistics...' as status;
SELECT * FROM get_token_statistics();

-- ========================================
-- USAGE INSTRUCTIONS
-- ========================================

-- ✅ CORRECT: Use these for exports
-- SELECT * FROM export_users_secure();
-- SELECT * FROM export_projects_secure();
-- SELECT * FROM get_token_statistics();

-- ❌ WRONG: Never use these for exports
-- SELECT * FROM "Users";
-- SELECT * FROM "Projects";