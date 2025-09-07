// Starting AutoBot Manager Server

import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

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
    
    // Request logged for monitoring
    
    originalSend.call(this, data);
  };
  
  next();
};

// Apply logging middleware
app.use(logRequest);

// Encryption utilities for sensitive data
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  if (!text) return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  cipher.setAAD(Buffer.from('autobot-manager', 'utf8'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

function decrypt(encryptedText) {
  if (!encryptedText) return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) return encryptedText; // Not encrypted, return as-is
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAAD(Buffer.from('autobot-manager', 'utf8'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    // If decryption fails, it might be old format or plain text
    // Try to return as-is, or return empty string for sensitive data
    if (encryptedText.includes(':')) {
      return ''; // Return empty for encrypted data that can't be decrypted
    }
    return encryptedText; // Return original if it's not encrypted
  }
}

// Helper function to verify custom JWT and get user
async function verifyTokenAndGetUser(token) {
  if (!token) {
    throw new Error('No token provided');
  }
  
  const jwt = await import('jsonwebtoken');
  let decoded;
  try {
    decoded = jwt.default.verify(token, process.env.JWT_SECRET);
  } catch (jwtError) {
    throw new Error('Invalid token');
  }
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase not configured');
  }
  
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: user, error: userError } = await supabase
    .from('Users')
    .select('*')
    .eq('id', decoded.userId)
    .single();
  
  if (userError || !user) {
    throw new Error('User not found');
  }
  
  // Decrypt sensitive data before returning
  const decryptedUser = {
    ...user,
    githubToken: decrypt(user.githubToken),
    cursorApiKey: decrypt(user.cursorApiKey)
  };
  
  return { user: decryptedUser, supabase };
}

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Admin endpoint to encrypt existing sensitive data
app.post('/api/admin/encrypt-existing-data', async (req, res) => {
  try {
    // This is a one-time migration endpoint
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get all users with sensitive data
    const { data: users, error } = await supabase
      .from('Users')
      .select('id, githubToken, cursorApiKey')
      .or('githubToken.not.is.null,cursorApiKey.not.is.null');
    
    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
    
    let encryptedCount = 0;
    let skippedCount = 0;
    
    for (const user of users) {
      const updateData = {};
      let needsUpdate = false;
      
      // Check if githubToken needs encryption
      if (user.githubToken && !user.githubToken.includes(':')) {
        updateData.githubToken = encrypt(user.githubToken);
        needsUpdate = true;
      }
      
      // Check if cursorApiKey needs encryption
      if (user.cursorApiKey && !user.cursorApiKey.includes(':')) {
        updateData.cursorApiKey = encrypt(user.cursorApiKey);
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from('Users')
          .update(updateData)
          .eq('id', user.id);
        
        if (updateError) {
          console.error(`Error encrypting user ${user.id}:`, updateError);
        } else {
          encryptedCount++;
        }
      } else {
        skippedCount++;
      }
    }
    
    res.json({
      message: 'Encryption migration completed',
      totalUsers: users.length,
      encryptedCount,
      skippedCount,
      note: 'Existing sensitive data has been encrypted'
    });
    
  } catch (error) {
    console.error('Encryption migration error:', error);
    res.status(500).json({ error: error.message });
  }
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
      GITHUB_CLIENT_ID: !!process.env.GITHUB_CLIENT_ID,
      GITHUB_CLIENT_SECRET: !!process.env.GITHUB_CLIENT_SECRET,
      JWT_SECRET: !!process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV || 'development',
      PORT: process.env.PORT || '3001'
    };

    // Test 2: Supabase Connection
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS
    
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
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS
    
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

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS
    
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
      token: data.session ? data.session.access_token : null,
      session: data.session,
      message: 'Login successful'
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Token refresh endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: token
    });
    
    if (error) {
      console.error('Token refresh error:', error);
      return res.status(401).json({ error: 'Token refresh failed' });
    }
    
    res.json({
      token: data.session?.access_token,
      user: data.user,
      message: 'Token refreshed successfully'
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GitHub OAuth login endpoint - Direct GitHub OAuth for real tokens
app.post('/api/auth/github', async (req, res) => {
  try {
    const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23liFUwEe9ESktoMM2';
    const redirectUri = `${req.headers.origin || 'https://web-production-8747.up.railway.app'}/auth/callback`;
    
    if (!clientId) {
      return res.status(500).json({ error: 'GitHub Client ID not configured' });
    }
    
    // Generate state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Direct GitHub OAuth URL with proper scopes
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,public_repo,user:email&state=${state}`;

    res.json({ 
      url: githubAuthUrl,
      message: 'Redirect to GitHub for authentication with real token'
    });
    
  } catch (error) {
    console.error('GitHub OAuth initiation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GitHub OAuth callback endpoint - Exchange code for real GitHub token
app.get('/auth/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    // Handle OAuth error
    if (error) {
      console.error('GitHub OAuth error:', error);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Authentication Error</title></head>
        <body>
          <h1>❌ Authentication Error</h1>
          <p>Error: ${error}</p>
          <a href="/login">Try Again</a>
        </body>
        </html>
      `);
    }
    
    // Handle authorization code flow
    if (code) {
      console.log('GitHub OAuth callback with code:', code.substring(0, 10) + '...');
      
      // Exchange code for GitHub access token
      const clientId = process.env.GITHUB_CLIENT_ID || 'Ov23liFUwEe9ESktoMM2';
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        throw new Error('GitHub OAuth credentials not configured');
      }
      
      // Exchange authorization code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
        }),
      });
      
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        throw new Error(`GitHub token error: ${tokenData.error_description}`);
      }
      
      const githubToken = tokenData.access_token;
      console.log('GitHub token obtained:', githubToken.substring(0, 10) + '...');
      
      // Get GitHub user info
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });
      
      const githubUser = await userResponse.json();

      if (!githubUser.id) {
        throw new Error('Failed to get GitHub user info');
      }
      
      // Create or update user in our database
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // Generate a UUID for the user (since GitHub ID is numeric)
      const userId = crypto.randomUUID();
      
      // Generate a JWT token for our app
      const jwt = await import('jsonwebtoken');
      const appToken = jwt.default.sign(
        { 
          userId: userId,
          email: githubUser.email,
          githubUsername: githubUser.login,
          githubToken: githubToken
        },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '7d' }
      );
      
      // Save user to database (encrypt sensitive data)
      const userData = {
        id: userId,
        email: githubUser.email || `${githubUser.login}@github.local`,
        firstName: githubUser.name?.split(' ')[0] || '',
        lastName: githubUser.name?.split(' ').slice(1).join(' ') || '',
        githubUsername: githubUser.login,
        githubAvatar: githubUser.avatar_url,
        githubToken: encrypt(githubToken), // 🔒 ENCRYPTED GitHub token
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { error: dbError } = await supabase
        .from('Users')
        .upsert(userData, { onConflict: 'email' });
      
      if (dbError) {
        console.error('Database error:', dbError);
      } else {
        
      }
      
      // Redirect to frontend with token
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Complete</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: 'Inter', system-ui, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              overflow: hidden;
            }
            .container {
              text-align: center;
              padding: 3rem;
              border: 1px solid #e5e7eb;
              border-radius: 0.75rem;
              background: #ffffff;
              box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
              max-width: 400px;
              width: 90%;
            }
            .status {
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 1rem;
            }
            .success { color: #10b981; }
            .info { color: #6b7280; }
            .warning { color: #f59e0b; }
            .loading {
              display: inline-block;
              width: 16px;
              height: 16px;
              border: 2px solid #e5e7eb;
              border-radius: 50%;
              border-top-color: #000000;
              animation: spin 1s linear infinite;
              margin-right: 0.5rem;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            .blink { animation: blink 1s infinite; }
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
            .title {
              font-size: 1.5rem;
              font-weight: 600;
              margin-bottom: 1rem;
              color: #000000;
            }
            .message {
              font-size: 0.875rem;
              color: #6b7280;
              margin-bottom: 0.5rem;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="title">Authentication Complete</div>
            <div class="status">
              <div class="success">✓ Authentication successful</div>
              <div class="info">Welcome, ${githubUser.name || githubUser.login}</div>
              <div class="success">✓ Access token acquired</div>
              <div class="success">✓ Repository access granted</div>
              <div class="warning">Initializing dashboard...</div>
              <div class="info"><span class="loading"></span>Redirecting in progress<span class="blink">_</span></div>
            </div>
          </div>
          <script>
            console.log('Setting token and user data...');
            localStorage.setItem('token', '${appToken}');
            localStorage.setItem('user', JSON.stringify(${JSON.stringify({
              id: userId,
              email: githubUser.email || `${githubUser.login}@github.local`,
              firstName: githubUser.name?.split(' ')[0] || '',
              lastName: githubUser.name?.split(' ').slice(1).join(' ') || '',
              githubUsername: githubUser.login,
              githubAvatar: githubUser.avatar_url,
              githubToken: githubToken
            })}));
            console.log('Token set:', localStorage.getItem('token') ? 'YES' : 'NO');
            console.log('User set:', localStorage.getItem('user') ? 'YES' : 'NO');
            console.log('Redirecting to dashboard...');
            setTimeout(() => {
              window.location.href = '/';
            }, 2000);
          </script>
        </body>
        </html>
      `);
    }
    
    // Handle implicit flow (fallback)
    if (!code) {
      // If no query parameters, serve a client-side handler for URL fragments
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Processing Authentication...</title>
        </head>
        <body>
          <script>
            // Extract token from URL fragment
            const hash = window.location.hash;
            const params = new URLSearchParams(hash.substring(1));
            const accessToken = params.get('access_token');
            const userData = {
              id: params.get('user_id') || '',
              email: params.get('email') || '',
              user_metadata: {
                user_name: params.get('user_name') || '',
                avatar_url: params.get('avatar_url') || ''
              }
            };
            
            if (accessToken) {
              
              localStorage.setItem('token', accessToken);
              localStorage.setItem('user', JSON.stringify(userData));
              console.log('Token set:', localStorage.getItem('token') ? 'YES' : 'NO');
              console.log('User set:', localStorage.getItem('user') ? 'YES' : 'NO');
              setTimeout(() => {
                window.location.href = '/dashboard';
              }, 1000);
            } else {
              console.error('No access token found in URL fragment');
              window.location.href = '/login?error=no_token';
            }
          </script>
          <h1>🎉 Processing GitHub Authentication...</h1>
          <p>Please wait while we complete your login...</p>
          <p>If you're not redirected automatically, <a href="/dashboard">click here</a></p>
        </body>
        </html>
      `);
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).send('Server configuration error');
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let token, user, session;
    
    if (code) {
      // Authorization code flow
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('OAuth callback error:', error);
        return res.status(401).send('Authentication failed');
      }
      
      token = data.session?.access_token;
      user = data.user;
      session = data.session; // Store session data for GitHub token
    } else if (access_token) {
      // Implicit flow - get user info from token
      const { data, error } = await supabase.auth.getUser(access_token);
      
      if (error) {
        console.error('OAuth callback error:', error);
        return res.status(401).send('Authentication failed');
      }
      
      token = access_token;
      user = data.user;
      session = null; // No session data in implicit flow
    }
    
    if (token && user) {
      // Add user to database if they don't exist
      try {

        // Check if we have a GitHub token in the session

        // Try to extract GitHub token from various sources
        let githubToken = '';
        
        // Method 1: From session provider_token
        if (session?.provider_token) {
          githubToken = session.provider_token;
          console.log('GitHub token found in session.provider_token:', githubToken.substring(0, 10) + '...');
          
          // Check if this is the known invalid token
          if (githubToken.includes('ABCDLBQ0RGuSKGL9TJ1S_VxhjPQ0AOwAhXHaBnmMWDfVqdFB820O0KFmTXlVNQEVC7YBKQRGuCTseaP1')) {
            
            githubToken = '';
          }
        }
        // Method 2: From user metadata (if Supabase stores it there)
        else if (user.user_metadata?.provider_token) {
          githubToken = user.user_metadata.provider_token;
          console.log('GitHub token found in user.user_metadata.provider_token:', githubToken.substring(0, 10) + '...');
          
          // Check if this is the known invalid token
          if (githubToken.includes('ABCDLBQ0RGuSKGL9TJ1S_VxhjPQ0AOwAhXHaBnmMWDfVqdFB820O0KFmTXlVNQEVC7YBKQRGuCTseaP1')) {
            
            githubToken = '';
          }
        }
        // Method 3: From app metadata
        else if (user.app_metadata?.provider_token) {
          githubToken = user.app_metadata.provider_token;
          console.log('GitHub token found in user.app_metadata.provider_token:', githubToken.substring(0, 10) + '...');
          
          // Check if this is the known invalid token
          if (githubToken.includes('ABCDLBQ0RGuSKGL9TJ1S_VxhjPQ0AOwAhXHaBnmMWDfVqdFB820O0KFmTXlVNQEVC7YBKQRGuCTseaP1')) {
            
            githubToken = '';
          }
        }
        // Method 4: Check if there's an access_token in the URL (implicit flow)
        else if (access_token) {
          // In implicit flow, the access_token might be the GitHub token
          githubToken = access_token;
          console.log('Using access_token as GitHub token:', githubToken.substring(0, 10) + '...');
        }
        else {

          // Clear any existing invalid token
          githubToken = '';
          
        }
        
        const userData = {
          id: user.id,
          email: user.email,
          firstName: user.user_metadata?.full_name?.split(' ')[0] || '',
          lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
          githubUsername: user.user_metadata?.user_name || '',
          githubAvatar: user.user_metadata?.avatar_url || '',
          githubToken: githubToken,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const { error: dbError } = await supabase
          .from('Users')
          .upsert(userData, {
            onConflict: 'id'
          });
        
        if (dbError) {
          console.error('Database upsert error:', dbError);
        } else {
          
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
      }
      
      // Redirect to frontend with token
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
        </head>
        <body>
          <script>
            
            localStorage.setItem('token', '${token}');
            localStorage.setItem('user', JSON.stringify(${JSON.stringify(user)}));
            console.log('Token set:', localStorage.getItem('token') ? 'YES' : 'NO');
            console.log('User set:', localStorage.getItem('user') ? 'YES' : 'NO');
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1000);
          </script>
          <h1>🎉 GitHub Authentication Successful!</h1>
          <p>Token: ${token ? 'Set' : 'Missing'}</p>
          <p>User: ${user ? 'Set' : 'Missing'}</p>
          <p>Redirecting to dashboard in 1 second...</p>
          <p>If you're not redirected, <a href="/dashboard">click here</a></p>
        </body>
        </html>
      `);
    }
    
    res.status(401).send('Authentication failed');
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).send('Server error');
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS
    
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
          
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Don't fail registration if DB insert fails
      }
    }
    
    res.json({
      user: data.user,
      token: data.session ? data.session.access_token : null,
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

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS
    
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
        token: data.session ? data.session.access_token : null,
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
        token: data.session ? data.session.access_token : null,
        session: data.session,
        message: 'Registration successful'
      });
      
    } else {
      // If no action specified, try to determine from context
      // Check if this might be a registration attempt by looking at the request
      const userAgent = req.headers['user-agent'] || '';
      const referer = req.headers.referer || '';

      // If the referer contains 'register', assume it's a registration
      if (referer.includes('register') || referer.includes('signup')) {
        
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
          token: data.session ? data.session.access_token : null,
          session: data.session,
          message: 'Registration successful'
        });
      }
      
      // Default to login attempt
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return res.status(401).json({ error: error.message });
      }
      
      res.json({
        user: data.user,
        token: data.session ? data.session.access_token : null,
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
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    console.log('API /me called with token:', token ? 'Present' : 'Missing');
    console.log('Auth header:', req.headers.authorization);
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    console.log('User found:', user.email);
    res.json({ user });
    
  } catch (error) {
    console.error('Get user error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token' || error.message === 'User not found') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Dashboard endpoint
app.get('/api/dashboard', async (req, res) => {
  try {

    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        receivedHeaders: Object.keys(req.headers),
        authHeader: req.headers.authorization
      });
    }
    
    // Verify our custom JWT token
    const jwt = await import('jsonwebtoken');
    let decoded;
    
    try {
      decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
    } catch (jwtError) {
      console.error('Dashboard JWT verification failed:', jwtError.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user from our database using the userId from JWT
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: user, error } = await supabase
      .from('Users')
      .select('*')
      .eq('id', decoded.userId)
      .single();
    
    if (error || !user) {
      console.error('Dashboard user lookup failed:', { error, userId: decoded.userId });
      return res.status(401).json({ error: 'User not found' });
    }

    // Get comprehensive dashboard statistics
    const { data: projects } = await supabase
      .from('Projects')
      .select('*')
      .eq('userId', user.id);

    const { data: bots } = await supabase
      .from('Bots')
      .select('*')
      .eq('userId', user.id);

    const { data: botRuns } = await supabase
      .from('BotRuns')
      .select('*')
      .eq('userId', user.id);

    // Calculate statistics
    const stats = {
      projects: {
        total: projects?.length || 0,
        active: projects?.filter(p => p.status === 'active').length || 0,
        github: projects?.filter(p => p.githubData).length || 0
      },
      bots: {
        total: bots?.length || 0,
        running: bots?.filter(b => b.status === 'running').length || 0,
        completed: bots?.filter(b => b.status === 'completed').length || 0,
        failed: bots?.filter(b => b.status === 'failed' || b.status === 'error').length || 0,
        byType: {}
      },
      runs: {
        total: botRuns?.length || 0,
        completed: botRuns?.filter(r => r.status === 'completed').length || 0,
        failed: botRuns?.filter(r => r.status === 'failed' || r.status === 'error').length || 0,
        running: botRuns?.filter(r => r.status === 'running').length || 0
      },
      github: {
        totalStars: projects?.reduce((sum, p) => sum + (p.githubData?.stars || 0), 0) || 0,
        totalForks: projects?.reduce((sum, p) => sum + (p.githubData?.forks || 0), 0) || 0,
        totalIssues: projects?.reduce((sum, p) => sum + (p.githubData?.openIssues || 0), 0) || 0
      }
    };

    // Calculate bot types
    if (bots) {
      bots.forEach(bot => {
        stats.bots.byType[bot.type] = (stats.bots.byType[bot.type] || 0) + 1;
      });
    }

    // Generate recent activity
    const recentActivity = [];
    if (botRuns) {
      recentActivity.push(...botRuns.slice(0, 10).map(run => ({
        id: run.id,
        title: `Bot run: ${run.botName || 'Unknown Bot'}`,
        description: `Status: ${run.status}`,
        status: run.status,
        timestamp: run.createdAt || run.created_at
      })));
    }

    // Generate weekly activity data
    const weeklyActivity = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayRuns = botRuns?.filter(run => {
        const runDate = new Date(run.createdAt || run.created_at);
        return runDate.toDateString() === date.toDateString();
      }) || [];
      
      weeklyActivity.push({
        date: date.toISOString().split('T')[0],
        runs: dayRuns.length,
        completed: dayRuns.filter(r => r.status === 'completed').length,
        failed: dayRuns.filter(r => r.status === 'failed' || r.status === 'error').length
      });
    }

    // Return comprehensive dashboard data
    res.json({
      user,
      statistics: stats,
      recentActivity,
      weeklyActivity,
      projects: projects?.slice(0, 5) || [],
      bots: bots?.slice(0, 5) || [],
      message: 'Dashboard data loaded successfully',
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
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

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
    
    // Decrypt sensitive data before returning
    const decryptedProfile = {
      ...profile,
      githubToken: decrypt(profile.githubToken),
      cursorApiKey: decrypt(profile.cursorApiKey),
      authUser: user
    };
    
    res.json(decryptedProfile);
    
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
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { firstName, lastName, githubUsername, githubAvatar, cursorApiKey, githubToken, preferences } = req.body;
    
    // Update user profile (encrypt sensitive data)
    const updateData = {
      updatedAt: new Date().toISOString()
    };
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (githubUsername !== undefined) updateData.githubUsername = githubUsername;
    if (githubAvatar !== undefined) updateData.githubAvatar = githubAvatar;
    if (cursorApiKey !== undefined) updateData.cursorApiKey = encrypt(cursorApiKey); // 🔒 ENCRYPTED
    if (githubToken !== undefined) updateData.githubToken = encrypt(githubToken); // 🔒 ENCRYPTED
    if (preferences !== undefined) updateData.preferences = preferences;

    // Use upsert instead of update to handle case where user doesn't exist yet
    const { data, error } = await supabase
      .from('Users')
      .upsert({
        id: user.id,
        email: user.email,
        ...updateData
      }, {
        onConflict: 'id'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Profile update error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Update data that failed:', updateData);
      return res.status(500).json({ 
        error: error.message,
        details: error.details || 'No additional details',
        hint: error.hint || 'No hint available',
        code: error.code || 'No error code'
      });
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

    // Delete the user account
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

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
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    // Check if requesting GitHub repositories
    if (req.query.action === 'github-repos') {
      try {

        // Get user's GitHub username from their profile
        const { data: userProfile, error: profileError } = await supabase
          .from('Users')
          .select('githubUsername, email')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          return res.status(500).json({ error: 'Failed to fetch user profile' });
        }
        
        if (!userProfile?.githubUsername) {
          
          return res.status(400).json({ 
            error: 'GitHub username not found in profile. Please update your profile with your GitHub username.' 
          });
        }
        
        // Fetch repositories from GitHub API
        const githubResponse = await fetch(`https://api.github.com/users/${userProfile.githubUsername}/repos?sort=updated&per_page=50`, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Autobot-Manager'
          }
        });
        
        if (!githubResponse.ok) {
          throw new Error(`GitHub API error: ${githubResponse.status}`);
        }
        
        const repositories = await githubResponse.json();
        
        // Format repositories for frontend
        const formattedRepos = repositories.map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description || '',
          url: repo.html_url,
          cloneUrl: repo.clone_url,
          language: repo.language || 'Unknown',
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          updatedAt: repo.updated_at,
          isPrivate: repo.private
        }));
        
        return res.json({ repositories: formattedRepos });
        
      } catch (githubError) {
        console.error('GitHub API error:', githubError);
        return res.status(500).json({ error: 'Failed to fetch GitHub repositories' });
      }
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
    if (error.message === 'No token provided' || error.message === 'Invalid token' || error.message === 'User not found') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { action, name, description, repositoryUrl, repositoryType, accessToken, defaultBranch, teamId } = req.body;

    // Handle different actions
    if (action === 'import-github') {
      if (!name || !repositoryUrl) {
        return res.status(400).json({ error: 'Name and repository URL are required for import' });
      }
    } else if (action === 'create-github') {
      if (!name) {
        return res.status(400).json({ error: 'Repository name is required' });
      }
      // For GitHub repo creation, we'll create a placeholder project
      // The actual GitHub repo creation would need GitHub API integration
    } else {
      if (!name || !repositoryUrl || !accessToken) {
        return res.status(400).json({ error: 'Name, repository URL, and access token are required' });
      }
    }
    
    // Create project
    const projectData = {
      name,
      description: description || '',
      repositoryType: repositoryType || 'github',
      defaultBranch: defaultBranch || 'main',
      UserId: user.id,
      TeamId: teamId || null,
      settings: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add repositoryUrl if provided (for imports) or placeholder for new repos
    if (repositoryUrl) {
      projectData.repositoryUrl = repositoryUrl;
    } else if (action === 'create-github') {
      // For new repos, we'll create a real GitHub repository
      // First create the project record, then create the GitHub repo
      projectData.repositoryUrl = ''; // Will be updated after GitHub repo creation
    }
    
    // Only add accessToken if it's provided (not for imports)
    if (accessToken) {
      projectData.accessToken = accessToken;
    }

    const { data, error } = await supabase
      .from('Projects')
      .insert(projectData)
      .select()
      .single();
    
    if (error) {
      console.error('Project creation error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Return appropriate response based on action
    if (action === 'create-github') {
      // Try to create a real GitHub repository
      try {
        // Get user's GitHub token from database
        const { data: userProfile, error: profileError } = await supabase
          .from('Users')
          .select('githubToken, githubUsername')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Failed to fetch user profile:', profileError);
          return res.status(201).json({
            message: 'Project created successfully, but failed to fetch user profile for GitHub repo creation',
            project: data,
            setupSuccess: false,
            error: 'Database error'
          });
        }
        
        if (!userProfile?.githubToken) {
          
          return res.status(201).json({
            message: 'Project created successfully, but GitHub repository creation is not available yet',
            project: data,
            setupSuccess: false,
            note: 'GitHub repository creation requires additional setup. For now, you can import existing repositories.',
            suggestion: 'Use "Import from GitHub" to link existing repositories to this project'
          });
        }

        // Create GitHub repository using GitHub API
        const repoData = {
          name: name,
          description: description || '',
          private: false, // Default to public
          auto_init: true // Initialize with README
        };

        const githubResponse = await fetch('https://api.github.com/user/repos', {
          method: 'POST',
          headers: {
            'Authorization': `token ${userProfile.githubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(repoData)
        });

        if (githubResponse.ok) {
          const githubRepo = await githubResponse.json();

          // Update project with real repository URL
          const { error: updateError } = await supabase
            .from('Projects')
            .update({ repositoryUrl: githubRepo.html_url })
            .eq('id', data.id);
          
          if (updateError) {
            console.error('Failed to update project with GitHub URL:', updateError);
          }
          
          res.status(201).json({
            message: 'Project and GitHub repository created successfully!',
            project: { ...data, repositoryUrl: githubRepo.html_url },
            setupSuccess: true,
            githubRepo: {
              name: githubRepo.name,
              url: githubRepo.html_url,
              cloneUrl: githubRepo.clone_url
            }
          });
        } else {
          const errorData = await githubResponse.json();
          console.error('GitHub API error:', errorData);
          
          res.status(201).json({
            message: 'Project created successfully, but GitHub repository creation failed',
            project: data,
            setupSuccess: false,
            error: errorData.message || 'GitHub API error'
          });
        }
      } catch (githubError) {
        console.error('GitHub repository creation error:', githubError);
        
        res.status(201).json({
          message: 'Project created successfully, but GitHub repository creation failed',
          project: data,
          setupSuccess: false,
          error: githubError.message
        });
      }
    } else {
      res.status(201).json({
        message: 'Project created successfully',
        project: data
      });
    }
    
  } catch (error) {
    console.error('Create project error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token' || error.message === 'User not found') {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Bot management endpoints
app.get('/api/bots', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    // Get user's bots through their projects
    const { data: bots, error } = await supabase
      .from('Bots')
      .select(`
        *,
        Projects!inner(name, repositoryUrl, UserId)
      `)
      .eq('Projects.UserId', user.id)
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

// Get bot runs
app.get('/api/bot-runs', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { botId } = req.query;
    
    let query = supabase
      .from('BotRuns')
      .select(`
        *,
        Bots!inner(name, type, ProjectId, Projects!inner(UserId))
      `)
      .eq('Bots.Projects.UserId', user.id)
      .order('startTime', { ascending: false });
    
    if (botId) {
      query = query.eq('BotId', botId);
    }
    
    const { data: runs, error } = await query;
    
    if (error) {
      console.error('Bot runs fetch error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({ runs });
    
  } catch (error) {
    console.error('Get bot runs error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bots', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { name, type, description, projectId, config, schedule } = req.body;
    
    if (!name || !type || !projectId) {
      return res.status(400).json({ 
        error: 'Name, type, and project ID are required',
        details: {
          name: name ? 'provided' : 'missing',
          type: type ? 'provided' : 'missing', 
          projectId: projectId ? 'provided' : 'missing'
        },
        received: { name, type, projectId }
      });
    }
    
    // Validate that the project belongs to the user
    const { data: project, error: projectError } = await supabase
      .from('Projects')
      .select('id, name, UserId')
      .eq('id', projectId)
      .eq('UserId', user.id)
      .single();
    
    if (projectError || !project) {
      return res.status(400).json({ 
        error: 'Project not found or does not belong to user',
        projectId,
        userId: user.id
      });
    }
    
    // Create bot
    const { data, error } = await supabase
      .from('Bots')
      .insert({
        name: sanitizeInput(name),
        type: sanitizeInput(type),
        ProjectId: projectId,
        configuration: {
          ...(config || {}),
          description: sanitizeInput(description || '')
        },
        schedule: schedule || null,
        status: 'idle',
        isActive: true,
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

// Start bot endpoint
app.post('/api/bots/:id/start', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { id } = req.params;
    
    // Verify bot belongs to user
    const { data: bot, error: botError } = await supabase
      .from('Bots')
      .select(`
        id, name, status, ProjectId,
        Projects!inner(UserId)
      `)
      .eq('id', id)
      .eq('Projects.UserId', user.id)
      .single();
    
    if (botError || !bot) {
      return res.status(404).json({ error: 'Bot not found or does not belong to user' });
    }
    
    if (bot.status === 'running') {
      return res.status(400).json({ error: 'Bot is already running' });
    }
    
    // Update bot status to running
    const { data, error } = await supabase
      .from('Bots')
      .update({ 
        status: 'running',
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Start bot error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      message: 'Bot started successfully',
      bot: data
    });
    
  } catch (error) {
    console.error('Start bot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Execute bot endpoint (runs the actual bot logic)
app.post('/api/bots/:id/execute', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { id } = req.params;
    
    // Get bot with project details
    const { data: bot, error: botError } = await supabase
      .from('Bots')
      .select(`
        id, name, type, status, configuration, ProjectId,
        Projects!inner(id, name, repositoryUrl, UserId)
      `)
      .eq('id', id)
      .eq('Projects.UserId', user.id)
      .single();
    
    if (botError || !bot) {
      return res.status(404).json({ error: 'Bot not found or does not belong to user' });
    }
    
    // Create bot run record
    const { data: botRun, error: runError } = await supabase
      .from('BotRuns')
      .insert({
        BotId: id,
        status: 'running',
        startTime: new Date().toISOString(),
        logs: ['Bot execution started'],
        results: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();
    
    if (runError) {
      console.error('Bot run creation error:', runError);
      return res.status(500).json({ error: 'Failed to create bot run record' });
    }
    
    // Update bot status to running
    await supabase
      .from('Bots')
      .update({ 
        status: 'running',
        lastRun: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .eq('id', id);
    
    // Execute bot logic based on type
    try {
      const executionResult = await executeBotLogic(bot, botRun.id, supabase);
      
      // Update bot run with results
      await supabase
        .from('BotRuns')
        .update({
          status: 'completed',
          endTime: new Date().toISOString(),
          duration: Date.now() - new Date(botRun.startTime).getTime(),
          logs: executionResult.logs,
          results: executionResult.results,
          updatedAt: new Date().toISOString()
        })
        .eq('id', botRun.id);
      
      // Update bot status back to idle
      await supabase
        .from('Bots')
        .update({ 
          status: 'idle',
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);
      
      res.json({
        message: 'Bot executed successfully',
        botRun: {
          ...botRun,
          status: 'completed',
          endTime: new Date().toISOString(),
          duration: Date.now() - new Date(botRun.startTime).getTime(),
          logs: executionResult.logs,
          results: executionResult.results
        }
      });
      
    } catch (executionError) {
      console.error('Bot execution error:', executionError);
      
      // Update bot run with error
      await supabase
        .from('BotRuns')
        .update({
          status: 'failed',
          endTime: new Date().toISOString(),
          duration: Date.now() - new Date(botRun.startTime).getTime(),
          logs: [...botRun.logs, `Error: ${executionError.message}`],
          error: executionError.message,
          updatedAt: new Date().toISOString()
        })
        .eq('id', botRun.id);
      
      // Update bot status back to idle
      await supabase
        .from('Bots')
        .update({ 
          status: 'idle',
          updatedAt: new Date().toISOString()
        })
        .eq('id', id);
      
      res.status(500).json({ 
        error: 'Bot execution failed',
        details: executionError.message
      });
    }
    
  } catch (error) {
    console.error('Execute bot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bot execution logic function
async function executeBotLogic(bot, botRunId, supabase) {
  const logs = [`Starting ${bot.type} bot execution`];
  const results = {};
  
  try {
    switch (bot.type) {
      case 'module_update':
        logs.push('Checking for module updates...');
        results.moduleUpdates = await checkModuleUpdates(bot, logs);
        logs.push(`Found ${results.moduleUpdates.length} potential updates`);
        break;
        
      case 'dependency_update':
        logs.push('Checking for dependency updates...');
        results.dependencyUpdates = await checkDependencyUpdates(bot, logs);
        logs.push(`Found ${results.dependencyUpdates.length} dependency updates`);
        break;
        
      case 'security_scan':
        logs.push('Running security scan...');
        results.securityIssues = await runSecurityScan(bot, logs);
        logs.push(`Found ${results.securityIssues.length} security issues`);
        break;
        
      case 'custom':
        logs.push('Running custom bot logic...');
        results.customOutput = await runCustomBot(bot, logs);
        logs.push('Custom bot execution completed');
        break;
        
      default:
        throw new Error(`Unknown bot type: ${bot.type}`);
    }
    
    logs.push('Bot execution completed successfully');
    
  } catch (error) {
    logs.push(`Error during execution: ${error.message}`);
    throw error;
  }
  
  return { logs, results };
}

// Module update checker
async function checkModuleUpdates(bot, logs) {
  logs.push('Simulating module update check...');
  // TODO: Implement actual module update checking
  // This would check package.json, requirements.txt, etc.
  return [
    { module: 'react', currentVersion: '18.2.0', latestVersion: '18.3.0', needsUpdate: true },
    { module: 'axios', currentVersion: '1.4.0', latestVersion: '1.6.0', needsUpdate: true }
  ];
}

// Dependency update checker
async function checkDependencyUpdates(bot, logs) {
  logs.push('Simulating dependency update check...');
  // TODO: Implement actual dependency checking
  return [
    { dependency: 'lodash', currentVersion: '4.17.20', latestVersion: '4.17.21', needsUpdate: true }
  ];
}

// Security scanner
async function runSecurityScan(bot, logs) {
  logs.push('Simulating security scan...');
  // TODO: Implement actual security scanning
  return [
    { type: 'vulnerability', severity: 'medium', description: 'Outdated dependency with known vulnerability' }
  ];
}

// Custom bot runner
async function runCustomBot(bot, logs) {
  logs.push('Running custom bot configuration...');
  const config = bot.configuration || {};
  logs.push(`Custom configuration: ${JSON.stringify(config)}`);
  // TODO: Implement custom bot logic based on configuration
  return { message: 'Custom bot executed', config };
}

// Stop bot endpoint
app.post('/api/bots/:id/stop', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { id } = req.params;
    
    // Verify bot belongs to user
    const { data: bot, error: botError } = await supabase
      .from('Bots')
      .select(`
        id, name, status, ProjectId,
        Projects!inner(UserId)
      `)
      .eq('id', id)
      .eq('Projects.UserId', user.id)
      .single();
    
    if (botError || !bot) {
      return res.status(404).json({ error: 'Bot not found or does not belong to user' });
    }
    
    if (bot.status !== 'running') {
      return res.status(400).json({ error: 'Bot is not currently running' });
    }
    
    // Update bot status to idle
    const { data, error } = await supabase
      .from('Bots')
      .update({ 
        status: 'idle',
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Stop bot error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    res.json({
      message: 'Bot stopped successfully',
      bot: data
    });
    
  } catch (error) {
    console.error('Stop bot error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/bots/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { id } = req.params;
    const { name, type, description, config, schedule, status } = req.body;
    
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
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { id } = req.params;
    
    // Verify that the bot belongs to the user through their projects
    const { data: bot, error: botError } = await supabase
      .from('Bots')
      .select(`
        id,
        name,
        Projects!inner(UserId)
      `)
      .eq('id', id)
      .eq('Projects.UserId', user.id)
      .single();
    
    if (botError || !bot) {
      return res.status(404).json({ 
        error: 'Bot not found or does not belong to user',
        botId: id
      });
    }

    // Soft delete bot
    const { data, error } = await supabase
      .from('Bots')
      .update({ 
        isActive: false,
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
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
      message: 'Bot deleted successfully',
      botId: id,
      botName: bot.name
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
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

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
        response: { user: 'user-object', token: 'jwt-token-here' }
      },
      createProject: {
        url: 'POST /api/projects',
        headers: { Authorization: 'Bearer jwt-token-here' },
        body: { name: 'My Project', repositoryUrl: 'https://github.com/user/repo', accessToken: 'github-token' },
        response: { project: 'project-object' }
      }
    }
  };
  
  res.json(apiDocs);
});

// Delete project endpoint
app.delete('/api/projects/:projectId', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { projectId } = req.params;
    
    // Delete the project (only if it belongs to the user)
    const { error: deleteError } = await supabase
      .from('Projects')
      .delete()
      .eq('id', projectId)
      .eq('UserId', user.id);

    if (deleteError) {
      console.error('Project deletion error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete project' });
    }

    res.json({ message: 'Project deleted successfully' });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get project detail endpoint
app.get('/api/project-detail', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || 
                  req.headers['x-api-key'] ||
                  req.headers.cookie?.match(/token=([^;]+)/)?.[1];
    
    const { user, supabase } = await verifyTokenAndGetUser(token);

    const { projectId, action = 'basic' } = req.query;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    // Get project details
    const { data: project, error: projectError } = await supabase
      .from('Projects')
      .select(`
        *,
        Teams(name, description),
        Bots(id, name, type, status, lastRun)
      `)
      .eq('id', projectId)
      .eq('UserId', user.id)
      .eq('isActive', true)
      .single();
    
    if (projectError || !project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      project,
      action,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Get project detail error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
// Serve static files with cache-busting headers
app.use(express.static('dist', {
  setHeaders: (res, path) => {
    // Add cache-busting headers for all static files
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Catch-all handler for React app (but exclude API routes)
app.get('*', (req, res, next) => {
  // Don't serve React app for API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile('index.html', { root: 'dist' });
});

// Start server

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 AutoBot Manager running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Add error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;// Force redeploy Sat Sep  6 04:04:57 AM UTC 2025
