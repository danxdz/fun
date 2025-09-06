-- AutoBot Manager Clean Database Setup for Supabase
-- This will DROP existing tables and recreate them fresh
-- Run this SQL in your Supabase SQL Editor

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS "ModuleUpdates" CASCADE;
DROP TABLE IF EXISTS "GitBranches" CASCADE;
DROP TABLE IF EXISTS "BotRuns" CASCADE;
DROP TABLE IF EXISTS "Bots" CASCADE;
DROP TABLE IF EXISTS "Projects" CASCADE;
DROP TABLE IF EXISTS "UserTeams" CASCADE;
DROP TABLE IF EXISTS "Teams" CASCADE;
DROP TABLE IF EXISTS "Users" CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Users table (compatible with Supabase Auth)
CREATE TABLE "Users" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    "firstName" VARCHAR(255) DEFAULT '',
    "lastName" VARCHAR(255) DEFAULT '',
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    "isActive" BOOLEAN DEFAULT true,
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Teams table
CREATE TABLE "Teams" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Projects table
CREATE TABLE "Projects" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "repositoryUrl" VARCHAR(255) NOT NULL,
    "repositoryType" VARCHAR(20) DEFAULT 'github' CHECK ("repositoryType" IN ('github', 'gitlab', 'bitbucket')),
    "accessToken" VARCHAR(255) NOT NULL,
    "defaultBranch" VARCHAR(255) DEFAULT 'main',
    "isActive" BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    "UserId" UUID REFERENCES "Users"(id) ON DELETE CASCADE,
    "TeamId" UUID REFERENCES "Teams"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Bots table
CREATE TABLE "Bots" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) DEFAULT 'module_update' CHECK (type IN ('module_update', 'dependency_update', 'security_scan', 'custom')),
    status VARCHAR(20) DEFAULT 'idle' CHECK (status IN ('idle', 'running', 'completed', 'failed', 'stopped')),
    configuration JSONB DEFAULT '{}',
    schedule VARCHAR(255), -- cron expression
    "lastRun" TIMESTAMP WITH TIME ZONE,
    "nextRun" TIMESTAMP WITH TIME ZONE,
    "isActive" BOOLEAN DEFAULT true,
    "ProjectId" UUID REFERENCES "Projects"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create BotRuns table
CREATE TABLE "BotRuns" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
    "startTime" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endTime" TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in milliseconds
    logs JSONB DEFAULT '[]',
    results JSONB DEFAULT '{}',
    error TEXT,
    "BotId" UUID REFERENCES "Bots"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create GitBranches table
CREATE TABLE "GitBranches" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    "commitHash" VARCHAR(255),
    "commitMessage" TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "ProjectId" UUID REFERENCES "Projects"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ModuleUpdates table
CREATE TABLE "ModuleUpdates" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "moduleName" VARCHAR(255) NOT NULL,
    "currentVersion" VARCHAR(255),
    "targetVersion" VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    changes JSONB DEFAULT '{}',
    "ProjectId" UUID REFERENCES "Projects"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UserTeams junction table
CREATE TABLE "UserTeams" (
    "UserId" UUID REFERENCES "Users"(id) ON DELETE CASCADE,
    "TeamId" UUID REFERENCES "Teams"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY ("UserId", "TeamId")
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_projects_user_id ON "Projects"("UserId");
CREATE INDEX idx_projects_team_id ON "Projects"("TeamId");
CREATE INDEX idx_bots_project_id ON "Bots"("ProjectId");
CREATE INDEX idx_bot_runs_bot_id ON "BotRuns"("BotId");
CREATE INDEX idx_git_branches_project_id ON "GitBranches"("ProjectId");
CREATE INDEX idx_module_updates_project_id ON "ModuleUpdates"("ProjectId");

-- Enable Row Level Security (RLS)
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BotRuns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GitBranches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ModuleUpdates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserTeams" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic - users can only see their own data)
CREATE POLICY "Users can view own profile" ON "Users" FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON "Users" FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own projects" ON "Projects" FOR SELECT USING ("UserId"::text = auth.uid()::text);
CREATE POLICY "Users can create own projects" ON "Projects" FOR INSERT WITH CHECK ("UserId"::text = auth.uid()::text);
CREATE POLICY "Users can update own projects" ON "Projects" FOR UPDATE USING ("UserId"::text = auth.uid()::text);
CREATE POLICY "Users can delete own projects" ON "Projects" FOR DELETE USING ("UserId"::text = auth.uid()::text);

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

-- Insert sample data (no password field - handled by Supabase Auth)
INSERT INTO "Users" (email, "firstName", "lastName", role) VALUES 
('admin@autobot.com', 'Admin', 'User', 'admin')
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