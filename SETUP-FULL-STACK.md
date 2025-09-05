# 🖥️ Full Stack Setup Guide

This guide will help you set up AutoBot Manager with a complete backend server for production use.

## 🎯 What You'll Get

- ✅ **Real Authentication** - JWT-based user management
- ✅ **Real Database** - PostgreSQL with Supabase
- ✅ **Real Git Operations** - Actual repository management
- ✅ **Real Bot Execution** - Cursor AI-powered automation
- ✅ **WebSocket Support** - Real-time updates
- ✅ **Production Ready** - Full SaaS functionality

## 🚀 Quick Setup

### Option 1: One-Command Setup (Recommended)
```bash
git clone https://github.com/danxdz/fun.git
cd fun
npm run setup
```

### Option 2: Manual Setup
```bash
# 1. Clone repository
git clone https://github.com/danxdz/fun.git
cd fun

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Set up database
npm run db:migrate
npm run db:seed

# 5. Start development servers
npm run start:dev
```

## 🔧 Environment Configuration

### Required Environment Variables

Create a `.env` file with these variables:

```env
# Database (Supabase)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# JWT Secret
JWT_SECRET=your-very-secure-secret-key

# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# GitHub Integration (Optional)
GITHUB_TOKEN=your-github-token

# Cursor AI Integration (Optional)
CURSOR_API_KEY=your-cursor-api-key
OPENAI_API_KEY=your-openai-api-key
```

### Supabase Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Get your project URL and anon key

2. **Run Database Schema**
   ```bash
   # Copy the schema from database/schema.sql
   # Run it in your Supabase SQL editor
   ```

3. **Update Environment Variables**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

## 🚀 Running the Application

### Development Mode
```bash
# Start both frontend and backend
npm run start:dev

# Or start them separately:
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server:dev
```

### Production Mode
```bash
# Build and start production server
npm run production
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/api/health
- **WebSocket**: ws://localhost:3001

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build
```bash
# Build image
docker build -t autobot-manager .

# Run container
docker run -p 3001:3001 -p 5173:5173 autobot-manager
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check Supabase credentials
   - Ensure database schema is created
   - Verify network connectivity

2. **Authentication Issues**
   - Check JWT_SECRET is set
   - Verify token expiration settings
   - Clear browser localStorage

3. **Bot Execution Errors**
   - Check GitHub token permissions
   - Verify Cursor/OpenAI API keys
   - Check repository access

4. **Port Conflicts**
   - Change PORT in .env
   - Kill existing processes on ports 3001/5173

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm run server:dev
```

## 📊 Monitoring

### Health Checks
- **API Health**: `GET /api/health`
- **Database Health**: Check Supabase dashboard
- **WebSocket Health**: Check browser console

### Logs
- **Server Logs**: Check terminal output
- **Database Logs**: Supabase dashboard
- **Frontend Logs**: Browser console

## 🚀 Production Deployment

### Railway
1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### Render
1. Create new Web Service
2. Connect repository
3. Configure build settings
4. Add environment variables

### Heroku
1. Create new app
2. Connect repository
3. Add PostgreSQL addon
4. Set environment variables

### DigitalOcean App Platform
1. Create new app
2. Connect repository
3. Configure services
4. Set environment variables

## 🎉 Success!

Once everything is running, you'll have:

- ✅ **Full Authentication System**
- ✅ **Real Database Integration**
- ✅ **Working Bot Automation**
- ✅ **Real-time Updates**
- ✅ **Production-Ready SaaS**

**Your AutoBot Manager is now fully operational!** 🚀