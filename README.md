# 🤖 AutoBot Manager

A comprehensive SaaS platform for managing AI automation bots, projects, and teams with GitHub integration.

## ✨ Features

- 🔐 **GitHub OAuth Authentication** - Real GitHub tokens for repository management
- 📁 **Project Management** - Create and import GitHub repositories
- 🤖 **Bot Management** - Create, configure, and manage AI automation bots
- 👥 **Team Collaboration** - Organize projects and bots in teams
- 📊 **Dashboard Analytics** - Monitor bot performance and project statistics
- 🎨 **Modern UI** - Built with React, Tailwind CSS, and Vite
- 🚀 **Production Ready** - Deployed on Railway with Docker

## 🚀 Quick Deploy

### Railway (Recommended)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### Other Platforms

[![Deploy on Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy on Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

## 🛠️ Local Development

### Prerequisites

- Node.js 20+
- npm or yarn
- Supabase account
- GitHub OAuth App

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/autobot-manager.git
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
   
   Fill in your environment variables:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # GitHub OAuth
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   
   # JWT
   JWT_SECRET=your_jwt_secret
   
   # Server
   PORT=3001
   NODE_ENV=development
   ```

4. **Set up Supabase database**
   ```bash
   # Run the SQL script in Supabase SQL Editor
   cat supabase-clean-setup.sql
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:3001
   ```

## 🔧 GitHub OAuth Setup

1. **Go to GitHub Settings** → Developer settings → OAuth Apps
2. **Create a new OAuth App** with these settings:
   - **Application name**: `AutoBot Manager`
   - **Homepage URL**: `https://your-domain.com`
   - **Authorization callback URL**: `https://your-domain.com/auth/callback`
3. **Copy the Client ID and Client Secret** to your environment variables

## 📦 Production Deployment

### Railway

1. **Connect your GitHub repository** to Railway
2. **Add environment variables** in Railway dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `JWT_SECRET`
3. **Deploy automatically** on every push to main

### Docker

```bash
# Build the image
docker build -t autobot-manager .

# Run the container
docker run -p 3001:3001 \
  -e SUPABASE_URL=your_supabase_url \
  -e SUPABASE_ANON_KEY=your_supabase_anon_key \
  -e SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key \
  -e GITHUB_CLIENT_ID=your_github_client_id \
  -e GITHUB_CLIENT_SECRET=your_github_client_secret \
  -e JWT_SECRET=your_jwt_secret \
  autobot-manager
```

## 🗄️ Database Schema

The application uses Supabase (PostgreSQL) with the following main tables:

- **Users** - User profiles and GitHub integration
- **Projects** - Project management and GitHub repositories
- **Bots** - AI automation bot configurations
- **Teams** - Team collaboration and organization

Run `supabase-clean-setup.sql` in your Supabase SQL Editor to set up the database.

## 🔄 GitHub Actions CI/CD

The repository includes GitHub Actions for automated deployment:

- **Build and Test** - Runs on every pull request
- **Deploy to Railway** - Automatically deploys on push to main
- **Security Scanning** - Scans for vulnerabilities

## 📚 API Documentation

The API is fully documented and available at `/api/docs` when running the application.

### Key Endpoints

- `POST /api/auth/github` - Initiate GitHub OAuth
- `GET /auth/callback` - GitHub OAuth callback
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create new project
- `GET /api/bots` - Get user bots
- `POST /api/bots` - Create new bot

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint

# Fix linting issues
npm run lint:fix
```

## 📁 Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── pages/         # Page components
│   ├── contexts/      # React contexts
│   ├── config/        # Configuration files
│   └── utils/         # Utility functions
├── server/
│   └── minimal.js     # Express server
├── public/            # Static assets
├── dist/              # Build output
└── docs/              # Documentation
```

## 🔒 Security

- **JWT Authentication** - Secure token-based authentication
- **GitHub OAuth** - Secure third-party authentication
- **Row Level Security** - Database-level security with Supabase
- **Input Validation** - Server-side input validation
- **Rate Limiting** - API rate limiting protection

## 🚀 Performance

- **Vite Build System** - Fast development and optimized builds
- **React Query** - Efficient data fetching and caching
- **Docker Optimization** - Multi-stage builds for smaller images
- **CDN Ready** - Static assets optimized for CDN delivery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: Check the `/api/docs` endpoint
- 🐛 **Issues**: Report bugs on GitHub Issues
- 💬 **Discussions**: Join GitHub Discussions for questions
- 📧 **Email**: Contact support@autobotmanager.com

## 🎯 Roadmap

- [ ] **Advanced Bot Templates** - Pre-built bot configurations
- [ ] **Real-time Monitoring** - Live bot execution monitoring
- [ ] **Team Permissions** - Granular team access control
- [ ] **API Rate Limiting** - Advanced rate limiting strategies
- [ ] **Multi-cloud Support** - Deploy to multiple cloud providers
- [ ] **Mobile App** - React Native mobile application

---

**Built with ❤️ by the AutoBot Manager Team**# Force redeploy Sat Sep  6 06:09:09 PM UTC 2025
