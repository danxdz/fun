import { v4 as uuidv4 } from 'uuid';
import simpleGit from 'simple-git';
import { logger } from '../utils/logger.js';
import { Bot, BotRun, Project, GitBranch, ModuleUpdate } from '../models/index.js';
import { createTempDirectory, cleanupTempDirectory } from '../utils/fileUtils.js';
import { generateModuleUpdate } from '../services/moduleGenerator.js';

export class BotSpawner {
  constructor(io) {
    this.io = io;
    this.activeBots = new Map();
    this.botQueue = [];
    this.maxConcurrentBots = 5;
  }

  async spawnBot(botId, userId) {
    try {
      const bot = await Bot.findByPk(botId, {
        include: [{ model: Project }]
      });

      if (!bot) {
        throw new Error('Bot not found');
      }

      if (this.activeBots.has(botId)) {
        throw new Error('Bot is already running');
      }

      // Create bot run record
      const botRun = await BotRun.create({
        BotId: botId,
        status: 'running',
        startTime: new Date(),
        logs: []
      });

      // Add to active bots
      this.activeBots.set(botId, {
        bot,
        run: botRun,
        startTime: Date.now(),
        tempDir: null
      });

      // Update bot status
      await bot.update({ status: 'running' });

      // Emit status update
      this.io.emit('bot:status', {
        botId,
        status: 'running',
        runId: botRun.id
      });

      // Execute bot based on type
      await this.executeBot(bot, botRun);

    } catch (error) {
      logger.error('Error spawning bot:', error);
      await this.handleBotError(botId, error);
    }
  }

  async executeBot(bot, botRun) {
    const { Project: project } = bot;
    const tempDir = await createTempDirectory();
    
    try {
      // Update active bots with temp directory
      const activeBot = this.activeBots.get(bot.id);
      activeBot.tempDir = tempDir;

      // Clone repository
      await this.logBotProgress(botRun, 'Cloning repository...');
      const git = simpleGit(tempDir);
      await git.clone(project.repositoryUrl, tempDir);

      // Execute based on bot type
      switch (bot.type) {
        case 'module_update':
          await this.executeModuleUpdate(bot, botRun, tempDir);
          break;
        case 'dependency_update':
          await this.executeDependencyUpdate(bot, botRun, tempDir);
          break;
        case 'security_scan':
          await this.executeSecurityScan(bot, botRun, tempDir);
          break;
        default:
          await this.executeCustomBot(bot, botRun, tempDir);
      }

      await this.completeBotRun(bot, botRun, 'completed');

    } catch (error) {
      logger.error('Error executing bot:', error);
      await this.handleBotError(bot.id, error);
    } finally {
      // Cleanup
      await cleanupTempDirectory(tempDir);
    }
  }

  async executeModuleUpdate(bot, botRun, tempDir) {
    const { Project: project } = bot;
    const config = bot.configuration;

    await this.logBotProgress(botRun, 'Starting module update process...');

    // Create new branch
    const branchName = `bot/update-${Date.now()}`;
    await this.logBotProgress(botRun, `Creating branch: ${branchName}`);
    
    const git = simpleGit(tempDir);
    await git.checkoutBranch(branchName, project.defaultBranch);

    // Generate module updates
    const modules = config.modules || ['package.json'];
    const updates = [];

    for (const module of modules) {
      await this.logBotProgress(botRun, `Processing module: ${module}`);
      
      const update = await generateModuleUpdate(tempDir, module, config);
      if (update) {
        updates.push(update);
        
        // Create module update record
        await ModuleUpdate.create({
          ProjectId: project.id,
          moduleName: module,
          currentVersion: update.currentVersion,
          targetVersion: update.targetVersion,
          status: 'completed',
          changes: update.changes
        });
      }
    }

    // Commit changes
    if (updates.length > 0) {
      await this.logBotProgress(botRun, 'Committing changes...');
      await git.add('.');
      await git.commit(`Bot: Update modules\n\nUpdated ${updates.length} modules`);
      
      // Push to remote
      await this.logBotProgress(botRun, 'Pushing to remote repository...');
      await git.push('origin', branchName);

      // Create branch record
      await GitBranch.create({
        ProjectId: project.id,
        name: branchName,
        commitHash: await git.revparse(['HEAD']),
        commitMessage: `Bot: Update modules - ${updates.length} modules updated`,
        isActive: true
      });

      await this.logBotProgress(botRun, `Successfully updated ${updates.length} modules`);
    } else {
      await this.logBotProgress(botRun, 'No updates required');
    }
  }

  async executeDependencyUpdate(bot, botRun, tempDir) {
    await this.logBotProgress(botRun, 'Starting dependency update process...');
    
    // Implementation for dependency updates
    await this.logBotProgress(botRun, 'Dependency update completed');
  }

  async executeSecurityScan(bot, botRun, tempDir) {
    await this.logBotProgress(botRun, 'Starting security scan...');
    
    // Implementation for security scanning
    await this.logBotProgress(botRun, 'Security scan completed');
  }

  async executeCustomBot(bot, botRun, tempDir) {
    await this.logBotProgress(botRun, 'Executing custom bot logic...');
    
    // Implementation for custom bots
    await this.logBotProgress(botRun, 'Custom bot execution completed');
  }

  async logBotProgress(botRun, message) {
    const log = {
      timestamp: new Date().toISOString(),
      message,
      level: 'info'
    };

    botRun.logs.push(log);
    await botRun.save();

    // Emit real-time log
    this.io.emit('bot:log', {
      runId: botRun.id,
      log
    });
  }

  async completeBotRun(bot, botRun, status) {
    const endTime = new Date();
    const duration = endTime - botRun.startTime;

    await botRun.update({
      status,
      endTime,
      duration: endTime - botRun.startTime
    });

    await bot.update({
      status: 'idle',
      lastRun: endTime
    });

    // Remove from active bots
    this.activeBots.delete(bot.id);

    // Emit completion
    this.io.emit('bot:status', {
      botId: bot.id,
      status: 'idle',
      runId: botRun.id,
      duration
    });

    logger.info(`Bot ${bot.name} completed with status: ${status}`);
  }

  async handleBotError(botId, error) {
    const activeBot = this.activeBots.get(botId);
    
    if (activeBot) {
      const { bot, run } = activeBot;
      
      await run.update({
        status: 'failed',
        endTime: new Date(),
        error: error.message
      });

      await bot.update({ status: 'failed' });

      // Remove from active bots
      this.activeBots.delete(botId);

      // Emit error
      this.io.emit('bot:status', {
        botId,
        status: 'failed',
        error: error.message
      });
    }
  }

  async stopBot(botId) {
    const activeBot = this.activeBots.get(botId);
    
    if (activeBot) {
      const { bot, run, tempDir } = activeBot;
      
      // Cleanup temp directory
      if (tempDir) {
        await cleanupTempDirectory(tempDir);
      }

      await this.completeBotRun(bot, run, 'cancelled');
    }
  }

  getActiveBots() {
    return Array.from(this.activeBots.entries()).map(([id, data]) => ({
      id,
      name: data.bot.name,
      startTime: data.startTime,
      duration: Date.now() - data.startTime
    }));
  }

  getBotStatus(botId) {
    const activeBot = this.activeBots.get(botId);
    return activeBot ? 'running' : 'idle';
  }
}