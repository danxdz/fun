# AutoBot Manager

A complete SaaS platform for automated git repository management and code updates.

## Features

### ✅ Core Bot System
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

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 12+
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
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

## API Documentation

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

## Bot Types

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

## Project Structure

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

## Development

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

## Deployment

### Docker Deployment
```bash
# Build image
docker build -t autobot-manager .

# Run container
docker run -p 3001:3001 -p 5173:5173 autobot-manager
```

### Environment Variables for Production
```env
NODE_ENV=production
DB_HOST=your-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-very-secure-secret
FRONTEND_URL=https://your-domain.com
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

**AutoBot Manager** - Automating your development workflow with intelligent bots.