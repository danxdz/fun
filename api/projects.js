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

  const { method } = req;

  if (method === 'GET') {
    // Return demo projects
    const projects = [
      {
        id: 'demo-project-1',
        name: 'React Dashboard',
        description: 'A modern React dashboard with real-time updates',
        repositoryUrl: 'https://github.com/demo/react-dashboard',
        repositoryType: 'github',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'demo-project-2',
        name: 'Node.js API',
        description: 'RESTful API built with Node.js and Express',
        repositoryUrl: 'https://github.com/demo/node-api',
        repositoryType: 'github',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'demo-project-3',
        name: 'Vue.js Frontend',
        description: 'Single page application built with Vue.js',
        repositoryUrl: 'https://github.com/demo/vue-frontend',
        repositoryType: 'github',
        status: 'inactive',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    res.status(200).json({ projects });
  } else if (method === 'POST') {
    // Create new project
    const { name, description, repositoryUrl, repositoryType } = req.body;
    
    if (!name || !repositoryUrl) {
      return res.status(400).json({ error: 'Name and repository URL are required' });
    }

    const newProject = {
      id: 'demo-project-' + Date.now(),
      name,
      description: description || '',
      repositoryUrl,
      repositoryType: repositoryType || 'github',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({ project: newProject });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}