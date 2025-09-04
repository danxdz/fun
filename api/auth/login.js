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

// Login endpoint
app.post('/', async (req, res) => {
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

export default app;