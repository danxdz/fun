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
    // Return demo bots
    const bots = [
      {
        id: 'demo-bot-1',
        name: 'Dependency Updater',
        type: 'dependency_update',
        status: 'running',
        projectId: 'demo-project-1',
        config: {
          updateStrategy: 'patch',
          autoMerge: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        BotRuns: [
          {
            id: 'run-1',
            status: 'completed',
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            completedAt: new Date(Date.now() - 3000000).toISOString()
          },
          {
            id: 'run-2',
            status: 'running',
            createdAt: new Date(Date.now() - 1800000).toISOString()
          }
        ]
      },
      {
        id: 'demo-bot-2',
        name: 'Security Scanner',
        type: 'security_scan',
        status: 'idle',
        projectId: 'demo-project-2',
        config: {
          scanDepth: 'deep',
          autoFix: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        BotRuns: [
          {
            id: 'run-3',
            status: 'completed',
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            completedAt: new Date(Date.now() - 6000000).toISOString()
          }
        ]
      },
      {
        id: 'demo-bot-3',
        name: 'Module Generator',
        type: 'module_update',
        status: 'error',
        projectId: 'demo-project-3',
        config: {
          templateType: 'component',
          autoCommit: true
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        BotRuns: [
          {
            id: 'run-4',
            status: 'failed',
            createdAt: new Date(Date.now() - 10800000).toISOString(),
            completedAt: new Date(Date.now() - 10200000).toISOString()
          }
        ]
      }
    ];

    res.status(200).json({ bots });
  } else if (method === 'POST') {
    // Create new bot
    const { name, type, projectId, config } = req.body;
    
    if (!name || !type || !projectId) {
      return res.status(400).json({ error: 'Name, type, and project ID are required' });
    }

    const newBot = {
      id: 'demo-bot-' + Date.now(),
      name,
      type,
      status: 'idle',
      projectId,
      config: config || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      BotRuns: []
    };

    res.status(201).json({ bot: newBot });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}