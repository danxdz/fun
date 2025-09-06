# Supabase Setup Guide for AutoBot Manager

This guide will help you set up Supabase for the AutoBot Manager application.

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login with your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - **Name**: `autobot-manager` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Your Project Credentials

Once your project is created:

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)
   - **Service Role Key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 3. Set Up Database Tables

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-setup.sql` from this repository
4. Click "Run" to execute the SQL

This will create all necessary tables, indexes, and sample data.

### 4. Configure Environment Variables

For **local development**, create a `.env` file in your project root:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Configuration (for direct PostgreSQL connection)
DB_HOST=db.your-project-id.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password

# JWT Secret (generate a random string)
JWT_SECRET=your-very-secure-random-string-here

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

For **production deployment**, set these environment variables in your hosting platform:

#### Railway
1. Go to your Railway project dashboard
2. Click on your service
3. Go to **Variables** tab
4. Add each environment variable

#### Render
1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add each environment variable

#### Heroku
1. Go to your Heroku app dashboard
2. Go to **Settings** tab
3. Click **Reveal Config Vars**
4. Add each environment variable

### 5. Configure Authentication (Optional)

If you want to use Supabase Auth instead of custom JWT:

1. Go to **Authentication** → **Settings**
2. Configure your site URL:
   - **Site URL**: `https://your-domain.com` (for production)
   - **Site URL**: `http://localhost:5173` (for development)
3. Add redirect URLs:
   - `https://your-domain.com/auth/callback`
   - `http://localhost:5173/auth/callback`

## 🔧 Advanced Configuration

### Row Level Security (RLS)

The setup script automatically enables RLS with basic policies. For production, you may want to customize these policies:

1. Go to **Authentication** → **Policies**
2. Review and modify policies as needed
3. Test policies with different user roles

### Database Functions

You can create custom database functions for complex operations:

```sql
-- Example: Function to get user's projects with team info
CREATE OR REPLACE FUNCTION get_user_projects(user_id UUID)
RETURNS TABLE (
    project_id UUID,
    project_name VARCHAR,
    team_name VARCHAR,
    repository_url VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        t.name,
        p."repositoryUrl"
    FROM "Projects" p
    LEFT JOIN "Teams" t ON p."TeamId" = t.id
    WHERE p."UserId" = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Backup and Recovery

1. **Automatic Backups**: Supabase provides automatic daily backups
2. **Manual Backup**: Go to **Settings** → **Database** → **Backups**
3. **Point-in-time Recovery**: Available for Pro plans and above

## 🚨 Troubleshooting

### Common Issues

#### 1. Connection Errors
- **Error**: `Connection terminated unexpectedly`
- **Solution**: Check your database password and connection string

#### 2. Authentication Errors
- **Error**: `Invalid JWT token`
- **Solution**: Verify your JWT_SECRET matches between frontend and backend

#### 3. RLS Policy Errors
- **Error**: `Row Level Security policy violation`
- **Solution**: Check your RLS policies or temporarily disable RLS for testing

#### 4. Table Not Found
- **Error**: `relation "Users" does not exist`
- **Solution**: Run the `supabase-setup.sql` script again

### Debug Mode

Enable debug logging by setting:
```env
DEBUG=true
LOG_LEVEL=debug
```

### Health Check

Test your Supabase connection:
```bash
curl -X GET "https://your-project-id.supabase.co/rest/v1/" \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key"
```

## 📊 Monitoring

### Supabase Dashboard
- **Database**: Monitor queries, connections, and performance
- **Authentication**: Track user registrations and logins
- **API**: Monitor API usage and rate limits
- **Logs**: View application and database logs

### Key Metrics to Monitor
- Database connections
- Query performance
- Authentication events
- API rate limits
- Storage usage

## 🔒 Security Best Practices

1. **Never commit secrets** to your repository
2. **Use environment variables** for all sensitive data
3. **Enable RLS** for data protection
4. **Regular security updates** of dependencies
5. **Monitor access logs** regularly
6. **Use strong passwords** for database access
7. **Rotate API keys** periodically

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Functions](https://supabase.com/docs/guides/database/functions)

## 🆘 Support

If you encounter issues:

1. Check the [Supabase Status Page](https://status.supabase.com/)
2. Review the [Supabase Community](https://github.com/supabase/supabase/discussions)
3. Check the [AutoBot Manager Issues](https://github.com/danxdz/fun/issues)

---

**Need help?** Open an issue in the repository or check the troubleshooting section above.