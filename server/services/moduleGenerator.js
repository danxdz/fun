import { readJsonFile, writeJsonFile } from '../utils/fileUtils.js';
import path from 'path';

export async function generateModuleUpdate(tempDir, modulePath, config) {
  try {
    const fullPath = path.join(tempDir, modulePath);
    const moduleData = await readJsonFile(fullPath);
    
    if (!moduleData) {
      return null;
    }

    const updates = [];
    const changes = {};

    // Handle package.json updates
    if (modulePath === 'package.json') {
      if (moduleData.dependencies) {
        for (const [dep, version] of Object.entries(moduleData.dependencies)) {
          const newVersion = await getLatestVersion(dep);
          if (newVersion && newVersion !== version) {
            moduleData.dependencies[dep] = newVersion;
            changes[dep] = { from: version, to: newVersion };
            updates.push(`${dep}: ${version} → ${newVersion}`);
          }
        }
      }

      if (moduleData.devDependencies) {
        for (const [dep, version] of Object.entries(moduleData.devDependencies)) {
          const newVersion = await getLatestVersion(dep);
          if (newVersion && newVersion !== version) {
            moduleData.devDependencies[dep] = newVersion;
            changes[`dev:${dep}`] = { from: version, to: newVersion };
            updates.push(`${dep} (dev): ${version} → ${newVersion}`);
          }
        }
      }
    }

    // Write updated file
    if (updates.length > 0) {
      await writeJsonFile(fullPath, moduleData);
      
      return {
        currentVersion: 'current',
        targetVersion: 'updated',
        changes,
        updates
      };
    }

    return null;
  } catch (error) {
    console.error('Error generating module update:', error);
    return null;
  }
}

async function getLatestVersion(packageName) {
  // In a real implementation, this would fetch from npm registry
  // For now, we'll simulate version updates
  const mockVersions = {
    'react': '18.3.1',
    'react-dom': '18.3.1',
    'express': '4.18.2',
    'axios': '1.6.2',
    'sequelize': '6.35.2'
  };
  
  return mockVersions[packageName] || null;
}