# AutoBot Manager

A modern web application for automated Git repository management with bot automation, project tracking, and GitHub integration.

## 🚀 Features

- **GitHub OAuth Integration** - Secure login with GitHub
- **Project Management** - Create and import GitHub repositories
- **Bot Automation** - Automated tasks for your repositories
- **Real-time Dashboard** - Monitor projects and bot activity
- **Secure Data Storage** - Encrypted sensitive data (tokens, API keys)

## 🛠 Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Custom JWT + GitHub OAuth
- **Deployment**: Railway

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- Supabase account
- GitHub OAuth App

### Environment Variables
```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Security
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_32_character_encryption_key

# Server
NODE_ENV=production
PORT=3001
```

### Setup

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd autobot-manager
   npm install
   ```

2. **Database setup**
   ```bash
   # Run the schema.sql in your Supabase SQL editor
   # This creates all tables and indexes
   ```

3. **Start development**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 🗄 Database

The `database/schema.sql` file contains:
- Complete database schema
- Fresh start instructions
- Usage guidelines
- Verification queries

## 🔐 Security

- All sensitive data (GitHub tokens, API keys) is encrypted using AES-256-GCM
- Custom JWT authentication
- Row Level Security (RLS) policies
- Secure environment variable handling

## 📦 Deployment

### Railway (Recommended)
1. Connect your GitHub repository
2. Add all environment variables
3. Deploy automatically on push to `main`

### Manual Deployment
1. Build the application: `npm run build`
2. Set environment variables
3. Start the server: `npm start`

## 🎯 API Endpoints

- `GET /api/health` - Health check
- `GET /api/auth/github` - GitHub OAuth
- `GET /auth/callback` - OAuth callback
- `GET /api/me` - Current user
- `GET /api/projects` - User projects
- `POST /api/projects` - Create/import project
- `GET /api/bots` - User bots
- `POST /api/bots` - Create bot
- `POST /api/bots/:id/execute` - Execute bot

## 🤖 Bot Types

- `module_update` - Check for module updates
- `dependency_update` - Check dependency updates
- `security_scan` - Run security scans
- `custom` - Custom automation scripts

## 📝 License

MIT License - see LICENSE file for details.

## 🆘 Support

For issues and questions, please check the GitHub issues or contact the development team.