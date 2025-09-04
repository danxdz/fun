import { User, Team, Project, Bot } from '../models/index.js';
import { logger } from '../utils/logger.js';

async function seed() {
  try {
    logger.info('Starting database seeding...');
    
    // Create admin user
    const adminUser = await User.create({
      email: 'admin@autobot.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });
    
    logger.info('Created admin user:', adminUser.email);
    
    // Create sample team
    const team = await Team.create({
      name: 'Development Team',
      description: 'Main development team'
    });
    
    logger.info('Created sample team:', team.name);
    
    // Create sample project
    const project = await Project.create({
      name: 'Sample Project',
      description: 'A sample project for testing',
      repositoryUrl: 'https://github.com/example/sample-project',
      repositoryType: 'github',
      accessToken: 'sample-token',
      UserId: adminUser.id,
      TeamId: team.id
    });
    
    logger.info('Created sample project:', project.name);
    
    // Create sample bot
    const bot = await Bot.create({
      name: 'Dependency Update Bot',
      type: 'module_update',
      configuration: {
        modules: ['package.json'],
        autoMerge: false,
        createPR: true
      },
      ProjectId: project.id
    });
    
    logger.info('Created sample bot:', bot.name);
    
    logger.info('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();