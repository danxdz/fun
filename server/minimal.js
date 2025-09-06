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

// Security middleware
app.use((req, res, next) => {
  // CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Rate limiting (simple implementation)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per window

app.use((req, res, next) => {
  const clientId = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const now = Date.now();
  
  if (!rateLimitMap.has(clientId)) {
    rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
  } else {
    const clientData = rateLimitMap.get(clientId);
    
    if (now > clientData.resetTime) {
      // Reset window
      rateLimitMap.set(clientId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    } else if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    } else {
      clientData.count++;
    }
  }
  
  next();
});

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Input validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
};

// Enhanced logging middleware
const logRequest = (req, res, next) => {
  const start = Date.now();
  const originalSend = res.send;
  
  res.send = function(data) {
    const duration = Date.now() - start;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      contentLength: res.get('content-length') || '0'
    };
    
    // Log based on status code
    if (res.statusCode >= 400) {
      console.error('❌ Request Error:', logData);
    } else if (res.statusCode >= 300) {
      console.warn('⚠️ Request Redirect:', logData);
    } else {
      console.log('✅ Request Success:', logData);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

// Apply logging middleware
app.use(logRequest);

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Comprehensive system test endpoint
app.get('/api/debug/system', async (req, res) => {
  try {
    const results = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      tests: {}
    };

    // Test 1: Environment Variables
    results.tests.environmentVariables = {
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || '3001'
    };

    // Test 2: Supabase Connection
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      results.tests.supabaseConnection = {
        status: 'failed',
        error: 'Missing environment variables'
      };
    } else {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        // Test database connection
        const { data, error } = await supabase
          .from('Users')
          .select('count')
          .limit(1);
        
        results.tests.supabaseConnection = {
          status: error ? 'failed' : 'success',
          error: error ? error.message : null,
          code: error ? error.code : null
        };
      } catch (error) {
        results.tests.supabaseConnection = {
          status: 'failed',
          error: error.message
        };
      }
    }

    // Test 3: Service Role Key
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const serviceSupabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        
        // Test admin access
        const { data, error } = await serviceSupabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        
        results.tests.serviceRoleKey = {
          status: error ? 'failed' : 'success',
          error: error ? error.message : null
        };
      } catch (error) {
        results.tests.serviceRoleKey = {
          status: 'failed',
          error: error.message
        };
      }
    } else {
      results.tests.serviceRoleKey = {
        status: 'missing',
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured'
      };
    }

    // Test 4: Database Schema
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      const { data, error } = await supabase
        .from('Users')
        .select('id, email, firstName, lastName, createdAt')
        .limit(1);
      
      results.tests.databaseSchema = {
        status: error ? 'failed' : 'success',
        error: error ? error.message : null,
        sampleData: data ? data.length : 0
      };
    } catch (error) {
      results.tests.databaseSchema = {
        status: 'failed',
        error: error.message
      };
    }

    // Overall status
    const allTestsPassed = Object.values(results.tests).every(test => 
      test.status === 'success' || test.status === 'missing'
    );
    
    results.overallStatus = allTestsPassed ? 'healthy' : 'issues_detected';
    
    res.json(results);
    
  } catch (error) {
    res.status(500).json({
      error: 'System test failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Legacy Supabase test endpoint (for backward compatibility)
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
    
    // If user was created successfully, add them to the Users table
    if (data.user) {
      try {
        console.log('Adding user to database:', data.user.email);
        
        const { error: dbError } = await supabase
          .from('Users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            firstName: '', // You might want to collect this during registration
            lastName: '',  // You might want to collect this during registration
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        
        if (dbError) {
          console.error('Database insert error:', dbError);
          // Don't fail registration if DB insert fails, just log it
        } else {
          console.log('User added to database successfully');
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Don't fail registration if DB insert fails
      }
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
      
      // If user was created successfully, add them to the Users table
      if (data.user) {
        try {
          console.log('Adding user to database (legacy):', data.user.email);
          
          const { error: dbError } = await supabase
            .from('Users')
            .insert({
              id: data.user.id,
              email: data.user.email,
              firstName: '',
              lastName: '',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          
          if (dbError) {
            console.error('Database insert error (legacy):', dbError);
          } else {
            console.log('User added to database successfully (legacy)');
          }
        } catch (dbError) {
          console.error('Database error (legacy):', dbError);
        }
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
        
        // If user was created successfully, add them to the Users table
        if (data.user) {
          try {
            console.log('Adding user to database (referer detection):', data.user.email);
            
            const { error: dbError } = await supabase
              .from('Users')
              .insert({
                id: data.user.id,
                email: data.user.email,
                firstName: '',
                lastName: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            
            if (dbError) {
              console.error('Database insert error (referer detection):', dbError);
            } else {
              console.log('User added to database successfully (referer detection)');
            }
          } catch (dbError) {
            console.error('Database error (referer detection):', dbError);
          }
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
    console.log('Me request headers:', {
      authorization: req.headers.authorization,
      'x-api-key': req.headers['x-api-key'],
      cookie: req.headers.cookie
    });
    
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    console.log('Extracted token for /me:', token ? 'present' : 'missing');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        receivedHeaders: Object.keys(req.headers),
        authHeader: req.headers.authorization
      });
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
    console.log('Dashboard request headers:', {
      authorization: req.headers.authorization,
      'x-api-key': req.headers['x-api-key'],
      cookie: req.headers.cookie,
      'content-type': req.headers['content-type']
    });
    
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    console.log('Extracted token:', token ? 'present' : 'missing');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        receivedHeaders: Object.keys(req.headers),
        authHeader: req.headers.authorization
      });
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

// Get user profile
app.get('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
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
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      return res.status(401).json({ error: authError.message });
    }
    
    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('Users')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Return auth user data if profile not found
      return res.json({
        id: user.id,
        email: user.email,
        firstName: '',
        lastName: '',
        role: 'user',
        isActive: true,
        preferences: {},
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        authUser: user
      });
    }
    
    res.json({
      ...profile,
      authUser: user
    });
    
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put('/api/user/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { firstName, lastName, preferences } = req.body;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      return res.status(401).json({ error: authError.message });
    }
    
    // Update user profile
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (preferences !== undefined) updateData.preferences = preferences;
    
    const { data, error } = await supabase
      .from('Users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      message: 'Profile updated successfully',
      user: data
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user profile endpoint
app.delete('/api/user/profile', async (req, res) => {
  try {
    console.log('Delete profile request received');
    
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase service role key not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // First, get the current user to verify they exist
    // We need to use the anon key client to validate the token
    const anonSupabase = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
    const { data: { user }, error: getUserError } = await anonSupabase.auth.getUser(token);
    
    if (getUserError) {
      return res.status(401).json({ error: getUserError.message });
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Deleting user profile for:', user.email);
    
    // Delete the user account
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }
    
    console.log('User profile deleted successfully for:', user.email);
    
    res.json({
      message: 'User profile deleted successfully',
      deletedUser: {
        id: user.id,
        email: user.email
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Projects endpoints
app.get('/api/projects', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
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
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      return res.status(401).json({ error: authError.message });
    }
    
    // Get user's projects
    const { data: projects, error } = await supabase
      .from('Projects')
      .select(`
        *,
        Teams(name, description),
        Bots(id, name, type, status, lastRun)
      `)
      .eq('UserId', user.id)
      .eq('isActive', true)
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Projects fetch error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      projects: projects || [],
      count: projects ? projects.length : 0
    });
    
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { name, description, repositoryUrl, repositoryType, accessToken, defaultBranch, teamId } = req.body;
    
    if (!name || !repositoryUrl || !accessToken) {
      return res.status(400).json({ error: 'Name, repository URL, and access token are required' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      return res.status(401).json({ error: authError.message });
    }
    
    // Create project
    const { data, error } = await supabase
      .from('Projects')
      .insert({
        name,
        description: description || '',
        repositoryUrl,
        repositoryType: repositoryType || 'github',
        accessToken,
        defaultBranch: defaultBranch || 'main',
        UserId: user.id,
        TeamId: teamId || null,
        settings: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Project creation error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json({
      message: 'Project created successfully',
      project: data
    });
    
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bot management endpoints
app.get('/api/bots', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
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
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      return res.status(401).json({ error: authError.message });
    }
    
    // Get user's bots
    const { data: bots, error } = await supabase
      .from('Bots')
      .select(`
        *,
        Projects(name, repositoryUrl),
        Teams(name)
      `)
      .eq('UserId', user.id)
      .eq('isActive', true)
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Bots fetch error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      bots: bots || [],
      count: bots ? bots.length : 0
    });
    
  } catch (error) {
    console.error('Get bots error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bots', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { name, type, description, projectId, teamId, config, schedule } = req.body;
    
    if (!name || !type || !projectId) {
      return res.status(400).json({ error: 'Name, type, and project ID are required' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      return res.status(401).json({ error: authError.message });
    }
    
    // Create bot
    const { data, error } = await supabase
      .from('Bots')
      .insert({
        name: sanitizeInput(name),
        type: sanitizeInput(type),
        description: sanitizeInput(description || ''),
        ProjectId: projectId,
        TeamId: teamId || null,
        UserId: user.id,
        config: config || {},
        schedule: schedule || null,
        status: 'inactive',
        lastRun: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('Bot creation error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.status(201).json({
      message: 'Bot created successfully',
      bot: data
    });
    
  } catch (error) {
    console.error('Create bot error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bots/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { id } = req.params;
    const { name, type, description, config, schedule, status } = req.body;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      return res.status(401).json({ error: authError.message });
    }
    
    // Update bot
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    if (name !== undefined) updateData.name = sanitizeInput(name);
    if (type !== undefined) updateData.type = sanitizeInput(type);
    if (description !== undefined) updateData.description = sanitizeInput(description);
    if (config !== undefined) updateData.config = config;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (status !== undefined) updateData.status = status;
    
    const { data, error } = await supabase
      .from('Bots')
      .update(updateData)
      .eq('id', id)
      .eq('UserId', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Bot update error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    res.json({
      message: 'Bot updated successfully',
      bot: data
    });
    
  } catch (error) {
    console.error('Update bot error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/bots/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const { id } = req.params;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      return res.status(401).json({ error: authError.message });
    }
    
    // Soft delete bot
    const { data, error } = await supabase
      .from('Bots')
      .update({ 
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .eq('UserId', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Bot deletion error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    res.json({
      message: 'Bot deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete bot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Teams endpoints
app.get('/api/teams', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
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
    
    // Get user from auth
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      return res.status(401).json({ error: authError.message });
    }
    
    // Get teams (simplified - in real app you'd check team membership)
    const { data: teams, error } = await supabase
      .from('Teams')
      .select('*')
      .eq('isActive', true)
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Teams fetch error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      teams: teams || [],
      count: teams ? teams.length : 0
    });
    
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API Documentation endpoint (must be before static files)
app.get('/api/docs', (req, res) => {
  const apiDocs = {
    title: 'AutoBot Manager API',
    version: '1.0.0',
    description: 'Complete API for managing AI automation bots, projects, and teams',
    baseUrl: 'https://web-production-8747.up.railway.app',
    endpoints: {
      authentication: {
        'POST /api/auth': {
          description: 'Login or register user',
          parameters: {
            email: 'string (required)',
            password: 'string (required)',
            firstName: 'string (optional, for registration)',
            lastName: 'string (optional, for registration)',
            action: 'string (optional: "login" or "register")'
          },
          response: 'Returns user data and JWT token'
        },
        'POST /api/auth/login': {
          description: 'User login',
          parameters: { email: 'string', password: 'string' },
          response: 'Returns user data and JWT token'
        },
        'POST /api/auth/register': {
          description: 'User registration',
          parameters: { email: 'string', password: 'string', firstName: 'string', lastName: 'string' },
          response: 'Returns user data and JWT token'
        }
      },
      user: {
        'GET /api/me': {
          description: 'Get current user profile',
          auth: 'Bearer token required',
          response: 'Returns user profile data'
        },
        'GET /api/user/profile': {
          description: 'Get user profile from database',
          auth: 'Bearer token required',
          response: 'Returns complete user profile'
        },
        'PUT /api/user/profile': {
          description: 'Update user profile',
          auth: 'Bearer token required',
          parameters: { firstName: 'string', lastName: 'string', preferences: 'object' },
          response: 'Returns updated user profile'
        },
        'DELETE /api/user/profile': {
          description: 'Delete user account',
          auth: 'Bearer token required',
          response: 'Confirms account deletion'
        }
      },
      projects: {
        'GET /api/projects': {
          description: 'Get user projects',
          auth: 'Bearer token required',
          response: 'Returns array of user projects with bots'
        },
        'POST /api/projects': {
          description: 'Create new project',
          auth: 'Bearer token required',
          parameters: {
            name: 'string (required)',
            description: 'string',
            repositoryUrl: 'string (required)',
            repositoryType: 'string (default: "github")',
            accessToken: 'string (required)',
            defaultBranch: 'string (default: "main")',
            teamId: 'string (optional)'
          },
          response: 'Returns created project data'
        }
      },
      bots: {
        'GET /api/bots': {
          description: 'Get user bots',
          auth: 'Bearer token required',
          response: 'Returns array of user bots with project info'
        },
        'POST /api/bots': {
          description: 'Create new bot',
          auth: 'Bearer token required',
          parameters: {
            name: 'string (required)',
            type: 'string (required)',
            description: 'string',
            projectId: 'string (required)',
            teamId: 'string (optional)',
            config: 'object',
            schedule: 'string (optional)'
          },
          response: 'Returns created bot data'
        },
        'PUT /api/bots/:id': {
          description: 'Update bot',
          auth: 'Bearer token required',
          parameters: { name: 'string', type: 'string', description: 'string', config: 'object', schedule: 'string', status: 'string' },
          response: 'Returns updated bot data'
        },
        'DELETE /api/bots/:id': {
          description: 'Delete bot',
          auth: 'Bearer token required',
          response: 'Confirms bot deletion'
        }
      },
      teams: {
        'GET /api/teams': {
          description: 'Get teams',
          auth: 'Bearer token required',
          response: 'Returns array of teams'
        }
      },
      dashboard: {
        'GET /api/dashboard': {
          description: 'Get dashboard data',
          auth: 'Bearer token required',
          response: 'Returns user dashboard with projects, bots, and stats'
        }
      },
      debug: {
        'GET /api/health': {
          description: 'Health check endpoint',
          response: 'Returns server status'
        },
        'GET /api/debug/supabase': {
          description: 'Test Supabase connection',
          response: 'Returns Supabase connection status'
        },
        'GET /api/debug/system': {
          description: 'Comprehensive system health check',
          response: 'Returns complete system status'
        }
      }
    },
    authentication: {
      type: 'Bearer Token',
      description: 'Include Authorization header with Bearer token for protected endpoints',
      example: 'Authorization: Bearer your-jwt-token-here'
    },
    errorCodes: {
      200: 'Success',
      201: 'Created',
      400: 'Bad Request - Invalid parameters',
      401: 'Unauthorized - Invalid or missing token',
      403: 'Forbidden - Insufficient permissions',
      404: 'Not Found - Resource not found',
      429: 'Too Many Requests - Rate limit exceeded',
      500: 'Internal Server Error - Server error'
    },
    examples: {
      login: {
        url: 'POST /api/auth/login',
        body: { email: 'user@example.com', password: 'password123' },
        response: { user: {...}, token: 'jwt-token-here' }
      },
      createProject: {
        url: 'POST /api/projects',
        headers: { Authorization: 'Bearer jwt-token-here' },
        body: { name: 'My Project', repositoryUrl: 'https://github.com/user/repo', accessToken: 'github-token' },
        response: { project: {...} }
      }
    }
  };
  
  res.json(apiDocs);
});

// Serve static files
app.use(express.static('dist'));

// Catch-all handler for React app (but exclude API routes)
app.get('*', (req, res, next) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
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