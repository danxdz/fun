import { Octokit } from '@octokit/rest';
import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';

class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
    this.git = simpleGit();
  }

  async createRepository(name, description, isPrivate = false) {
    try {
      const response = await this.octokit.rest.repos.createForAuthenticatedUser({
        name,
        description: description || `AutoBot managed repository: ${name}`,
        private: isPrivate,
        auto_init: true,
        gitignore_template: 'Node',
        license_template: 'mit'
      });

      return {
        success: true,
        repository: {
          id: response.data.id,
          name: response.data.name,
          fullName: response.data.full_name,
          url: response.data.html_url,
          cloneUrl: response.data.clone_url,
          sshUrl: response.data.ssh_url,
          description: response.data.description,
          private: response.data.private,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
          defaultBranch: response.data.default_branch
        }
      };
    } catch (error) {
      console.error('GitHub repository creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create repository'
      };
    }
  }

  async getRepository(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo
      });

      return {
        success: true,
        repository: {
          id: response.data.id,
          name: response.data.name,
          fullName: response.data.full_name,
          url: response.data.html_url,
          cloneUrl: response.data.clone_url,
          sshUrl: response.data.ssh_url,
          description: response.data.description,
          private: response.data.private,
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
          defaultBranch: response.data.default_branch,
          language: response.data.language,
          stars: response.data.stargazers_count,
          forks: response.data.forks_count,
          openIssues: response.data.open_issues_count
        }
      };
    } catch (error) {
      console.error('GitHub repository fetch error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch repository'
      };
    }
  }

  async getRepositoryBranches(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.listBranches({
        owner,
        repo
      });

      return {
        success: true,
        branches: response.data.map(branch => ({
          name: branch.name,
          protected: branch.protected,
          commit: {
            sha: branch.commit.sha,
            message: branch.commit.commit.message,
            author: branch.commit.commit.author.name,
            date: branch.commit.commit.author.date
          }
        }))
      };
    } catch (error) {
      console.error('GitHub branches fetch error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch branches'
      };
    }
  }

  async getRepositoryCommits(owner, repo, branch = 'main', perPage = 10) {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        sha: branch,
        per_page: perPage
      });

      return {
        success: true,
        commits: response.data.map(commit => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: {
            name: commit.commit.author.name,
            email: commit.commit.author.email,
            date: commit.commit.author.date
          },
          committer: {
            name: commit.commit.committer.name,
            email: commit.commit.committer.email,
            date: commit.commit.committer.date
          },
          url: commit.html_url
        }))
      };
    } catch (error) {
      console.error('GitHub commits fetch error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch commits'
      };
    }
  }

  async getRepositoryIssues(owner, repo, state = 'open') {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state
      });

      return {
        success: true,
        issues: response.data.map(issue => ({
          id: issue.id,
          number: issue.number,
          title: issue.title,
          body: issue.body,
          state: issue.state,
          labels: issue.labels.map(label => ({
            name: label.name,
            color: label.color
          })),
          assignee: issue.assignee ? {
            login: issue.assignee.login,
            avatarUrl: issue.assignee.avatar_url
          } : null,
          createdAt: issue.created_at,
          updatedAt: issue.updated_at,
          url: issue.html_url
        }))
      };
    } catch (error) {
      console.error('GitHub issues fetch error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch issues'
      };
    }
  }

  async createPullRequest(owner, repo, title, head, base, body) {
    try {
      const response = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body
      });

      return {
        success: true,
        pullRequest: {
          id: response.data.id,
          number: response.data.number,
          title: response.data.title,
          body: response.data.body,
          state: response.data.state,
          head: {
            ref: response.data.head.ref,
            sha: response.data.head.sha
          },
          base: {
            ref: response.data.base.ref,
            sha: response.data.base.sha
          },
          createdAt: response.data.created_at,
          updatedAt: response.data.updated_at,
          url: response.data.html_url
        }
      };
    } catch (error) {
      console.error('GitHub pull request creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create pull request'
      };
    }
  }

  async cloneAndSetupRepository(repoUrl, projectName, templateType = 'basic') {
    const tempDir = `/tmp/autobot-project-${Date.now()}`;
    
    try {
      // Clone the repository
      await this.git.clone(repoUrl, tempDir);
      const repo = simpleGit(tempDir);

      // Setup project structure based on template
      await this.setupProjectTemplate(tempDir, templateType);

      // Initial commit
      await repo.add('.');
      await repo.commit('🚀 Initial project setup with AutoBot Manager');
      await repo.push('origin', 'main');

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });

      return {
        success: true,
        message: 'Project setup completed successfully'
      };
    } catch (error) {
      console.error('Repository setup error:', error);
      // Clean up on error
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      
      return {
        success: false,
        error: error.message || 'Failed to setup repository'
      };
    }
  }

  async setupProjectTemplate(projectPath, templateType) {
    const templates = {
      'react': {
        files: {
          'package.json': JSON.stringify({
            name: path.basename(projectPath),
            version: '1.0.0',
            private: true,
            scripts: {
              dev: 'vite',
              build: 'vite build',
              preview: 'vite preview'
            },
            dependencies: {
              'react': '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              '@types/react': '^18.2.0',
              '@types/react-dom': '^18.2.0',
              '@vitejs/plugin-react': '^4.0.0',
              'vite': '^4.4.0'
            }
          }, null, 2),
          'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
          'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
          'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
          'src/App.jsx': `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <h1>Welcome to your React App!</h1>
      <button onClick={() => setCount(count + 1)}>
        Count is {count}
      </button>
    </div>
  )
}

export default App`,
          'src/App.css': `#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

button {
  border-radius: 8px;
  border: 1px solid transparent;
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  font-family: inherit;
  background-color: #1a1a1a;
  color: white;
  cursor: pointer;
  transition: border-color 0.25s;
}

button:hover {
  border-color: #646cff;
}

button:focus,
button:focus-visible {
  outline: 4px auto -webkit-focus-ring-color;
}`,
          'src/index.css': `:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  display: flex;
  place-items: center;
  min-width: 320px;
  min-height: 100vh;
}

#root {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}`,
          'README.md': `# ${path.basename(projectPath)}

This project was created with AutoBot Manager - an AI-powered development automation platform.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Features

- ⚡ Vite for fast development
- ⚛️ React 18 with modern features
- 🎨 Modern CSS styling
- 🤖 AutoBot Manager integration

## AutoBot Manager

This project is managed by AutoBot Manager, which provides:
- Automated dependency updates
- Security scanning
- Code refactoring
- Git branch management

Visit [AutoBot Manager](https://github.com/danxdz/fun) to learn more.`
        }
      },
      'node': {
        files: {
          'package.json': JSON.stringify({
            name: path.basename(projectPath),
            version: '1.0.0',
            description: 'A Node.js project managed by AutoBot Manager',
            main: 'index.js',
            scripts: {
              start: 'node index.js',
              dev: 'nodemon index.js',
              test: 'jest'
            },
            dependencies: {
              'express': '^4.18.0',
              'cors': '^2.8.5',
              'helmet': '^7.0.0'
            },
            devDependencies: {
              'nodemon': '^3.0.0',
              'jest': '^29.0.0'
            }
          }, null, 2),
          'index.js': `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to your Node.js app!',
    timestamp: new Date().toISOString(),
    managedBy: 'AutoBot Manager'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(\`🚀 Server running on port \${PORT}\`);
  console.log('🤖 Managed by AutoBot Manager');
});

module.exports = app;`,
          'README.md': `# ${path.basename(projectPath)}

A Node.js project created and managed by AutoBot Manager.

## Getting Started

\`\`\`bash
npm install
npm start
\`\`\`

## Development

\`\`\`bash
npm run dev
\`\`\`

## Testing

\`\`\`bash
npm test
\`\`\`

## Features

- 🚀 Express.js server
- 🔒 Security with Helmet
- 🌐 CORS enabled
- 📊 Health check endpoint
- 🤖 AutoBot Manager integration

## AutoBot Manager

This project is managed by AutoBot Manager, which provides:
- Automated dependency updates
- Security scanning
- Code refactoring
- Git branch management

Visit [AutoBot Manager](https://github.com/danxdz/fun) to learn more.`
        }
      },
      'basic': {
        files: {
          'README.md': `# ${path.basename(projectPath)}

A project created and managed by AutoBot Manager.

## AutoBot Manager

This project is managed by AutoBot Manager, which provides:
- Automated dependency updates
- Security scanning
- Code refactoring
- Git branch management

Visit [AutoBot Manager](https://github.com/danxdz/fun) to learn more.`,
          '.gitignore': `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log`
        }
      }
    };

    const template = templates[templateType] || templates['basic'];

    // Create files
    for (const [filePath, content] of Object.entries(template.files)) {
      const fullPath = path.join(projectPath, filePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content);
    }
  }

  async getUserRepositories() {
    try {
      const response = await this.octokit.rest.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      });

      return {
        success: true,
        repositories: response.data.map(repo => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          cloneUrl: repo.clone_url,
          sshUrl: repo.ssh_url,
          description: repo.description,
          private: repo.private,
          createdAt: repo.created_at,
          updatedAt: repo.updated_at,
          defaultBranch: repo.default_branch,
          language: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          openIssues: repo.open_issues_count
        }))
      };
    } catch (error) {
      console.error('GitHub user repositories fetch error:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch repositories'
      };
    }
  }
}

export default GitHubService;