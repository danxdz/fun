import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { Project, Bot, GitBranch, ModuleUpdate } from '../models/index.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Get all projects for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.findAll({
      where: { UserId: req.user.id },
      include: [
        {
          model: Bot,
          attributes: ['id', 'name', 'status', 'type']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ projects });
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// Get project by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      where: { UserId: req.user.id },
      include: [
        {
          model: Bot,
          include: [
            {
              model: BotRun,
              order: [['createdAt', 'DESC']],
              limit: 5
            }
          ]
        },
        {
          model: GitBranch,
          order: [['createdAt', 'DESC']],
          limit: 10
        },
        {
          model: ModuleUpdate,
          order: [['createdAt', 'DESC']],
          limit: 20
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    logger.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

// Create new project
router.post('/', authenticateToken, [
  body('name').trim().notEmpty(),
  body('repositoryUrl').isURL(),
  body('repositoryType').isIn(['github', 'gitlab', 'bitbucket']),
  body('accessToken').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, repositoryUrl, repositoryType, accessToken, defaultBranch } = req.body;

    const project = await Project.create({
      name,
      description,
      repositoryUrl,
      repositoryType,
      accessToken,
      defaultBranch: defaultBranch || 'main',
      UserId: req.user.id
    });

    res.status(201).json({ project });
  } catch (error) {
    logger.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authenticateToken, [
  body('name').optional().trim().notEmpty(),
  body('repositoryUrl').optional().isURL()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const project = await Project.findOne({
      where: { id: req.params.id, UserId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.update(req.body);
    res.json({ project });
  } catch (error) {
    logger.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      where: { id: req.params.id, UserId: req.user.id }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await project.destroy();
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get project branches
router.get('/:id/branches', authenticateToken, async (req, res) => {
  try {
    const branches = await GitBranch.findAll({
      where: { ProjectId: req.params.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({ branches });
  } catch (error) {
    logger.error('Get branches error:', error);
    res.status(500).json({ error: 'Failed to get branches' });
  }
});

// Get project module updates
router.get('/:id/modules', authenticateToken, async (req, res) => {
  try {
    const modules = await ModuleUpdate.findAll({
      where: { ProjectId: req.params.id },
      order: [['createdAt', 'DESC']]
    });

    res.json({ modules });
  } catch (error) {
    logger.error('Get modules error:', error);
    res.status(500).json({ error: 'Failed to get modules' });
  }
});

export default router;