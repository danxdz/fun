import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';
import bcrypt from 'bcryptjs';

export const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('admin', 'user', 'viewer'),
    defaultValue: 'user'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  lastLogin: {
    type: DataTypes.DATE
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

export const Team = sequelize.define('Team', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

export const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  repositoryUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  repositoryType: {
    type: DataTypes.ENUM('github', 'gitlab', 'bitbucket'),
    defaultValue: 'github'
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: false
  },
  defaultBranch: {
    type: DataTypes.STRING,
    defaultValue: 'main'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
});

export const Bot = sequelize.define('Bot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.ENUM('module_update', 'dependency_update', 'security_scan', 'custom'),
    defaultValue: 'module_update'
  },
  status: {
    type: DataTypes.ENUM('idle', 'running', 'completed', 'failed', 'stopped'),
    defaultValue: 'idle'
  },
  configuration: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  schedule: {
    type: DataTypes.STRING // cron expression
  },
  lastRun: {
    type: DataTypes.DATE
  },
  nextRun: {
    type: DataTypes.DATE
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

export const BotRun = sequelize.define('BotRun', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  status: {
    type: DataTypes.ENUM('running', 'completed', 'failed', 'cancelled'),
    defaultValue: 'running'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endTime: {
    type: DataTypes.DATE
  },
  duration: {
    type: DataTypes.INTEGER // in milliseconds
  },
  logs: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  results: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  error: {
    type: DataTypes.TEXT
  }
});

export const GitBranch = sequelize.define('GitBranch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  commitHash: {
    type: DataTypes.STRING
  },
  commitMessage: {
    type: DataTypes.TEXT
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false
  }
});

export const ModuleUpdate = sequelize.define('ModuleUpdate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  moduleName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  currentVersion: {
    type: DataTypes.STRING
  },
  targetVersion: {
    type: DataTypes.STRING
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  changes: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
});

// Define relationships
User.hasMany(Project);
Project.belongsTo(User);

User.belongsToMany(Team, { through: 'UserTeams' });
Team.belongsToMany(User, { through: 'UserTeams' });

Team.hasMany(Project);
Project.belongsTo(Team);

Project.hasMany(Bot);
Bot.belongsTo(Project);

Bot.hasMany(BotRun);
BotRun.belongsTo(Bot);

Project.hasMany(GitBranch);
GitBranch.belongsTo(Project);

Project.hasMany(ModuleUpdate);
ModuleUpdate.belongsTo(Project);

export default {
  User,
  Team,
  Project,
  Bot,
  BotRun,
  GitBranch,
  ModuleUpdate
};