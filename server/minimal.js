console.log('Starting minimal server...');
console.log('Current working directory:', process.cwd());
console.log('Node version:', process.version);

import express from 'express';
import dotenv from 'dotenv';

console.log('Loading environment variables...');
dotenv.config();
console.log('Environment loaded. PORT:', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Supabase test endpoint
app.get('/api/debug/supabase', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.json({
        error: 'Supabase configuration missing',
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey,
        env: process.env.NODE_ENV || 'development'
      });
    }

    // Test Supabase connection
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to query a simple table
    const { data, error } = await supabase
      .from('Users')
      .select('count')
      .limit(1);
    
    if (error) {
      return res.json({
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
      env: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.json({
      error: 'Supabase test failed',
      message: error.message,
      env: process.env.NODE_ENV || 'development'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Login request received:', { email: !!email, password: !!password });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    
    res.json({
      user: data.user,
      session: data.session,
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Register request received:', { email: !!email, password: !!password });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    res.json({
      user: data.user,
      session: data.session,
      message: 'Registration successful'
    });
    
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Legacy auth endpoint (for backward compatibility)
app.post('/api/auth', async (req, res) => {
  try {
    const { email, password, action, type } = req.body;
    
    console.log('Legacy auth request received:', { email: !!email, password: !!password, action, type });
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Determine action from various possible parameters
    const authAction = action || type;
    
    if (authAction === 'login' || authAction === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return res.status(401).json({ error: error.message });
      }
      
      res.json({
        user: data.user,
        session: data.session,
        message: 'Login successful'
      });
      
    } else if (authAction === 'register' || authAction === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) {
        return res.status(400).json({ error: error.message });
      }
      
      res.json({
        user: data.user,
        session: data.session,
        message: 'Registration successful'
      });
      
    } else {
      // If no action specified, try to determine from context
      // Check if this might be a registration attempt by looking at the request
      const userAgent = req.headers['user-agent'] || '';
      const referer = req.headers.referer || '';
      
      console.log('No action specified, checking context:', { userAgent, referer });
      
      // If the referer contains 'register', assume it's a registration
      if (referer.includes('register') || referer.includes('signup')) {
        console.log('Detected registration attempt from referer');
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });
        
        if (error) {
          return res.status(400).json({ error: error.message });
        }
        
        return res.json({
          user: data.user,
          session: data.session,
          message: 'Registration successful'
        });
      }
      
      // Default to login attempt
      console.log('Defaulting to login attempt');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return res.status(401).json({ error: error.message });
      }
      
      res.json({
        user: data.user,
        session: data.session,
        message: 'Login successful'
      });
    }
    
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user
app.get('/api/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    
    res.json({ user });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dashboard endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      return res.status(401).json({ error: error.message });
    }
    
    // Return basic dashboard data
    res.json({
      user,
      message: 'Dashboard data',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
app.use(express.static('dist'));

// Catch-all handler for React app
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: 'dist' });
});

// Start server
console.log('About to start server on port:', PORT);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Listening on all interfaces (0.0.0.0:${PORT})`);
  console.log(`✅ Health check available at: http://0.0.0.0:${PORT}/api/health`);
});

// Add error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;