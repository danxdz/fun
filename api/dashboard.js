import { supabase } from '../lib/supabase.js';
import { demoDashboardData } from './demo-data.js';
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
      // Check if Supabase is available, otherwise use demo data
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        // Return demo data without authentication for demo mode
        res.status(200).json(demoDashboardData);
        return;
      }

      // For Supabase mode, authenticate user
      const user = await authenticateUser(req);

      // Get user's projects from Supabase
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, name, status, created_at, github_data')
        .or(`created_by.eq.${user.id},team_id.in.(
          SELECT team_id FROM team_members WHERE user_id = '${user.id}'
        )`);

      if (projectsError) {
        console.error('Projects fetch error:', projectsError);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }

      // Get user's bots
      const { data: bots, error: botsError } = await supabase
        .from('bots')
        .select(`
          id,
          name,
          type,
          status,
          created_at,
          updated_at,
          projects (
            id,
            name
          )
        `)
        .or(`created_by.eq.${user.id},project_id.in.(
          SELECT id FROM projects WHERE created_by = '${user.id}' OR team_id IN (
            SELECT team_id FROM team_members WHERE user_id = '${user.id}'
          )
        )`);

      if (botsError) {
        console.error('Bots fetch error:', botsError);
        return res.status(500).json({ error: 'Failed to fetch bots' });
      }

      // Get bot runs for statistics
      const { data: botRuns, error: botRunsError } = await supabase
        .from('bot_runs')
        .select(`
          id,
          status,
          started_at,
          completed_at,
          bots (
            id,
            name,
            type
          )
        `)
        .in('bot_id', bots.map(bot => bot.id))
        .order('started_at', { ascending: false })
        .limit(100);

      if (botRunsError) {
        console.error('Bot runs fetch error:', botRunsError);
        return res.status(500).json({ error: 'Failed to fetch bot runs' });
      }

      // Calculate statistics
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'active').length;
      const totalBots = bots.length;
      const runningBots = bots.filter(b => b.status === 'running').length;
      const completedBots = bots.filter(b => b.status === 'completed').length;
      const failedBots = bots.filter(b => b.status === 'error' || b.status === 'failed').length;

      // Bot run statistics
      const totalRuns = botRuns.length;
      const completedRuns = botRuns.filter(run => run.status === 'completed').length;
      const failedRuns = botRuns.filter(run => run.status === 'failed' || run.status === 'error').length;
      const runningRuns = botRuns.filter(run => run.status === 'running').length;

      // GitHub statistics
      const githubProjects = projects.filter(p => p.github_data);
      const totalStars = githubProjects.reduce((sum, p) => sum + (p.github_data.stars || 0), 0);
      const totalForks = githubProjects.reduce((sum, p) => sum + (p.github_data.forks || 0), 0);
      const totalIssues = githubProjects.reduce((sum, p) => sum + (p.github_data.openIssues || 0), 0);

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const recentRuns = botRuns.filter(run => 
        new Date(run.started_at) >= sevenDaysAgo
      );

      // Weekly activity data
      const weeklyActivity = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        
        const dayRuns = recentRuns.filter(run => {
          const runDate = new Date(run.started_at);
          return runDate >= dayStart && runDate < dayEnd;
        });
        
        weeklyActivity.push({
          date: dayStart.toISOString().split('T')[0],
          runs: dayRuns.length,
          completed: dayRuns.filter(run => run.status === 'completed').length,
          failed: dayRuns.filter(run => run.status === 'failed' || run.status === 'error').length
        });
      }

      // Bot type distribution
      const botTypeStats = {};
      bots.forEach(bot => {
        botTypeStats[bot.type] = (botTypeStats[bot.type] || 0) + 1;
      });

      // Recent activity items
      const recentActivity = [
        ...recentRuns.slice(0, 10).map(run => ({
          id: run.id,
          type: 'bot_run',
          title: `Bot "${run.bots.name}" ${run.status}`,
          description: `${run.bots.type.replace('_', ' ')} bot execution`,
          timestamp: run.started_at,
          status: run.status
        })),
        ...projects.slice(0, 5).map(project => ({
          id: project.id,
          type: 'project',
          title: `Project "${project.name}" created`,
          description: 'New project added to AutoBot Manager',
          timestamp: project.created_at,
          status: 'info'
        }))
      ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);

      res.status(200).json({
        statistics: {
          projects: {
            total: totalProjects,
            active: activeProjects,
            github: githubProjects.length
          },
          bots: {
            total: totalBots,
            running: runningBots,
            completed: completedBots,
            failed: failedBots,
            byType: botTypeStats
          },
          runs: {
            total: totalRuns,
            completed: completedRuns,
            failed: failedRuns,
            running: runningRuns
          },
          github: {
            totalStars,
            totalForks,
            totalIssues
          }
        },
        weeklyActivity,
        recentActivity,
        projects: projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          createdAt: p.created_at,
          githubData: p.github_data
        })),
        bots: bots.map(b => ({
          id: b.id,
          name: b.name,
          type: b.type,
          status: b.status,
          project: b.projects,
          createdAt: b.created_at,
          updatedAt: b.updated_at
        }))
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Dashboard API error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}