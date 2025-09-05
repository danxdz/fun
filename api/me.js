export default function handler(req, res) {
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
    // For demo purposes, return a demo user
    res.status(200).json({
      user: {
        id: 'demo-user-123',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'user'
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}