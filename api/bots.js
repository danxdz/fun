import { supabase } from '../lib/supabase.js';
import CursorBot from '../lib/cursorBot.js';
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
      // Get user's bots
      const { data: bots, error } = await supabase
        .from('bots')
        .select(`
          id,
          name,
          type,
          status,
          config,
          created_at,
          updated_at,
          projects (
            id,
            name,
            repository_url
          ),
          bot_runs (
            id,
            status,
            started_at,
            completed_at,
            logs
          )
        `)
        .or(`created_by.eq.${user.id},project_id.in.(
          SELECT id FROM projects WHERE created_by = '${user.id}' OR team_id IN (
            SELECT team_id FROM team_members WHERE user_id = '${user.id}'
          )
        )`);

      if (error) {
        console.error('Bots fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch bots' });
      }

      const formattedBots = bots.map(bot => ({
        id: bot.id,
        name: bot.name,
        type: bot.type,
        status: bot.status,
        config: bot.config,
        project: bot.projects,
        BotRuns: bot.bot_runs || [],
        createdAt: bot.created_at,
        updatedAt: bot.updated_at
      }));

      res.status(200).json({ bots: formattedBots });
    } else if (method === 'POST') {
      const { action, botId, ...botData } = req.body;

      if (action === 'create') {
        // Create new bot
        const { name, type, projectId, config } = botData;
        
        if (!name || !type || !projectId) {
          return res.status(400).json({ error: 'Name, type, and project ID are required' });
        }

        // Verify user has access to the project
        const { data: project } = await supabase
          .from('projects')
          .select('id')
          .eq('id', projectId)
          .or(`created_by.eq.${user.id},team_id.in.(
            SELECT team_id FROM team_members WHERE user_id = '${user.id}'
          )`)
          .single();

        if (!project) {
          return res.status(403).json({ error: 'Access denied to project' });
        }

        const { data: newBot, error: createError } = await supabase
          .from('bots')
          .insert({
            name,
            type,
            status: 'idle',
            project_id: projectId,
            config: config || {},
            created_by: user.id
          })
          .select(`
            id,
            name,
            type,
            status,
            config,
            created_at,
            updated_at,
            projects (
              id,
              name,
              repository_url
            )
          `)
          .single();

        if (createError) {
          console.error('Bot creation error:', createError);
          return res.status(500).json({ error: 'Failed to create bot' });
        }

        const formattedBot = {
          id: newBot.id,
          name: newBot.name,
          type: newBot.type,
          status: newBot.status,
          config: newBot.config,
          project: newBot.projects,
          BotRuns: [],
          createdAt: newBot.created_at,
          updatedAt: newBot.updated_at
        };

        res.status(201).json({ bot: formattedBot });
      } else if (action === 'start') {
        // Start bot execution
        if (!botId) {
          return res.status(400).json({ error: 'Bot ID is required' });
        }

        // Get bot details
        const { data: bot, error: botError } = await supabase
          .from('bots')
          .select(`
            id,
            name,
            type,
            status,
            config,
            project_id,
            projects (
              id,
              name,
              repository_url
            )
          `)
          .eq('id', botId)
          .single();

        if (botError || !bot) {
          return res.status(404).json({ error: 'Bot not found' });
        }

        // Check if user has access to the bot
        const { data: botAccess } = await supabase
          .from('bots')
          .select('id')
          .eq('id', botId)
          .or(`created_by.eq.${user.id},project_id.in.(
            SELECT id FROM projects WHERE created_by = '${user.id}' OR team_id IN (
              SELECT team_id FROM team_members WHERE user_id = '${user.id}'
            )
          )`)
          .single();

        if (!botAccess) {
          return res.status(403).json({ error: 'Access denied to bot' });
        }

        // Update bot status to running
        await supabase
          .from('bots')
          .update({ status: 'running', updated_at: new Date().toISOString() })
          .eq('id', botId);

        // Start bot execution in background
        const cursorBot = new CursorBot();
        
        // Run bot asynchronously
        cursorBot.runBot(botId, bot.project_id, bot.type, bot.config)
          .then(async (result) => {
            // Update bot status to completed
            await supabase
              .from('bots')
              .update({ status: 'completed', updated_at: new Date().toISOString() })
              .eq('id', botId);
            
            console.log(`Bot ${botId} completed successfully:`, result);
          })
          .catch(async (error) => {
            // Update bot status to error
            await supabase
              .from('bots')
              .update({ status: 'error', updated_at: new Date().toISOString() })
              .eq('id', botId);
            
            console.error(`Bot ${botId} failed:`, error);
          });

        res.status(200).json({ 
          message: 'Bot started successfully',
          bot: {
            id: bot.id,
            name: bot.name,
            type: bot.type,
            status: 'running',
            project: bot.projects
          }
        });
      } else if (action === 'stop') {
        // Stop bot execution
        if (!botId) {
          return res.status(400).json({ error: 'Bot ID is required' });
        }

        // Update bot status to idle
        const { error: updateError } = await supabase
          .from('bots')
          .update({ status: 'idle', updated_at: new Date().toISOString() })
          .eq('id', botId);

        if (updateError) {
          console.error('Bot stop error:', updateError);
          return res.status(500).json({ error: 'Failed to stop bot' });
        }

        res.status(200).json({ message: 'Bot stopped successfully' });
      } else {
        res.status(400).json({ error: 'Invalid action' });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Bots API error:', error);
    if (error.message === 'No token provided' || error.message === 'Invalid token') {
      return res.status(401).json({ error: error.message });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
}