export default function handler(req, res) {
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
    
    // Simple validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // For demo purposes, accept any valid email/password
    res.status(200).json({
      message: 'Authentication successful (demo mode)',
      token: 'demo-token-' + Date.now(),
      user: {
        id: 'demo-' + Date.now(),
        email,
        firstName: firstName || 'Demo',
        lastName: lastName || 'User',
        role: 'user'
      }
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}