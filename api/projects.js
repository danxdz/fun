import { supabase } from '../lib/supabase.js';
import GitHubService from '../lib/githubService.js';
import { demoProjects } from './demo-data.js';
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
    const { method } = req;

    if (method === 'GET') {
      const { action } = req.query;

      if (action === 'github-repos') {
        // Get user's GitHub repositories
        const githubService = new GitHubService();
        const result = await githubService.getUserRepositories();
        
        if (!result.success) {
          return res.status(500).json({ error: result.error });
        }

        res.status(200).json({ repositories: result.repositories });
      } else {
        // Check if Supabase is available, otherwise use demo data
        if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
          // Return demo data without authentication for demo mode
          res.status(200).json({ projects: demoProjects });
          return;
        }

        // For Supabase mode, authenticate user
        const user = await authenticateUser(req);

        // Get user's projects from Supabase
        const { data: projects, error } = await supabase
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
          .or(`created_by.eq.${user.id},team_id.in.(
            SELECT team_id FROM team_members WHERE user_id = '${user.id}'
          )`);

        if (error) {
          console.error('Projects fetch error:', error);
          return res.status(500).json({ error: 'Failed to fetch projects' });
        }

        const formattedProjects = projects.map(project => ({
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
        }));

        res.status(200).json({ projects: formattedProjects });
      }
    } else if (method === 'POST') {
      const { action, ...projectData } = req.body;

      if (action === 'create-github') {
        // Create new GitHub repository and project
        const { name, description, isPrivate, templateType } = projectData;
        
        if (!name) {
          return res.status(400).json({ error: 'Repository name is required' });
        }

        const githubService = new GitHubService();
        
        // Create GitHub repository
        const repoResult = await githubService.createRepository(name, description, isPrivate);
        
        if (!repoResult.success) {
          return res.status(500).json({ error: repoResult.error });
        }

        // Setup repository with template
        const setupResult = await githubService.cloneAndSetupRepository(
          repoResult.repository.cloneUrl,
          name,
          templateType || 'basic'
        );

        if (!setupResult.success) {
          console.warn('Repository setup failed:', setupResult.error);
          // Continue anyway, repository was created
        }

        // Create project in database
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            name,
            description: description || `AutoBot managed repository: ${name}`,
            repository_url: repoResult.repository.url,
            repository_type: 'github',
            status: 'active',
            created_by: user.id,
            github_data: repoResult.repository
          })
          .select(`
            id,
            name,
            description,
            repository_url,
            repository_type,
            status,
            created_at,
            updated_at,
            teams (
              id,
              name
            )
          `)
          .single();

        if (createError) {
          console.error('Project creation error:', createError);
          return res.status(500).json({ error: 'Failed to create project' });
        }

        const formattedProject = {
          id: newProject.id,
          name: newProject.name,
          description: newProject.description,
          repositoryUrl: newProject.repository_url,
          repositoryType: newProject.repository_type,
          status: newProject.status,
          team: newProject.teams,
          createdAt: newProject.created_at,
          updatedAt: newProject.updated_at,
          githubData: repoResult.repository
        };

        res.status(201).json({ 
          project: formattedProject,
          repository: repoResult.repository,
          setupSuccess: setupResult.success
        });
      } else if (action === 'import-github') {
        // Import existing GitHub repository
        const { repositoryUrl, name, description, teamId } = projectData;
        
        if (!repositoryUrl) {
          return res.status(400).json({ error: 'Repository URL is required' });
        }

        // Extract owner/repo from URL
        const urlMatch = repositoryUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
        if (!urlMatch) {
          return res.status(400).json({ error: 'Invalid GitHub repository URL' });
        }

        const [, owner, repo] = urlMatch;
        const githubService = new GitHubService();
        
        // Get repository info
        const repoResult = await githubService.getRepository(owner, repo);
        
        if (!repoResult.success) {
          return res.status(500).json({ error: repoResult.error });
        }

        // Verify user has access to the team (if specified)
        if (teamId) {
          const { data: teamAccess } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', teamId)
            .eq('user_id', user.id)
            .single();

          if (!teamAccess) {
            return res.status(403).json({ error: 'Access denied to team' });
          }
        }

        // Create project in database
        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            name: name || repoResult.repository.name,
            description: description || repoResult.repository.description,
            repository_url: repositoryUrl,
            repository_type: 'github',
            status: 'active',
            created_by: user.id,
            team_id: teamId || null,
            github_data: repoResult.repository
          })
          .select(`
            id,
            name,
            description,
            repository_url,
            repository_type,
            status,
            created_at,
            updated_at,
            teams (
              id,
              name
            )
          `)
          .single();

        if (createError) {
          console.error('Project creation error:', createError);
          return res.status(500).json({ error: 'Failed to create project' });
        }

        const formattedProject = {
          id: newProject.id,
          name: newProject.name,
          description: newProject.description,
          repositoryUrl: newProject.repository_url,
          repositoryType: newProject.repository_type,
          status: newProject.status,
          team: newProject.teams,
          createdAt: newProject.created_at,
          updatedAt: newProject.updated_at,
          githubData: repoResult.repository
        };

        res.status(201).json({ 
          project: formattedProject,
          repository: repoResult.repository
        });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Projects API error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}