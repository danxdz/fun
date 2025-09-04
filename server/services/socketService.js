import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { logger } from '../utils/logger.js';

export function setupSocketHandlers(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findByPk(decoded.userId);
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User ${socket.userId} connected`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle bot status requests
    socket.on('bot:getStatus', (botId) => {
      const botSpawner = global.botSpawner;
      const status = botSpawner.getBotStatus(botId);
      socket.emit('bot:status', { botId, status });
    });

    // Handle bot control
    socket.on('bot:start', async (botId) => {
      try {
        const botSpawner = global.botSpawner;
        await botSpawner.spawnBot(botId, socket.userId);
      } catch (error) {
        socket.emit('bot:error', { botId, error: error.message });
      }
    });

    socket.on('bot:stop', async (botId) => {
      try {
        const botSpawner = global.botSpawner;
        await botSpawner.stopBot(botId);
      } catch (error) {
        socket.emit('bot:error', { botId, error: error.message });
      }
    });

    // Handle project updates
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
      logger.info(`User ${socket.userId} joined project ${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
      logger.info(`User ${socket.userId} left project ${projectId}`);
    });

    // Handle real-time collaboration
    socket.on('collaboration:join', (sessionId) => {
      socket.join(`collaboration:${sessionId}`);
    });

    socket.on('collaboration:update', (data) => {
      socket.to(`collaboration:${data.sessionId}`).emit('collaboration:update', data);
    });

    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected`);
    });
  });

  return io;
}