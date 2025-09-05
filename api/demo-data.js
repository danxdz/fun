// Demo data for when Supabase is not configured
export const demoProjects = [
  {
    id: 'demo-project-1',
    name: 'AutoBot Demo Project',
    description: 'A sample project to demonstrate AutoBot Manager functionality',
    repositoryUrl: 'https://github.com/danxdz/fun',
    repositoryType: 'github',
    status: 'active',
    team: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    githubData: {
      stars: 42,
      forks: 8,
      openIssues: 3,
      language: 'JavaScript',
      defaultBranch: 'main'
    }
  },
  {
    id: 'demo-project-2',
    name: 'React Components Library',
    description: 'A collection of reusable React components',
    repositoryUrl: 'https://github.com/demo/react-components',
    repositoryType: 'github',
    status: 'active',
    team: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    githubData: {
      stars: 156,
      forks: 23,
      openIssues: 7,
      language: 'TypeScript',
      defaultBranch: 'main'
    }
  }
];

export const demoBots = [
  {
    id: 'demo-bot-1',
    name: 'Dependency Updater',
    type: 'dependency_update',
    status: 'completed',
    config: {
      updateStrategy: 'patch',
      autoMerge: false
    },
    project: {
      id: 'demo-project-1',
      name: 'AutoBot Demo Project',
      repositoryUrl: 'https://github.com/danxdz/fun'
    },
    BotRuns: [
      {
        id: 'run-1',
        status: 'completed',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3000000).toISOString(),
        logs: 'Bot started...\nAnalyzing package.json...\nFound 3 outdated dependencies\nUpdating dependencies...\nCreating branch: autobot/dependency-update-1234567890\nCommitting changes...\nPushing to GitHub...\nBot completed successfully!',
        results: {
          branch: 'autobot/dependency-update-1234567890',
          updates: {
            'react': '^18.2.0',
            'axios': '^1.4.0',
            'lodash': '^4.17.21'
          },
          analysis: 'Updated React to latest stable version, upgraded Axios for security patches, and updated Lodash for performance improvements.'
        }
      }
    ],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3000000).toISOString()
  },
  {
    id: 'demo-bot-2',
    name: 'Security Scanner',
    type: 'security_scan',
    status: 'running',
    config: {
      scanDepth: 'deep',
      autoFix: true
    },
    project: {
      id: 'demo-project-2',
      name: 'React Components Library',
      repositoryUrl: 'https://github.com/demo/react-components'
    },
    BotRuns: [
      {
        id: 'run-2',
        status: 'running',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
        logs: 'Bot started...\nCloning repository...\nScanning for security vulnerabilities...\nAnalyzing dependencies...\nChecking for hardcoded secrets...\nScanning for SQL injection vulnerabilities...',
        results: null
      }
    ],
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString()
  },
  {
    id: 'demo-bot-3',
    name: 'Module Refactorer',
    type: 'module_update',
    status: 'idle',
    config: {
      templateType: 'component',
      autoCommit: true
    },
    project: {
      id: 'demo-project-1',
      name: 'AutoBot Demo Project',
      repositoryUrl: 'https://github.com/danxdz/fun'
    },
    BotRuns: [
      {
        id: 'run-3',
        status: 'failed',
        createdAt: new Date(Date.now() - 10800000).toISOString(),
        completedAt: new Date(Date.now() - 10200000).toISOString(),
        logs: 'Bot started...\nAnalyzing codebase...\nError: Unable to access repository\nBot failed: Repository access denied',
        results: {
          error: 'Repository access denied - please check GitHub token permissions'
        }
      }
    ],
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    updatedAt: new Date(Date.now() - 10200000).toISOString()
  }
];

export const demoDashboardData = {
  statistics: {
    projects: {
      total: demoProjects.length,
      active: demoProjects.filter(p => p.status === 'active').length,
      github: demoProjects.filter(p => p.githubData).length
    },
    bots: {
      total: demoBots.length,
      running: demoBots.filter(b => b.status === 'running').length,
      completed: demoBots.filter(b => b.status === 'completed').length,
      failed: demoBots.filter(b => b.status === 'error' || b.status === 'failed').length,
      byType: {
        dependency_update: demoBots.filter(b => b.type === 'dependency_update').length,
        security_scan: demoBots.filter(b => b.type === 'security_scan').length,
        module_update: demoBots.filter(b => b.type === 'module_update').length
      }
    },
    runs: {
      total: demoBots.reduce((acc, bot) => acc + bot.BotRuns.length, 0),
      completed: demoBots.reduce((acc, bot) => acc + bot.BotRuns.filter(run => run.status === 'completed').length, 0),
      failed: demoBots.reduce((acc, bot) => acc + bot.BotRuns.filter(run => run.status === 'failed').length, 0),
      running: demoBots.reduce((acc, bot) => acc + bot.BotRuns.filter(run => run.status === 'running').length, 0)
    },
    github: {
      totalStars: demoProjects.reduce((sum, p) => sum + (p.githubData?.stars || 0), 0),
      totalForks: demoProjects.reduce((sum, p) => sum + (p.githubData?.forks || 0), 0),
      totalIssues: demoProjects.reduce((sum, p) => sum + (p.githubData?.openIssues || 0), 0)
    }
  },
  weeklyActivity: [
    { date: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0], runs: 3, completed: 2, failed: 1 },
    { date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], runs: 5, completed: 4, failed: 1 },
    { date: new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0], runs: 2, completed: 2, failed: 0 },
    { date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], runs: 7, completed: 6, failed: 1 },
    { date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], runs: 4, completed: 3, failed: 1 },
    { date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], runs: 6, completed: 5, failed: 1 },
    { date: new Date().toISOString().split('T')[0], runs: 2, completed: 1, failed: 0 }
  ],
  recentActivity: [
    {
      id: 'activity-1',
      type: 'bot_run',
      title: 'Bot "Security Scanner" running',
      description: 'security scan bot execution',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      status: 'running'
    },
    {
      id: 'activity-2',
      type: 'bot_run',
      title: 'Bot "Dependency Updater" completed',
      description: 'dependency update bot execution',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      status: 'completed'
    },
    {
      id: 'activity-3',
      type: 'project',
      title: 'Project "React Components Library" created',
      description: 'New project added to AutoBot Manager',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      status: 'info'
    }
  ],
  projects: demoProjects,
  bots: demoBots
};