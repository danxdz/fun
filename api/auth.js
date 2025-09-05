import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Simple in-memory storage for demo (replace with Supabase when configured)
let users = [
  {
    id: 'demo-user-1',
    email: 'demo@autobot.com',
    password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8.5K5G.', // password: demo123
    first_name: 'Demo',
    last_name: 'User',
    role: 'user',
    is_active: true,
    created_at: new Date().toISOString(),
    last_login: null
  }
];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;

  if (method === 'POST') {
    const { email, password, firstName, lastName } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    try {
      // Check if this is a registration (has firstName/lastName) or login
      if (firstName && lastName) {
        // Registration
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
          return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const newUser = {
          id: `user-${Date.now()}`,
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          role: 'user',
          is_active: true,
          created_at: new Date().toISOString(),
          last_login: null
        };

        users.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
          { userId: newUser.id },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        res.status(201).json({
          message: 'User created successfully',
          token,
          user: {
            id: newUser.id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role
          }
        });
      } else {
        // Login
        const user = users.find(u => u.email === email && u.is_active);
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        user.last_login = new Date().toISOString();

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        res.status(200).json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
          }
        });
      }
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ error: 'Authentication failed: ' + error.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}