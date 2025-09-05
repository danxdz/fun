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
      const { botId } = req.query;

      if (botId) {
        // Get runs for a specific bot
        const { data: runs, error } = await supabase
          .from('bot_runs')
          .select(`
            id,
            status,
            started_at,
            completed_at,
            logs,
            results,
            bots (
              id,
              name,
              type,
              projects (
                id,
                name
              )
            )
          `)
          .eq('bot_id', botId)
          .order('started_at', { ascending: false });

        if (error) {
          console.error('Bot runs fetch error:', error);
          return res.status(500).json({ error: 'Failed to fetch bot runs' });
        }

        const formattedRuns = runs.map(run => ({
          id: run.id,
          status: run.status,
          startedAt: run.started_at,
          completedAt: run.completed_at,
          logs: run.logs,
          results: run.results,
          bot: run.bots
        }));

        res.status(200).json({ runs: formattedRuns });
      } else {
        // Get all runs for user's bots
        const { data: runs, error } = await supabase
          .from('bot_runs')
          .select(`
            id,
            status,
            started_at,
            completed_at,
            logs,
            results,
            bots (
              id,
              name,
              type,
              projects (
                id,
                name
              )
            )
          `)
          .in('bot_id', 
            supabase
              .from('bots')
              .select('id')
              .or(`created_by.eq.${user.id},project_id.in.(
                SELECT id FROM projects WHERE created_by = '${user.id}' OR team_id IN (
                  SELECT team_id FROM team_members WHERE user_id = '${user.id}'
                )
              )`)
          )
          .order('started_at', { ascending: false })
          .limit(50);

        if (error) {
          console.error('Bot runs fetch error:', error);
          return res.status(500).json({ error: 'Failed to fetch bot runs' });
        }

        const formattedRuns = runs.map(run => ({
          id: run.id,
          status: run.status,
          startedAt: run.started_at,
          completedAt: run.completed_at,
          logs: run.logs,
          results: run.results,
          bot: run.bots
        }));

        res.status(200).json({ runs: formattedRuns });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Bot runs API error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}