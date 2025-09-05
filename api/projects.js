import { supabase } from '../lib/supabase.js';
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
    const { method } = req;

    if (method === 'GET') {
      // Get user's projects
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
        updatedAt: project.updated_at
      }));

      res.status(200).json({ projects: formattedProjects });
    } else if (method === 'POST') {
      // Create new project
      const { name, description, repositoryUrl, repositoryType, teamId } = req.body;
      
      if (!name || !repositoryUrl) {
        return res.status(400).json({ error: 'Name and repository URL are required' });
      }

      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          name,
          description: description || '',
          repository_url: repositoryUrl,
          repository_type: repositoryType || 'github',
          status: 'active',
          team_id: teamId || null,
          created_by: user.id
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
        updatedAt: newProject.updated_at
      };

      res.status(201).json({ project: formattedProject });
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