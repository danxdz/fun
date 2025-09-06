# 🚀 Deployment Guide

This guide covers deploying AutoBot Manager to various platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Supabase Project** - Database and authentication
2. **GitHub OAuth App** - For GitHub integration
3. **Domain/Subdomain** - For your application

## 🏗️ Platform-Specific Deployment

### Railway (Recommended)

Railway provides the easiest deployment experience with automatic builds and deployments.

#### Setup Steps:

1. **Connect Repository**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

2. **Configure Environment Variables**
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   JWT_SECRET=your_jwt_secret
   NODE_ENV=production
   ```

3. **Deploy**
   - Railway will automatically build and deploy
   - Your app will be available at `https://your-app-name.up.railway.app`

4. **Configure Custom Domain** (Optional)
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

### Render

Render offers a free tier with automatic deployments from GitHub.

#### Setup Steps:

1. **Connect Repository**
   - Go to [Render](https://render.com)
   - Click "New" → "Web Service"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```
   Build Command: npm run build
   Start Command: npm run start
   ```

3. **Add Environment Variables**
   - Same as Railway configuration above

4. **Deploy**
   - Render will build and deploy automatically
   - Your app will be available at `https://your-app-name.onrender.com`

### Heroku

Heroku provides a robust platform with extensive add-ons.

#### Setup Steps:

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

3. **Configure Environment Variables**
   ```bash
   heroku config:set SUPABASE_URL=your_supabase_url
   heroku config:set SUPABASE_ANON_KEY=your_supabase_anon_key
   heroku config:set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   heroku config:set GITHUB_CLIENT_ID=your_github_client_id
   heroku config:set GITHUB_CLIENT_SECRET=your_github_client_secret
   heroku config:set JWT_SECRET=your_jwt_secret
   heroku config:set NODE_ENV=production
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

### DigitalOcean App Platform

DigitalOcean provides a simple platform for containerized applications.

#### Setup Steps:

1. **Create App**
   - Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
   - Click "Create App"
   - Connect your GitHub repository

2. **Configure App Spec**
   ```yaml
   name: autobot-manager
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/autobot-manager
       branch: main
     run_command: npm run start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: SUPABASE_URL
       value: your_supabase_url
     - key: SUPABASE_ANON_KEY
       value: your_supabase_anon_key
     - key: SUPABASE_SERVICE_ROLE_KEY
       value: your_supabase_service_role_key
     - key: GITHUB_CLIENT_ID
       value: your_github_client_id
     - key: GITHUB_CLIENT_SECRET
       value: your_github_client_secret
     - key: JWT_SECRET
       value: your_jwt_secret
     - key: NODE_ENV
       value: production
   ```

3. **Deploy**
   - Click "Create Resources"
   - DigitalOcean will build and deploy automatically

### Docker Deployment

For self-hosted or VPS deployments using Docker.

#### Setup Steps:

1. **Build Docker Image**
   ```bash
   docker build -t autobot-manager .
   ```

2. **Run Container**
   ```bash
   docker run -d \
     --name autobot-manager \
     -p 3001:3001 \
     -e SUPABASE_URL=your_supabase_url \
     -e SUPABASE_ANON_KEY=your_supabase_anon_key \
     -e SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key \
     -e GITHUB_CLIENT_ID=your_github_client_id \
     -e GITHUB_CLIENT_SECRET=your_github_client_secret \
     -e JWT_SECRET=your_jwt_secret \
     -e NODE_ENV=production \
     autobot-manager
   ```

3. **Docker Compose** (Recommended)
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3001:3001"
       environment:
         - SUPABASE_URL=your_supabase_url
         - SUPABASE_ANON_KEY=your_supabase_anon_key
         - SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
         - GITHUB_CLIENT_ID=your_github_client_id
         - GITHUB_CLIENT_SECRET=your_github_client_secret
         - JWT_SECRET=your_jwt_secret
         - NODE_ENV=production
       restart: unless-stopped
   ```

## 🔧 GitHub Actions Setup

### Railway Deployment

1. **Get Railway Token**
   - Go to Railway Dashboard → Account Settings → Tokens
   - Create a new token
   - Add to GitHub Secrets as `RAILWAY_TOKEN`

2. **Get Service Name**
   - Go to your Railway project
   - Copy the service name
   - Add to GitHub Secrets as `RAILWAY_SERVICE`

3. **Enable GitHub Actions**
   - The workflow is already configured in `.github/workflows/deploy.yml`
   - Push to main branch to trigger deployment

### Other Platforms

Similar setup for other platforms:

- **Render**: Use Render's GitHub integration
- **Heroku**: Use Heroku GitHub integration
- **DigitalOcean**: Use DigitalOcean GitHub integration

## 🗄️ Database Setup

### Supabase Setup

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Note down your project URL and API keys

2. **Run Database Schema**
   - Go to SQL Editor in Supabase
   - Copy and paste the contents of `supabase-clean-setup.sql`
   - Execute the script

3. **Configure Authentication**
   - Go to Authentication → Settings
   - Enable GitHub provider
   - Add your GitHub OAuth app credentials

## 🔐 Security Considerations

### Environment Variables

- **Never commit** `.env` files to version control
- **Use strong secrets** for JWT_SECRET (32+ characters)
- **Rotate secrets** regularly in production
- **Use different secrets** for different environments

### GitHub OAuth

- **Use HTTPS** for all callback URLs
- **Set appropriate scopes** (repo, public_repo, user:email)
- **Regularly review** OAuth app permissions

### Database Security

- **Enable Row Level Security** (RLS) in Supabase
- **Use service role key** only for server-side operations
- **Regularly backup** your database

## 📊 Monitoring and Logging

### Health Checks

The application includes health check endpoints:

- `GET /api/health` - Basic health check
- `GET /api/debug/system` - Comprehensive system status

### Logging

- **Application logs** are available in platform dashboards
- **Error tracking** can be integrated with services like Sentry
- **Performance monitoring** with services like New Relic

## 🚨 Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Check variable names are correct
   - Ensure no extra spaces or quotes
   - Restart the application after changes

2. **GitHub OAuth Issues**
   - Verify callback URL matches exactly
   - Check GitHub OAuth app is active
   - Ensure correct scopes are requested

3. **Database Connection Issues**
   - Verify Supabase URL and keys
   - Check database is accessible
   - Ensure RLS policies are correct

4. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

### Getting Help

- Check the application logs in your platform dashboard
- Use the `/api/debug/system` endpoint for system status
- Open an issue on GitHub with detailed error information

## 🔄 CI/CD Best Practices

### Branch Strategy

- **main** - Production deployments
- **develop** - Development deployments
- **feature/*** - Feature branches

### Deployment Pipeline

1. **Code Push** → Trigger CI/CD
2. **Run Tests** → Ensure code quality
3. **Build Application** → Create production build
4. **Deploy to Staging** → Test in staging environment
5. **Deploy to Production** → Deploy to production
6. **Health Check** → Verify deployment success

### Rollback Strategy

- Keep previous deployments available
- Use platform-specific rollback features
- Have database migration rollback scripts ready
- Monitor application health after deployment

---

**Need help?** Check the [README](README.md) or open an issue on GitHub.