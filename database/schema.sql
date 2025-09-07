-- AutoBot Manager Database Schema
-- Run this in your Supabase SQL editor

-- ========================================
-- FRESH START - RESET DATABASE
-- ========================================
-- Uncomment the lines below to completely reset the database
-- WARNING: This will delete ALL data!

/*
-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS "UserTeams" CASCADE;
DROP TABLE IF EXISTS "ModuleUpdates" CASCADE;
DROP TABLE IF EXISTS "GitBranches" CASCADE;
DROP TABLE IF EXISTS "BotRuns" CASCADE;
DROP TABLE IF EXISTS "Bots" CASCADE;
DROP TABLE IF EXISTS "Projects" CASCADE;
DROP TABLE IF EXISTS "Teams" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop extensions (optional - will be recreated below)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
*/

-- ========================================
-- DATABASE SETUP
-- ========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE "Users" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  "firstName" VARCHAR(100) NOT NULL,
  "lastName" VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  "isActive" BOOLEAN DEFAULT true,
  "lastLogin" TIMESTAMP WITH TIME ZONE,
  preferences JSONB DEFAULT '{}',
  "githubToken" TEXT DEFAULT '',
  "githubUsername" VARCHAR(255) DEFAULT '',
  "githubAvatar" TEXT DEFAULT '',
  "cursorApiKey" TEXT DEFAULT '',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE "Teams" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE "Projects" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  "repositoryUrl" VARCHAR(500) NOT NULL,
  "repositoryType" VARCHAR(20) DEFAULT 'github' CHECK ("repositoryType" IN ('github', 'gitlab', 'bitbucket')),
  "accessToken" VARCHAR(255) NOT NULL,
  "defaultBranch" VARCHAR(255) DEFAULT 'main',
  "isActive" BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  "githubData" JSONB DEFAULT '{}',
  "UserId" UUID REFERENCES "Users"(id) ON DELETE CASCADE,
  "TeamId" UUID REFERENCES "Teams"(id) ON DELETE SET NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bots table
CREATE TABLE "Bots" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('dependency_update', 'security_scan', 'module_update', 'custom')),
  status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'error', 'paused')),
  configuration JSONB DEFAULT '{}',
  schedule VARCHAR(255), -- cron expression
  description TEXT DEFAULT '',
  "lastRun" TIMESTAMP WITH TIME ZONE,
  "nextRun" TIMESTAMP WITH TIME ZONE,
  "isActive" BOOLEAN DEFAULT true,
  "ProjectId" UUID REFERENCES "Projects"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bot runs table
CREATE TABLE "BotRuns" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "BotId" UUID REFERENCES "Bots"(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  "startTime" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "endTime" TIMESTAMP WITH TIME ZONE,
  duration INTEGER, -- in milliseconds
  logs JSONB DEFAULT '[]',
  results JSONB DEFAULT '{}',
  error TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Git branches table
CREATE TABLE "GitBranches" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "ProjectId" UUID REFERENCES "Projects"(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  "commitHash" VARCHAR(40),
  "commitMessage" TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Module updates table
CREATE TABLE "ModuleUpdates" (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  "ProjectId" UUID REFERENCES "Projects"(id) ON DELETE CASCADE,
  "moduleName" VARCHAR(255) NOT NULL,
  "currentVersion" VARCHAR(50),
  "targetVersion" VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  changes JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- UserTeams junction table
CREATE TABLE "UserTeams" (
  "UserId" UUID REFERENCES "Users"(id) ON DELETE CASCADE,
  "TeamId" UUID REFERENCES "Teams"(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY ("UserId", "TeamId")
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_users_github_username ON "Users"("githubUsername");
CREATE INDEX idx_projects_user_id ON "Projects"("UserId");
CREATE INDEX idx_projects_team_id ON "Projects"("TeamId");
CREATE INDEX idx_projects_status ON "Projects"("status");
CREATE INDEX idx_bots_project_id ON "Bots"("ProjectId");
CREATE INDEX idx_bot_runs_bot_id ON "BotRuns"("BotId");
CREATE INDEX idx_git_branches_project_id ON "GitBranches"("ProjectId");
CREATE INDEX idx_module_updates_project_id ON "ModuleUpdates"("ProjectId");

-- Row Level Security (RLS) policies
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BotRuns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GitBranches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ModuleUpdates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserTeams" ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON "Users" FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON "Users" FOR UPDATE USING (auth.uid()::text = id::text);

-- Users can view own projects
CREATE POLICY "Users can view own projects" ON "Projects" FOR SELECT USING ("UserId"::text = auth.uid()::text);
CREATE POLICY "Users can create own projects" ON "Projects" FOR INSERT WITH CHECK ("UserId"::text = auth.uid()::text);
CREATE POLICY "Users can update own projects" ON "Projects" FOR UPDATE USING ("UserId"::text = auth.uid()::text);
CREATE POLICY "Users can delete own projects" ON "Projects" FOR DELETE USING ("UserId"::text = auth.uid()::text);

-- Users can view own bots
CREATE POLICY "Users can view own bots" ON "Bots" FOR SELECT USING (
  "ProjectId" IN (SELECT id FROM "Projects" WHERE "UserId"::text = auth.uid()::text)
);
CREATE POLICY "Users can create own bots" ON "Bots" FOR INSERT WITH CHECK (
  "ProjectId" IN (SELECT id FROM "Projects" WHERE "UserId"::text = auth.uid()::text)
);
CREATE POLICY "Users can update own bots" ON "Bots" FOR UPDATE USING (
  "ProjectId" IN (SELECT id FROM "Projects" WHERE "UserId"::text = auth.uid()::text)
);
CREATE POLICY "Users can delete own bots" ON "Bots" FOR DELETE USING (
  "ProjectId" IN (SELECT id FROM "Projects" WHERE "UserId"::text = auth.uid()::text)
);

-- Insert sample data
INSERT INTO "Users" (email, password, "firstName", "lastName", role) VALUES 
('admin@autobot.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj5J5K5K5K5K', 'Admin', 'User', 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO "Teams" (name, description) VALUES 
('Development Team', 'Main development team')
ON CONFLICT DO NOTHING;

-- Get the admin user ID for foreign key references
DO $$
DECLARE
    admin_user_id UUID;
    team_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM "Users" WHERE email = 'admin@autobot.com';
    SELECT id INTO team_id FROM "Teams" WHERE name = 'Development Team';
    
    IF admin_user_id IS NOT NULL AND team_id IS NOT NULL THEN
        INSERT INTO "Projects" (name, description, "repositoryUrl", "repositoryType", "accessToken", "UserId", "TeamId") VALUES 
        ('Sample Project', 'A sample project for testing', 'https://github.com/example/sample-project', 'github', 'sample-token', admin_user_id, team_id)
        ON CONFLICT DO NOTHING;
        
        INSERT INTO "Bots" (name, type, configuration, "ProjectId") VALUES 
        ('Dependency Update Bot', 'module_update', '{"modules": ["package.json"], "autoMerge": false, "createPR": true}', 
         (SELECT id FROM "Projects" WHERE name = 'Sample Project' LIMIT 1))
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "Users" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON "Teams" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON "Projects" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bots_updated_at BEFORE UPDATE ON "Bots" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bot_runs_updated_at BEFORE UPDATE ON "BotRuns" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_git_branches_updated_at BEFORE UPDATE ON "GitBranches" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_module_updates_updated_at BEFORE UPDATE ON "ModuleUpdates" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_teams_updated_at BEFORE UPDATE ON "UserTeams" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- USAGE INSTRUCTIONS
-- ========================================

-- FOR FRESH DATABASE SETUP:
-- 1. Uncomment the "FRESH START" section above (lines 10-26)
-- 2. Run the entire script
-- 3. Comment out the "FRESH START" section again

-- FOR EXISTING DATABASE:
-- 1. Keep the "FRESH START" section commented out
-- 2. Run the entire script
-- 3. Tables will be created if they don't exist

-- FOR RESET WITHOUT DROPPING:
-- Use this instead of the FRESH START section:
/*
TRUNCATE TABLE "UserTeams" CASCADE;
TRUNCATE TABLE "ModuleUpdates" CASCADE;
TRUNCATE TABLE "GitBranches" CASCADE;
TRUNCATE TABLE "BotRuns" CASCADE;
TRUNCATE TABLE "Bots" CASCADE;
TRUNCATE TABLE "Projects" CASCADE;
TRUNCATE TABLE "Teams" CASCADE;
TRUNCATE TABLE "Users" CASCADE;
*/

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if all tables exist:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('Users', 'Teams', 'Projects', 'Bots', 'BotRuns', 'GitBranches', 'ModuleUpdates', 'UserTeams')
ORDER BY table_name;

-- Check if all indexes exist:
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY indexname;