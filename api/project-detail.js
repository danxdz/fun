import { supabase } from '../lib/supabase.js';
import GitHubService from '../lib/githubService.js';
import jwt from 'jsonwebtoken';

async function authenticateUser(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role')
    .eq('id', decoded.userId)
    .eq('is_active', true)
    .single();

  if (error || !user) {
    throw new Error('Invalid token');
  }

  return user;
}

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

  try {
    const user = await authenticateUser(req);
    const { method, query } = req;
    const { projectId, action } = query;

    if (method === 'GET') {
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Get project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select(`
          id,
          name,
          description,
          repository_url,
          repository_type,
          status,
          created_at,
          updated_at,
          github_data,
          teams (
            id,
            name
          )
        `)
        .eq('id', projectId)
        .or(`created_by.eq.${user.id},team_id.in.(
          SELECT team_id FROM team_members WHERE user_id = '${user.id}'
        )`)
        .single();

      if (projectError || !project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      if (action === 'github-info' && project.repository_type === 'github') {
        // Get detailed GitHub information
        const githubService = new GitHubService();
        
        // Extract owner/repo from URL
        const urlMatch = project.repository_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!urlMatch) {
          return res.status(400).json({ error: 'Invalid GitHub repository URL' });
        }

        const [, owner, repo] = urlMatch;

        // Get repository details
        const repoResult = await githubService.getRepository(owner, repo);
        if (!repoResult.success) {
          return res.status(500).json({ error: repoResult.error });
        }

        // Get branches
        const branchesResult = await githubService.getRepositoryBranches(owner, repo);
        const branches = branchesResult.success ? branchesResult.branches : [];

        // Get recent commits
        const commitsResult = await githubService.getRepositoryCommits(owner, repo, 'main', 10);
        const commits = commitsResult.success ? commitsResult.commits : [];

        // Get issues
        const issuesResult = await githubService.getRepositoryIssues(owner, repo, 'open');
        const issues = issuesResult.success ? issuesResult.issues : [];

        // Get bots for this project
        const { data: bots, error: botsError } = await supabase
          .from('bots')
          .select(`
            id,
            name,
            type,
            status,
            config,
            created_at,
            updated_at,
            bot_runs (
              id,
              status,
              started_at,
              completed_at,
              logs
            )
          `)
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        const formattedBots = bots?.map(bot => ({
          id: bot.id,
          name: bot.name,
          type: bot.type,
          status: bot.status,
          config: bot.config,
          createdAt: bot.created_at,
          updatedAt: bot.updated_at,
          runs: bot.bot_runs || []
        })) || [];

        res.status(200).json({
          project: {
            id: project.id,
            name: project.name,
            description: project.description,
            repositoryUrl: project.repository_url,
            repositoryType: project.repository_type,
            status: project.status,
            team: project.teams,
            createdAt: project.created_at,
            updatedAt: project.updated_at,
            githubData: project.github_data
          },
          githubInfo: {
            repository: repoResult.repository,
            branches,
            commits,
            issues
          },
          bots: formattedBots
        });
      } else {
        // Get basic project info
        const formattedProject = {
          id: project.id,
          name: project.name,
          description: project.description,
          repositoryUrl: project.repository_url,
          repositoryType: project.repository_type,
          status: project.status,
          team: project.teams,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
          githubData: project.github_data
        };

        res.status(200).json({ project: formattedProject });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Project detail API error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}