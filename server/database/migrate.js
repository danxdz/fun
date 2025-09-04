import { sequelize } from './connection.js';
import { logger } from './utils/logger.js';

async function migrate() {
  try {
    logger.info('Starting database migration...');
    
    // Sync all models with database
    await sequelize.sync({ alter: true });
    
    logger.info('Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();