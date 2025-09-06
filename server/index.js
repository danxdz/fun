import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { sequelize } from './database/connection.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import projectRoutes from './routes/projects.js';
import botRoutes from './routes/bots.js';
import { setupSocketHandlers } from './services/socketService.js';
import { BotSpawner } from './services/botSpawner.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(limiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));
app.use(express.static('dist'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/bots', botRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Supabase connection test
app.get('/api/debug/supabase', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        error: 'Supabase configuration missing',
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
        env: process.env.NODE_ENV
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from('Users')
      .select('count')
      .limit(1);
    
    if (error) {
      return res.status(500).json({
        error: 'Supabase connection failed',
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    }
    
    res.json({
      status: 'Supabase connection successful',
      supabaseUrl: supabaseUrl,
      hasKey: !!supabaseKey,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Supabase test failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Database connection test
app.get('/api/debug/database', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT 1 as test');
    
    res.json({
      status: 'Database connection successful',
      database: sequelize.getDatabaseName(),
      dialect: sequelize.getDialect(),
      host: sequelize.getHostname(),
      port: sequelize.getPort(),
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Database connection failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      suggestion: 'Configure database environment variables or use Supabase setup guide'
    });
  }
});

// Environment debug endpoint
app.get('/api/debug/env', (req, res) => {
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    DB_HOST: process.env.DB_HOST ? '***' : undefined,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER ? '***' : undefined,
    SUPABASE_URL: process.env.SUPABASE_URL ? '***' : undefined,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '***' : undefined,
    JWT_SECRET: process.env.JWT_SECRET ? '***' : undefined
  };
  
  res.json({
    environment: safeEnv,
    timestamp: new Date().toISOString()
  });
});

// Socket.io setup
setupSocketHandlers(io);

// Initialize bot spawner
const botSpawner = new BotSpawner(io);
global.botSpawner = botSpawner;

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  // For API routes, return JSON error
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Route not found' });
  }
  
  // For all other routes, serve the React app
  res.sendFile('index.html', { root: 'dist' });
});

const PORT = process.env.PORT || 3001;

// Database connection and server start
async function startServer() {
  try {
    // Try to connect to database, but don't fail if it's not available
    try {
      await sequelize.authenticate();
      logger.info('Database connection established successfully.');
      
      // Sync database models
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized.');
    } catch (dbError) {
      logger.warn('Database connection failed, running without database:', dbError.message);
      logger.warn('Some features may not work until database is configured.');
    }
    
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Frontend available at: http://localhost:${PORT}`);
      logger.info(`API available at: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;