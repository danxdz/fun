import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { supabase } from './database/connection.js';
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

// Database connection test (now Supabase-only)
app.get('/api/debug/database', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase.from('Users').select('count').limit(1);
    
    if (error) throw error;
    
    res.json({
      status: 'Supabase database connection successful',
      database: 'supabase',
      dialect: 'supabase',
      host: process.env.SUPABASE_URL,
      port: 443,
      env: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Supabase database connection failed',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      suggestion: 'Check Supabase environment variables and table setup'
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

// Supabase connection and server start
async function startServer() {
  try {
    // Test Supabase connection
    try {
      const { data, error } = await supabase.from('Users').select('count').limit(1);
      if (error) throw error;
      logger.info('Supabase connection established successfully.');
    } catch (dbError) {
      logger.warn('Supabase connection failed:', dbError.message);
      logger.warn('Some features may not work until Supabase is configured.');
    }
    
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Frontend available at: http://localhost:${PORT}`);
      logger.info(`API available at: http://localhost:${PORT}/api`);
      logger.info(`Using Supabase for database operations`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;