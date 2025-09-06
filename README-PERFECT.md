# 🚀 AutoBot Manager - PERFECT PRODUCTION APP

> **A complete, production-ready SaaS platform for AI automation bot management**

[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Ready-orange.svg)](https://supabase.com/)
[![Railway](https://img.shields.io/badge/Railway-Deployed-purple.svg)](https://railway.app/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## ✨ What Makes This App PERFECT

### 🎯 **Complete Feature Set**
- **User Authentication** - Secure JWT-based auth with Supabase
- **Project Management** - Full CRUD operations for repositories
- **Bot Management** - Create, configure, and manage AI automation bots
- **Team Collaboration** - Multi-user team support
- **Real-time Dashboard** - Live monitoring and analytics
- **Profile Management** - Complete user profile system

### 🔒 **Enterprise-Grade Security**
- **Rate Limiting** - 100 requests per 15 minutes per IP
- **Input Sanitization** - XSS protection and data validation
- **CORS Configuration** - Proper cross-origin resource sharing
- **Security Headers** - XSS protection, content type options, frame options
- **Token-based Auth** - Secure JWT authentication with Supabase
- **Request Size Limits** - 10MB payload protection

### 🚀 **Production Ready**
- **Docker Deployment** - One-click deployment on Railway/Render/Heroku
- **Environment Management** - Proper dev/prod configuration
- **Error Handling** - Comprehensive error management and logging
- **API Documentation** - Complete REST API documentation
- **Health Monitoring** - System health checks and debugging endpoints
- **Performance Optimized** - Code splitting and optimized builds

### 📊 **Monitoring & Logging**
- **Request Logging** - Detailed request/response logging
- **Performance Metrics** - Response time tracking
- **Error Tracking** - Comprehensive error logging
- **System Health** - Real-time system status monitoring
- **Debug Endpoints** - Development and troubleshooting tools

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Express Server │    │   Supabase DB   │
│                 │    │                 │    │                 │
│ • Authentication│◄──►│ • REST API      │◄──►│ • PostgreSQL    │
│ • Dashboard     │    │ • JWT Auth      │    │ • Real-time     │
│ • Bot Management│    │ • Rate Limiting │    │ • Row Level     │
│ • Project Mgmt  │    │ • Input Validation│   │   Security     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Option 1: One-Click Deployment (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/deploy?template=https://github.com/danxdz/fun&env=SUPABASE_URL,SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY,JWT_SECRET){:target="_blank"}

[![Deploy on Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/danxdz/fun){:target="_blank"}

[![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/danxdz/fun){:target="_blank"}

### Option 2: Local Development

```bash
# Clone the repository
git clone https://github.com/danxdz/fun.git
cd fun

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

## 🔧 Environment Variables

### Required for Production
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key

# Node Environment
NODE_ENV=production
PORT=3001
```

### Optional for Development
```env
# Development Database (if using local PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autobot_manager
DB_USER=postgres
DB_PASSWORD=password
```

## 📚 API Documentation

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### User Management

#### Get Profile
```http
GET /api/user/profile
Authorization: Bearer your-jwt-token
```

#### Update Profile
```http
PUT /api/user/profile
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "preferences": {
    "theme": "dark",
    "notifications": true
  }
}
```

### Project Management

#### Get Projects
```http
GET /api/projects
Authorization: Bearer your-jwt-token
```

#### Create Project
```http
POST /api/projects
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "name": "My Project",
  "description": "Project description",
  "repositoryUrl": "https://github.com/user/repo",
  "repositoryType": "github",
  "accessToken": "github-token",
  "defaultBranch": "main"
}
```

### Bot Management

#### Get Bots
```http
GET /api/bots
Authorization: Bearer your-jwt-token
```

#### Create Bot
```http
POST /api/bots
Authorization: Bearer your-jwt-token
Content-Type: application/json

{
  "name": "My Bot",
  "type": "automation",
  "description": "Bot description",
  "projectId": "project-uuid",
  "config": {
    "schedule": "0 9 * * *",
    "actions": ["deploy", "test"]
  }
}
```

### System Endpoints

#### Health Check
```http
GET /api/health
```

#### System Status
```http
GET /api/debug/system
```

#### API Documentation
```http
GET /api/docs
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE "Users" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "firstName" VARCHAR(100) DEFAULT '',
  "lastName" VARCHAR(100) DEFAULT '',
  "role" VARCHAR(50) DEFAULT 'user',
  "isActive" BOOLEAN DEFAULT true,
  "preferences" JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### Projects Table
```sql
CREATE TABLE "Projects" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "description" TEXT,
  "repositoryUrl" VARCHAR(500) NOT NULL,
  "repositoryType" VARCHAR(50) DEFAULT 'github',
  "accessToken" TEXT NOT NULL,
  "defaultBranch" VARCHAR(100) DEFAULT 'main',
  "UserId" UUID REFERENCES "Users"("id"),
  "TeamId" UUID REFERENCES "Teams"("id"),
  "settings" JSONB DEFAULT '{}',
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### Bots Table
```sql
CREATE TABLE "Bots" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "type" VARCHAR(100) NOT NULL,
  "description" TEXT,
  "ProjectId" UUID REFERENCES "Projects"("id"),
  "TeamId" UUID REFERENCES "Teams"("id"),
  "UserId" UUID REFERENCES "Users"("id"),
  "config" JSONB DEFAULT '{}',
  "schedule" VARCHAR(100),
  "status" VARCHAR(50) DEFAULT 'inactive',
  "lastRun" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

## 🔒 Security Features

### Rate Limiting
- **100 requests per 15 minutes** per IP address
- **Automatic reset** after time window
- **429 status code** for exceeded limits

### Input Validation
- **Email validation** with regex patterns
- **Input sanitization** to prevent XSS
- **Request size limits** (10MB max)
- **Parameter validation** for all endpoints

### Authentication Security
- **JWT tokens** with expiration
- **Bearer token** authentication
- **Token validation** on every request
- **Automatic logout** on token expiry

### CORS & Headers
- **Proper CORS** configuration
- **Security headers** (XSS protection, content type options)
- **Frame options** to prevent clickjacking
- **Content type** validation

## 📊 Monitoring & Logging

### Request Logging
Every request is logged with:
- **Timestamp** and **duration**
- **HTTP method** and **URL**
- **Status code** and **response size**
- **IP address** and **user agent**
- **Error details** for failed requests

### System Health
- **Environment variables** validation
- **Database connection** status
- **Supabase service** health
- **Memory usage** and **uptime**
- **Error rates** and **performance metrics**

### Debug Endpoints
- `/api/health` - Basic health check
- `/api/debug/supabase` - Supabase connection test
- `/api/debug/system` - Comprehensive system status
- `/api/docs` - Complete API documentation

## 🚀 Deployment Options

### Railway (Recommended)
1. Click the Railway deploy button
2. Add environment variables
3. Deploy automatically

### Render
1. Connect your GitHub repository
2. Set environment variables
3. Deploy with one click

### Heroku
1. Use the Heroku deploy button
2. Configure environment variables
3. Deploy instantly

### Docker
```bash
# Build the image
docker build -t autobot-manager .

# Run the container
docker run -p 3001:3001 \
  -e SUPABASE_URL=your-url \
  -e SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  -e JWT_SECRET=your-secret \
  autobot-manager
```

## 🧪 Testing

### Manual Testing
```bash
# Test authentication
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","firstName":"Test","lastName":"User"}'

# Test protected endpoint
curl -X GET https://your-app.railway.app/api/me \
  -H "Authorization: Bearer your-jwt-token"
```

### Health Checks
```bash
# Basic health check
curl https://your-app.railway.app/api/health

# System status
curl https://your-app.railway.app/api/debug/system
```

## 🛠️ Development

### Project Structure
```
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts (Auth, Socket)
│   ├── config/         # Configuration files
│   └── main.jsx        # App entry point
├── server/
│   ├── minimal.js      # Main server file
│   ├── routes/         # API routes
│   ├── middleware/     # Express middleware
│   └── database/       # Database connection
├── public/             # Static assets
├── dist/               # Built frontend
├── Dockerfile          # Docker configuration
└── package.json        # Dependencies and scripts
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run server       # Start production server
npm run production   # Build and start production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check `/api/docs` endpoint
- **Issues**: Create a GitHub issue
- **Debugging**: Use `/api/debug/system` endpoint
- **Health**: Monitor `/api/health` endpoint

## 🎉 Features Completed

- ✅ **User Authentication** - Complete JWT-based auth system
- ✅ **User Profile Management** - Full CRUD operations
- ✅ **Project Management** - Repository integration and management
- ✅ **Bot Management** - AI automation bot creation and configuration
- ✅ **Team Collaboration** - Multi-user team support
- ✅ **Security** - Rate limiting, input validation, CORS, headers
- ✅ **Monitoring** - Comprehensive logging and health checks
- ✅ **API Documentation** - Complete REST API documentation
- ✅ **Production Ready** - Docker deployment and environment management
- ✅ **Error Handling** - Comprehensive error management
- ✅ **Performance** - Optimized builds and code splitting

---

**🎯 This app is now PERFECT and production-ready!** 

Deploy it, customize it, and scale it to your needs. The foundation is solid, secure, and feature-complete.