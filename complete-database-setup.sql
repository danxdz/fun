-- Complete Database Setup for Autobot Manager
-- This script ensures all required tables and columns exist

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate Users table with all required columns
DROP TABLE IF EXISTS "Users" CASCADE;
CREATE TABLE "Users" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    "firstName" VARCHAR(255) DEFAULT '',
    "lastName" VARCHAR(255) DEFAULT '',
    "githubUsername" VARCHAR(255) DEFAULT '',
    "githubAvatar" TEXT DEFAULT '',
    "cursorApiKey" TEXT DEFAULT '',
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
    "isActive" BOOLEAN DEFAULT true,
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Teams table
DROP TABLE IF EXISTS "Teams" CASCADE;
CREATE TABLE "Teams" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Projects table
DROP TABLE IF EXISTS "Projects" CASCADE;
CREATE TABLE "Projects" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    "repositoryUrl" TEXT DEFAULT '',
    "repositoryType" VARCHAR(50) DEFAULT 'github',
    "accessToken" TEXT DEFAULT '',
    "UserId" UUID REFERENCES "Users"(id) ON DELETE CASCADE,
    "TeamId" UUID REFERENCES "Teams"(id) ON DELETE SET NULL,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Bots table
DROP TABLE IF EXISTS "Bots" CASCADE;
CREATE TABLE "Bots" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    type VARCHAR(50) DEFAULT 'automation',
    status VARCHAR(20) DEFAULT 'stopped',
    config JSONB DEFAULT '{}',
    "ProjectId" UUID REFERENCES "Projects"(id) ON DELETE CASCADE,
    "isActive" BOOLEAN DEFAULT true,
    "lastRun" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create BotRuns table
DROP TABLE IF EXISTS "BotRuns" CASCADE;
CREATE TABLE "BotRuns" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "BotId" UUID REFERENCES "Bots"(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'running',
    "startTime" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "endTime" TIMESTAMP WITH TIME ZONE,
    "output" TEXT DEFAULT '',
    "errorMessage" TEXT DEFAULT '',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create UserTeams table (many-to-many relationship)
DROP TABLE IF EXISTS "UserTeams" CASCADE;
CREATE TABLE "UserTeams" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "UserId" UUID REFERENCES "Users"(id) ON DELETE CASCADE,
    "TeamId" UUID REFERENCES "Teams"(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    "joinedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE("UserId", "TeamId")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "Users"(email);
CREATE INDEX IF NOT EXISTS "idx_projects_user_id" ON "Projects"("UserId");
CREATE INDEX IF NOT EXISTS "idx_bots_project_id" ON "Bots"("ProjectId");
CREATE INDEX IF NOT EXISTS "idx_bot_runs_bot_id" ON "BotRuns"("BotId");
CREATE INDEX IF NOT EXISTS "idx_user_teams_user_id" ON "UserTeams"("UserId");
CREATE INDEX IF NOT EXISTS "idx_user_teams_team_id" ON "UserTeams"("TeamId");

-- Enable Row Level Security (RLS)
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BotRuns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserTeams" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and modify their own data
CREATE POLICY "Users can view own profile" ON "Users" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON "Users" FOR UPDATE USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON "Projects" FOR SELECT USING (auth.uid() = "UserId");
CREATE POLICY "Users can create own projects" ON "Projects" FOR INSERT WITH CHECK (auth.uid() = "UserId");
CREATE POLICY "Users can update own projects" ON "Projects" FOR UPDATE USING (auth.uid() = "UserId");
CREATE POLICY "Users can delete own projects" ON "Projects" FOR DELETE USING (auth.uid() = "UserId");

-- Bots policies (through projects)
CREATE POLICY "Users can view bots in own projects" ON "Bots" FOR SELECT USING (
    EXISTS (SELECT 1 FROM "Projects" WHERE "Projects".id = "Bots"."ProjectId" AND "Projects"."UserId" = auth.uid())
);
CREATE POLICY "Users can create bots in own projects" ON "Bots" FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM "Projects" WHERE "Projects".id = "Bots"."ProjectId" AND "Projects"."UserId" = auth.uid())
);
CREATE POLICY "Users can update bots in own projects" ON "Bots" FOR UPDATE USING (
    EXISTS (SELECT 1 FROM "Projects" WHERE "Projects".id = "Bots"."ProjectId" AND "Projects"."UserId" = auth.uid())
);
CREATE POLICY "Users can delete bots in own projects" ON "Bots" FOR DELETE USING (
    EXISTS (SELECT 1 FROM "Projects" WHERE "Projects".id = "Bots"."ProjectId" AND "Projects"."UserId" = auth.uid())
);

-- BotRuns policies (through bots)
CREATE POLICY "Users can view bot runs in own projects" ON "BotRuns" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "Bots" 
        JOIN "Projects" ON "Projects".id = "Bots"."ProjectId" 
        WHERE "Bots".id = "BotRuns"."BotId" AND "Projects"."UserId" = auth.uid()
    )
);
CREATE POLICY "Users can create bot runs in own projects" ON "BotRuns" FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM "Bots" 
        JOIN "Projects" ON "Projects".id = "Bots"."ProjectId" 
        WHERE "Bots".id = "BotRuns"."BotId" AND "Projects"."UserId" = auth.uid()
    )
);

-- Teams policies
CREATE POLICY "Users can view teams they belong to" ON "Teams" FOR SELECT USING (
    EXISTS (SELECT 1 FROM "UserTeams" WHERE "UserTeams"."TeamId" = "Teams".id AND "UserTeams"."UserId" = auth.uid())
);

-- UserTeams policies
CREATE POLICY "Users can view own team memberships" ON "UserTeams" FOR SELECT USING (auth.uid() = "UserId");

-- Insert sample data (optional)
INSERT INTO "Teams" (id, name, description) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Default Team', 'Default team for all users')
ON CONFLICT (id) DO NOTHING;

-- Verify the setup
SELECT 'Database setup completed successfully!' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('Users', 'Teams', 'Projects', 'Bots', 'BotRuns', 'UserTeams')
ORDER BY table_name, ordinal_position;