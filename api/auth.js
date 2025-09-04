import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

// Register endpoint (simplified without database)
app.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Simple validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // For now, just return success without database
    res.status(201).json({
      message: 'User created successfully (demo mode)',
      token: 'demo-token-' + Date.now(),
      user: {
        id: 'demo-' + Date.now(),
        email,
        firstName,
        lastName,
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login endpoint (simplified without database)
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // For demo purposes, accept any valid email/password
    res.json({
      message: 'Login successful (demo mode)',
      token: 'demo-token-' + Date.now(),
      user: {
        id: 'demo-' + Date.now(),
        email,
        firstName: 'Demo',
        lastName: 'User',
        role: 'user'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'API is running in demo mode'
  });
});

export default app;