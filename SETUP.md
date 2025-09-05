# AutoBot Manager Setup Guide

## 🚀 Quick Start with Real Database

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (usually takes 1-2 minutes)
3. Go to **Settings > API** in your Supabase dashboard

### 2. Get Your Credentials

Copy these values from your Supabase project:
- **Project URL** (looks like: `https://your-project.supabase.co`)
- **Anon Key** (starts with `eyJ...`)

### 3. Set Environment Variables

In your Vercel deployment:

1. Go to your Vercel project dashboard
2. Click **Settings > Environment Variables**
3. Add these variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
FRONTEND_URL=https://your-app.vercel.app
```

### 4. Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `database/schema.sql`
3. Paste and run the SQL script
4. This will create all the necessary tables and relationships

### 5. Redeploy

After setting the environment variables, redeploy your Vercel app:
- Go to **Deployments** in Vercel
- Click **Redeploy** on the latest deployment

## 🎉 You're Done!

Now your AutoBot Manager will have:
- ✅ **Real user authentication** with password hashing
- ✅ **Persistent data storage** in PostgreSQL
- ✅ **Real projects and bots** that you can create and manage
- ✅ **Team collaboration** features
- ✅ **Activity logging** and analytics

## 🔧 Development Setup

For local development:

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials
3. Run `npm run dev` to start the development server

## 📊 Database Schema

The app includes these main tables:
- **users** - User accounts and authentication
- **teams** - Team/organization management
- **projects** - Git repository projects
- **bots** - Automation bots
- **bot_runs** - Bot execution history
- **activity_logs** - User activity tracking

## 🚀 Next Steps

Once you have the database set up, you can:
1. **Register real users** - Create actual accounts
2. **Add real projects** - Connect to your GitHub repositories
3. **Create automation bots** - Set up real git automation
4. **Invite team members** - Collaborate with your team

Happy automating! 🤖✨