import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../database/connection.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all bots for user's projects
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bots = await Bot.findAll({
      include: [
        {
          model: Project,
          where: { UserId: req.user.id },
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ bots });
  } catch (error) {
    logger.error('Get bots error:', error);
    res.status(500).json({ error: 'Failed to get bots' });
  }
});

// Get bot by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const bot = await Bot.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          where: { UserId: req.user.id },
          attributes: ['id', 'name', 'repositoryUrl']
        },
        {
          model: BotRun,
          order: [['createdAt', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    res.json({ bot });
  } catch (error) {
    logger.error('Get bot error:', error);
    res.status(500).json({ error: 'Failed to get bot' });
  }
});

// Create new bot
router.post('/', authenticateToken, [
  body('name').trim().notEmpty(),
  body('type').isIn(['module_update', 'dependency_update', 'security_scan', 'custom']),
  body('projectId').isUUID(),
  body('configuration').isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, type, projectId, configuration, schedule } = req.body;

    // Verify project belongs to user
    const project = await Project.findOne({
      where: { id: projectId, UserId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const bot = await Bot.create({
      name,
      type,
      ProjectId: projectId,
      configuration,
      schedule
    });

    res.status(201).json({ bot });
  } catch (error) {
    logger.error('Create bot error:', error);
    res.status(500).json({ error: 'Failed to create bot' });
  }
});

// Update bot
router.put('/:id', authenticateToken, [
  body('name').optional().trim().notEmpty(),
  body('configuration').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const bot = await Bot.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          where: { UserId: req.user.id }
        }
      ]
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    await bot.update(req.body);
    res.json({ bot });
  } catch (error) {
    logger.error('Update bot error:', error);
    res.status(500).json({ error: 'Failed to update bot' });
  }
});

// Delete bot
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const bot = await Bot.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          where: { UserId: req.user.id }
        }
      ]
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    await bot.destroy();
    res.json({ message: 'Bot deleted successfully' });
  } catch (error) {
    logger.error('Delete bot error:', error);
    res.status(500).json({ error: 'Failed to delete bot' });
  }
});

// Start bot
router.post('/:id/start', authenticateToken, async (req, res) => {
  try {
    const bot = await Bot.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          where: { UserId: req.user.id }
        }
      ]
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const botSpawner = global.botSpawner;
    await botSpawner.spawnBot(bot.id, req.user.id);

    res.json({ message: 'Bot started successfully' });
  } catch (error) {
    logger.error('Start bot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop bot
router.post('/:id/stop', authenticateToken, async (req, res) => {
  try {
    const bot = await Bot.findByPk(req.params.id, {
      include: [
        {
          model: Project,
          where: { UserId: req.user.id }
        }
      ]
    });

    if (!bot) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const botSpawner = global.botSpawner;
    await botSpawner.stopBot(bot.id);

    res.json({ message: 'Bot stopped successfully' });
  } catch (error) {
    logger.error('Stop bot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get bot runs
router.get('/:id/runs', authenticateToken, async (req, res) => {
  try {
    const runs = await BotRun.findAll({
      where: { BotId: req.params.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    res.json({ runs });
  } catch (error) {
    logger.error('Get bot runs error:', error);
    res.status(500).json({ error: 'Failed to get bot runs' });
  }
});

export default router;