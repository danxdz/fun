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

// Register endpoint
app.post('/', async (req, res) => {
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

export default app;