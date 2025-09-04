# AutoBot Manager 🤖

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-12+-blue.svg)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

> A complete SaaS platform for automated git repository management and code updates.

## 🚀 Quick Deploy

### Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/new?template=https://github.com/yourusername/autobot-manager)

### Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy/schema-new?template=https://github.com/yourusername/autobot-manager)

### Deploy to Heroku
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/yourusername/autobot-manager)

### Deploy to Vercel
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/autobot-manager)

### Deploy to DigitalOcean App Platform
[![Deploy to DigitalOcean](https://www.deploytodo.com/do-btn-blue.svg)](https://cloud.digitalocean.com/apps/new?repo=https://github.com/yourusername/autobot-manager)

## ✨ Features

### 🤖 Core Bot System
- **Bot Spawner**: Automated worker creation and management
- **Git Integration**: Real branch creation and management
- **Module Updates**: Automated file generation and updates
- **Progress Tracking**: Real-time status monitoring
- **Multi-bot Processing**: Parallel bot execution
- **Git Operations**: Automated commits and pushes

### 🚀 SaaS Features
- **User Authentication**: JWT-based auth with role management
- **Project Management**: Repository connection and configuration
- **Real-time Updates**: WebSocket integration for live status
- **Dashboard**: Analytics and activity monitoring
- **Team Collaboration**: Multi-user support with permissions
- **API Integration**: RESTful API with comprehensive endpoints

### 🛠 Technical Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.io
- **Database**: PostgreSQL + Sequelize ORM
- **Authentication**: JWT + bcrypt
- **Real-time**: Socket.io for live updates
- **Charts**: Recharts for data visualization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/autobot-manager.git
cd autobot-manager
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autobot_manager
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-secret-key

# Server
PORT=3001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

4. **Set up the database**
```bash
# Create database
createdb autobot_manager

# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

5. **Start the development servers**

Terminal 1 - Backend:
```bash
npm run server:dev
```

Terminal 2 - Frontend:
```bash
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- API Health Check: http://localhost:3001/api/health

## 🐳 Docker Deployment

### Quick Docker Setup
```bash
# Using Docker Compose (Recommended)
docker-compose up -d

# Or build manually
docker build -t autobot-manager .
docker run -p 3001:3001 -p 5173:5173 autobot-manager
```

### Docker Compose with PostgreSQL
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List user projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Bots
- `GET /api/bots` - List user bots
- `POST /api/bots` - Create new bot
- `GET /api/bots/:id` - Get bot details
- `PUT /api/bots/:id` - Update bot
- `DELETE /api/bots/:id` - Delete bot
- `POST /api/bots/:id/start` - Start bot
- `POST /api/bots/:id/stop` - Stop bot

### Real-time Events
- `bot:status` - Bot status updates
- `bot:log` - Bot execution logs
- `project:update` - Project updates

## 🤖 Bot Types

### Module Update Bot
- Updates package.json dependencies
- Creates feature branches
- Commits and pushes changes
- Tracks update history

### Dependency Update Bot
- Scans for outdated dependencies
- Updates to latest versions
- Runs compatibility checks

### Security Scan Bot
- Scans for security vulnerabilities
- Generates security reports
- Suggests fixes

### Custom Bot
- User-defined automation workflows
- Custom scripts and logic
- Flexible configuration

## 📁 Project Structure

```
├── src/                    # Frontend React app
│   ├── components/         # Reusable components
│   ├── contexts/          # React contexts
│   ├── pages/             # Page components
│   └── utils/             # Frontend utilities
├── server/                # Backend Node.js app
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Express middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Backend utilities
├── public/                 # Static assets
└── docs/                  # Documentation
```

## 🛠 Development

### Available Scripts
- `npm run dev` - Start frontend development server
- `npm run server:dev` - Start backend development server
- `npm run build` - Build frontend for production
- `npm run server` - Start production backend server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run test` - Run tests
- `npm run lint` - Run ESLint

### Database Migrations
```bash
# Create new migration
npm run db:migrate:create -- --name migration_name

# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo
```

## 🌐 Deployment Options

### Railway Deployment
1. Click the "Deploy on Railway" button above
2. Connect your GitHub repository
3. Add environment variables
4. Deploy!

### Render Deployment
1. Click the "Deploy to Render" button above
2. Connect your GitHub repository
3. Configure build settings
4. Deploy!

### Heroku Deployment
1. Click the "Deploy to Heroku" button above
2. Connect your GitHub repository
3. Add PostgreSQL addon
4. Deploy!

### Vercel Deployment
1. Click the "Deploy with Vercel" button above
2. Import your GitHub repository
3. Configure environment variables
4. Deploy!

### DigitalOcean App Platform
1. Click the "Deploy to DigitalOcean" button above
2. Connect your GitHub repository
3. Configure app settings
4. Deploy!

## 🔧 Environment Variables for Production

```env
NODE_ENV=production
DB_HOST=your-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-very-secure-secret
FRONTEND_URL=https://your-domain.com
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help
- 📖 [Documentation](https://github.com/yourusername/autobot-manager/wiki)
- 🐛 [Report a Bug](https://github.com/yourusername/autobot-manager/issues)
- 💡 [Request a Feature](https://github.com/yourusername/autobot-manager/issues)
- 💬 [Discussions](https://github.com/yourusername/autobot-manager/discussions)

### Community
- [Discord Server](https://discord.gg/autobot-manager)
- [Twitter](https://twitter.com/autobotmanager)
- [Blog](https://blog.autobotmanager.com)

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by the need for better development automation
- Thanks to all contributors and the open-source community

---

<div align="center">

**AutoBot Manager** - Automating your development workflow with intelligent bots 🤖

[![GitHub stars](https://img.shields.io/github/stars/yourusername/autobot-manager?style=social)](https://github.com/yourusername/autobot-manager)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/autobot-manager?style=social)](https://github.com/yourusername/autobot-manager)
[![GitHub issues](https://img.shields.io/github/issues/yourusername/autobot-manager)](https://github.com/yourusername/autobot-manager/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/autobot-manager)](https://github.com/yourusername/autobot-manager/pulls)

</div>