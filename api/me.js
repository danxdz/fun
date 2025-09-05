import jwt from 'jsonwebtoken';

// Simple in-memory storage for demo (same as auth.js)
let users = [
  {
    id: 'demo-user-1',
    email: 'demo@autobot.com',
    password_hash: '$2a$12$v46E.V7dKcG9wnTBtN8QROJwgKf0a94r54ZbMWDQ773/ZkgjR8HlS', // password: demo123
    first_name: 'Demo',
    last_name: 'User',
    role: 'user',
    is_active: true,
    created_at: new Date().toISOString(),
    last_login: null,
    preferences: {}
  }
];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Get user from in-memory storage
      const user = users.find(u => u.id === decoded.userId && u.is_active);
      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          lastLogin: user.last_login,
          preferences: user.preferences
        }
      });
    } catch (error) {
      console.error('Me endpoint error:', error);
      res.status(401).json({ error: 'Invalid token' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}