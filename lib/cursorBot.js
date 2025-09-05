import OpenAI from 'openai';
import simpleGit from 'simple-git';
import fs from 'fs/promises';
import path from 'path';
import { supabase } from './supabase.js';

class CursorBot {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.CURSOR_API_KEY || process.env.OPENAI_API_KEY,
    });
    this.git = simpleGit();
  }

  async createBotRun(botId, projectId, type) {
    const { data: botRun, error } = await supabase
      .from('bot_runs')
      .insert({
        bot_id: botId,
        status: 'running',
        started_at: new Date().toISOString(),
        logs: 'Bot started...\n'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create bot run: ${error.message}`);
    }

    return botRun;
  }

  async updateBotRun(botRunId, updates) {
    const { error } = await supabase
      .from('bot_runs')
      .update(updates)
      .eq('id', botRunId);

    if (error) {
      console.error('Failed to update bot run:', error);
    }
  }

  async logBotRun(botRunId, message) {
    const { data: botRun } = await supabase
      .from('bot_runs')
      .select('logs')
      .eq('id', botRunId)
      .single();

    const newLogs = (botRun?.logs || '') + `${new Date().toISOString()}: ${message}\n`;
    
    await this.updateBotRun(botRunId, { logs: newLogs });
  }

  async cloneRepository(repositoryUrl, tempDir) {
    try {
      await this.git.clone(repositoryUrl, tempDir);
      return simpleGit(tempDir);
    } catch (error) {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  async createBranch(repo, branchName) {
    try {
      await repo.checkoutLocalBranch(branchName);
      return branchName;
    } catch (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }
  }

  async analyzeCodeWithCursor(filePath, prompt) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert code reviewer and refactorer. Analyze the code and provide improvements, fixes, or updates based on the user's request."
          },
          {
            role: "user",
            content: `File: ${filePath}\n\nCode:\n\`\`\`\n${fileContent}\n\`\`\`\n\nRequest: ${prompt}`
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      throw new Error(`Failed to analyze code with Cursor: ${error.message}`);
    }
  }

  async generateCodeWithCursor(prompt, context = '') {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert software developer. Generate clean, efficient, and well-documented code based on the user's requirements."
          },
          {
            role: "user",
            content: `${context}\n\nRequest: ${prompt}`
          }
        ],
        temperature: 0.2,
        max_tokens: 3000
      });

      return completion.choices[0].message.content;
    } catch (error) {
      throw new Error(`Failed to generate code with Cursor: ${error.message}`);
    }
  }

  async updatePackageJson(repo, updates) {
    const packageJsonPath = path.join(repo.cwd, 'package.json');
    
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Update dependencies
      if (updates.dependencies) {
        packageJson.dependencies = { ...packageJson.dependencies, ...updates.dependencies };
      }
      
      if (updates.devDependencies) {
        packageJson.devDependencies = { ...packageJson.devDependencies, ...updates.devDependencies };
      }

      // Update other fields
      Object.keys(updates).forEach(key => {
        if (key !== 'dependencies' && key !== 'devDependencies') {
          packageJson[key] = updates[key];
        }
      });

      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
      
      return packageJson;
    } catch (error) {
      throw new Error(`Failed to update package.json: ${error.message}`);
    }
  }

  async commitAndPush(repo, message, branchName) {
    try {
      await repo.add('.');
      await repo.commit(message);
      await repo.push('origin', branchName);
      return true;
    } catch (error) {
      throw new Error(`Failed to commit and push: ${error.message}`);
    }
  }

  async runDependencyUpdateBot(botId, projectId, config) {
    const botRun = await this.createBotRun(botId, projectId, 'dependency_update');
    
    try {
      await this.logBotRun(botRun.id, 'Starting dependency update bot...');
      
      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('repository_url, name')
        .eq('id', projectId)
        .single();

      if (!project) {
        throw new Error('Project not found');
      }

      const tempDir = `/tmp/autobot-${Date.now()}`;
      const repo = await this.cloneRepository(project.repository_url, tempDir);
      
      await this.logBotRun(botRun.id, 'Repository cloned successfully');

      // Create feature branch
      const branchName = `autobot/dependency-update-${Date.now()}`;
      await this.createBranch(repo, branchName);
      
      await this.logBotRun(botRun.id, `Created branch: ${branchName}`);

      // Analyze package.json with Cursor
      const packageJsonPath = path.join(tempDir, 'package.json');
      const analysisPrompt = `Analyze this package.json and suggest dependency updates. Focus on:
      1. Outdated dependencies that need updates
      2. Security vulnerabilities
      3. Performance improvements
      4. Newer versions of major dependencies
      
      Provide specific version updates with reasoning.`;

      const analysis = await this.analyzeCodeWithCursor(packageJsonPath, analysisPrompt);
      await this.logBotRun(botRun.id, `Cursor analysis completed: ${analysis.substring(0, 200)}...`);

      // Generate updated package.json
      const updatePrompt = `Based on the analysis, generate an updated package.json with:
      1. Updated dependency versions
      2. Security patches
      3. Performance improvements
      
      Keep the same structure but update versions appropriately.`;

      const updatedPackageJson = await this.generateCodeWithCursor(updatePrompt, analysis);
      await this.logBotRun(botRun.id, 'Generated updated package.json');

      // Apply updates
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      const updates = JSON.parse(updatedPackageJson.match(/```json\n([\s\S]*?)\n```/)?.[1] || '{}');
      
      await this.updatePackageJson(repo, updates);
      await this.logBotRun(botRun.id, 'Applied dependency updates');

      // Commit and push
      const commitMessage = `🤖 AutoBot: Update dependencies\n\nUpdated by Cursor AI:\n${analysis.substring(0, 500)}`;
      await this.commitAndPush(repo, commitMessage, branchName);
      
      await this.logBotRun(botRun.id, 'Changes committed and pushed successfully');

      // Update bot run status
      await this.updateBotRun(botRun.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: {
          branch: branchName,
          updates: updates,
          analysis: analysis
        }
      });

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });

      return {
        success: true,
        branch: branchName,
        updates: updates,
        analysis: analysis
      };

    } catch (error) {
      await this.logBotRun(botRun.id, `Error: ${error.message}`);
      await this.updateBotRun(botRun.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        logs: (await supabase.from('bot_runs').select('logs').eq('id', botRun.id).single()).data?.logs + `\nError: ${error.message}`
      });
      
      throw error;
    }
  }

  async runSecurityScanBot(botId, projectId, config) {
    const botRun = await this.createBotRun(botId, projectId, 'security_scan');
    
    try {
      await this.logBotRun(botRun.id, 'Starting security scan bot...');
      
      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('repository_url, name')
        .eq('id', projectId)
        .single();

      if (!project) {
        throw new Error('Project not found');
      }

      const tempDir = `/tmp/autobot-security-${Date.now()}`;
      const repo = await this.cloneRepository(project.repository_url, tempDir);
      
      await this.logBotRun(botRun.id, 'Repository cloned successfully');

      // Create feature branch
      const branchName = `autobot/security-scan-${Date.now()}`;
      await this.createBranch(repo, branchName);
      
      await this.logBotRun(botRun.id, `Created branch: ${branchName}`);

      // Scan for security issues
      const securityPrompt = `Perform a comprehensive security scan of this codebase. Look for:
      1. Hardcoded secrets, API keys, passwords
      2. SQL injection vulnerabilities
      3. XSS vulnerabilities
      4. Insecure dependencies
      5. Authentication/authorization issues
      6. Input validation problems
      7. File upload vulnerabilities
      
      Provide specific file locations and code snippets with fixes.`;

      const securityAnalysis = await this.analyzeCodeWithCursor(path.join(tempDir, 'src'), securityPrompt);
      await this.logBotRun(botRun.id, `Security analysis completed: ${securityAnalysis.substring(0, 200)}...`);

      // Generate security fixes
      const fixPrompt = `Based on the security analysis, generate fixes for the identified vulnerabilities.
      Provide specific code changes with explanations.`;

      const securityFixes = await this.generateCodeWithCursor(fixPrompt, securityAnalysis);
      await this.logBotRun(botRun.id, 'Generated security fixes');

      // Apply fixes (this would be more complex in a real implementation)
      // For now, we'll create a security report
      const securityReport = {
        vulnerabilities: securityAnalysis,
        fixes: securityFixes,
        timestamp: new Date().toISOString()
      };

      await fs.writeFile(path.join(tempDir, 'SECURITY_REPORT.md'), JSON.stringify(securityReport, null, 2));
      
      // Commit and push
      const commitMessage = `🔒 AutoBot: Security scan and fixes\n\nSecurity analysis by Cursor AI:\n${securityAnalysis.substring(0, 500)}`;
      await this.commitAndPush(repo, commitMessage, branchName);
      
      await this.logBotRun(botRun.id, 'Security report committed and pushed');

      // Update bot run status
      await this.updateBotRun(botRun.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: {
          branch: branchName,
          vulnerabilities: securityAnalysis,
          fixes: securityFixes
        }
      });

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });

      return {
        success: true,
        branch: branchName,
        vulnerabilities: securityAnalysis,
        fixes: securityFixes
      };

    } catch (error) {
      await this.logBotRun(botRun.id, `Error: ${error.message}`);
      await this.updateBotRun(botRun.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        logs: (await supabase.from('bot_runs').select('logs').eq('id', botRun.id).single()).data?.logs + `\nError: ${error.message}`
      });
      
      throw error;
    }
  }

  async runModuleUpdateBot(botId, projectId, config) {
    const botRun = await this.createBotRun(botId, projectId, 'module_update');
    
    try {
      await this.logBotRun(botRun.id, 'Starting module update bot...');
      
      // Get project details
      const { data: project } = await supabase
        .from('projects')
        .select('repository_url, name')
        .eq('id', projectId)
        .single();

      if (!project) {
        throw new Error('Project not found');
      }

      const tempDir = `/tmp/autobot-module-${Date.now()}`;
      const repo = await this.cloneRepository(project.repository_url, tempDir);
      
      await this.logBotRun(botRun.id, 'Repository cloned successfully');

      // Create feature branch
      const branchName = `autobot/module-update-${Date.now()}`;
      await this.createBranch(repo, branchName);
      
      await this.logBotRun(botRun.id, `Created branch: ${branchName}`);

      // Analyze codebase for module improvements
      const modulePrompt = `Analyze this codebase and suggest module improvements:
      1. Code refactoring opportunities
      2. Performance optimizations
      3. Better error handling
      4. Code organization improvements
      5. Modern JavaScript/TypeScript features
      6. Accessibility improvements
      
      Provide specific file locations and suggested changes.`;

      const moduleAnalysis = await this.analyzeCodeWithCursor(path.join(tempDir, 'src'), modulePrompt);
      await this.logBotRun(botRun.id, `Module analysis completed: ${moduleAnalysis.substring(0, 200)}...`);

      // Generate module updates
      const updatePrompt = `Based on the analysis, generate improved code modules.
      Focus on:
      1. Better code organization
      2. Performance improvements
      3. Error handling
      4. Modern best practices
      
      Provide specific code changes with explanations.`;

      const moduleUpdates = await this.generateCodeWithCursor(updatePrompt, moduleAnalysis);
      await this.logBotRun(botRun.id, 'Generated module updates');

      // Apply updates (simplified for demo)
      const updateReport = {
        analysis: moduleAnalysis,
        updates: moduleUpdates,
        timestamp: new Date().toISOString()
      };

      await fs.writeFile(path.join(tempDir, 'MODULE_UPDATE_REPORT.md'), JSON.stringify(updateReport, null, 2));
      
      // Commit and push
      const commitMessage = `🔧 AutoBot: Module updates and improvements\n\nModule analysis by Cursor AI:\n${moduleAnalysis.substring(0, 500)}`;
      await this.commitAndPush(repo, commitMessage, branchName);
      
      await this.logBotRun(botRun.id, 'Module updates committed and pushed');

      // Update bot run status
      await this.updateBotRun(botRun.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        results: {
          branch: branchName,
          analysis: moduleAnalysis,
          updates: moduleUpdates
        }
      });

      // Clean up
      await fs.rm(tempDir, { recursive: true, force: true });

      return {
        success: true,
        branch: branchName,
        analysis: moduleAnalysis,
        updates: moduleUpdates
      };

    } catch (error) {
      await this.logBotRun(botRun.id, `Error: ${error.message}`);
      await this.updateBotRun(botRun.id, {
        status: 'failed',
        completed_at: new Date().toISOString(),
        logs: (await supabase.from('bot_runs').select('logs').eq('id', botRun.id).single()).data?.logs + `\nError: ${error.message}`
      });
      
      throw error;
    }
  }

  async runBot(botId, projectId, type, config = {}) {
    switch (type) {
      case 'dependency_update':
        return await this.runDependencyUpdateBot(botId, projectId, config);
      case 'security_scan':
        return await this.runSecurityScanBot(botId, projectId, config);
      case 'module_update':
        return await this.runModuleUpdateBot(botId, projectId, config);
      default:
        throw new Error(`Unknown bot type: ${type}`);
    }
  }
}

export default CursorBot;