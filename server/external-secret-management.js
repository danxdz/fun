// ========================================
// EXTERNAL SECRET MANAGEMENT SYSTEM
// ========================================
// This file implements external secret management for enhanced security

import crypto from 'crypto';

// Secret management providers
const SECRET_PROVIDERS = {
  VAULT: 'vault',
  AWS_SECRETS: 'aws_secrets',
  AZURE_KEYVAULT: 'azure_keyvault',
  GCP_SECRETS: 'gcp_secrets',
  LOCAL_ENCRYPTED: 'local_encrypted' // Fallback option
};

// Configuration
const SECRET_CONFIG = {
  provider: process.env.SECRET_PROVIDER || SECRET_PROVIDERS.LOCAL_ENCRYPTED,
  vault: {
    url: process.env.VAULT_URL,
    token: process.env.VAULT_TOKEN,
    mountPath: process.env.VAULT_MOUNT_PATH || 'secret'
  },
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  azure: {
    vaultUrl: process.env.AZURE_VAULT_URL,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    tenantId: process.env.AZURE_TENANT_ID
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    keyFile: process.env.GCP_KEY_FILE
  }
};

// Secret types
const SECRET_TYPES = {
  GITHUB_TOKEN: 'github_token',
  CURSOR_API_KEY: 'cursor_api_key',
  PROJECT_ACCESS_TOKEN: 'project_access_token',
  ENCRYPTION_KEY: 'encryption_key',
  JWT_SECRET: 'jwt_secret'
};

// Secret metadata structure
class SecretMetadata {
  constructor(type, userId, expiresAt, createdAt, tags = {}) {
    this.type = type;
    this.userId = userId;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
    this.tags = tags;
    this.version = 1;
  }
}

// Base secret manager class
class SecretManager {
  constructor(config) {
    this.config = config;
    this.cache = new Map(); // Local cache for performance
    this.cacheExpiry = new Map();
  }

  // Generate secret path
  generateSecretPath(type, userId) {
    return `autobot/${type}/${userId}`;
  }

  // Cache management
  setCache(key, value, ttl = 300000) { // 5 minutes default TTL
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }

  getCache(key) {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() < expiry) {
      return this.cache.get(key);
    }
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  // Abstract methods to be implemented by providers
  async storeSecret(path, secret, metadata) {
    throw new Error('storeSecret must be implemented by provider');
  }

  async retrieveSecret(path) {
    throw new Error('retrieveSecret must be implemented by provider');
  }

  async deleteSecret(path) {
    throw new Error('deleteSecret must be implemented by provider');
  }

  async listSecrets(prefix) {
    throw new Error('listSecrets must be implemented by provider');
  }
}

// HashiCorp Vault implementation
class VaultSecretManager extends SecretManager {
  constructor(config) {
    super(config);
    this.vaultUrl = config.vault.url;
    this.token = config.vault.token;
    this.mountPath = config.vault.mountPath;
  }

  async storeSecret(path, secret, metadata) {
    const cacheKey = `vault:${path}`;
    
    try {
      const response = await fetch(`${this.vaultUrl}/v1/${this.mountPath}/data/${path}`, {
        method: 'POST',
        headers: {
          'X-Vault-Token': this.token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          data: {
            secret: secret,
            metadata: metadata
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Vault API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      this.setCache(cacheKey, secret);
      return result;
    } catch (error) {
      console.error('Vault store error:', error);
      throw error;
    }
  }

  async retrieveSecret(path) {
    const cacheKey = `vault:${path}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.vaultUrl}/v1/${this.mountPath}/data/${path}`, {
        method: 'GET',
        headers: {
          'X-Vault-Token': this.token
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`Vault API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const secret = result.data?.data?.secret;
      if (secret) {
        this.setCache(cacheKey, secret);
      }
      return secret;
    } catch (error) {
      console.error('Vault retrieve error:', error);
      throw error;
    }
  }

  async deleteSecret(path) {
    const cacheKey = `vault:${path}`;
    
    try {
      const response = await fetch(`${this.vaultUrl}/v1/${this.mountPath}/data/${path}`, {
        method: 'DELETE',
        headers: {
          'X-Vault-Token': this.token
        }
      });

      if (!response.ok) {
        throw new Error(`Vault API error: ${response.status} ${response.statusText}`);
      }

      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      return true;
    } catch (error) {
      console.error('Vault delete error:', error);
      throw error;
    }
  }

  async listSecrets(prefix) {
    try {
      const response = await fetch(`${this.vaultUrl}/v1/${this.mountPath}/metadata/${prefix}?list=true`, {
        method: 'GET',
        headers: {
          'X-Vault-Token': this.token
        }
      });

      if (!response.ok) {
        throw new Error(`Vault API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.data?.keys || [];
    } catch (error) {
      console.error('Vault list error:', error);
      throw error;
    }
  }
}

// AWS Secrets Manager implementation
class AWSSecretsManager extends SecretManager {
  constructor(config) {
    super(config);
    this.region = config.aws.region;
    this.accessKeyId = config.aws.accessKeyId;
    this.secretAccessKey = config.aws.secretAccessKey;
  }

  async storeSecret(path, secret, metadata) {
    const cacheKey = `aws:${path}`;
    
    try {
      // AWS Secrets Manager API call would go here
      // This is a simplified implementation
      const response = await fetch(`https://secretsmanager.${this.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'secretsmanager.CreateSecret'
        },
        body: JSON.stringify({
          Name: path,
          SecretString: JSON.stringify({
            secret: secret,
            metadata: metadata
          })
        })
      });

      if (!response.ok) {
        throw new Error(`AWS Secrets Manager error: ${response.status} ${response.statusText}`);
      }

      this.setCache(cacheKey, secret);
      return await response.json();
    } catch (error) {
      console.error('AWS Secrets Manager store error:', error);
      throw error;
    }
  }

  async retrieveSecret(path) {
    const cacheKey = `aws:${path}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // AWS Secrets Manager API call would go here
      const response = await fetch(`https://secretsmanager.${this.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'secretsmanager.GetSecretValue'
        },
        body: JSON.stringify({
          SecretId: path
        })
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`AWS Secrets Manager error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const secretData = JSON.parse(result.SecretString);
      const secret = secretData.secret;
      
      if (secret) {
        this.setCache(cacheKey, secret);
      }
      return secret;
    } catch (error) {
      console.error('AWS Secrets Manager retrieve error:', error);
      throw error;
    }
  }

  async deleteSecret(path) {
    const cacheKey = `aws:${path}`;
    
    try {
      const response = await fetch(`https://secretsmanager.${this.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'secretsmanager.DeleteSecret'
        },
        body: JSON.stringify({
          SecretId: path,
          ForceDeleteWithoutRecovery: true
        })
      });

      if (!response.ok) {
        throw new Error(`AWS Secrets Manager error: ${response.status} ${response.statusText}`);
      }

      this.cache.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
      return true;
    } catch (error) {
      console.error('AWS Secrets Manager delete error:', error);
      throw error;
    }
  }

  async listSecrets(prefix) {
    try {
      const response = await fetch(`https://secretsmanager.${this.region}.amazonaws.com/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-amz-json-1.1',
          'X-Amz-Target': 'secretsmanager.ListSecrets'
        },
        body: JSON.stringify({
          Filters: [{
            Key: 'name',
            Values: [prefix]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`AWS Secrets Manager error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result.SecretList?.map(s => s.Name) || [];
    } catch (error) {
      console.error('AWS Secrets Manager list error:', error);
      throw error;
    }
  }
}

// Local encrypted storage (fallback)
class LocalEncryptedSecretManager extends SecretManager {
  constructor(config) {
    super(config);
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
    this.storage = new Map(); // In production, use Redis or database
  }

  encrypt(secret) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'), iv);
    cipher.setAAD(Buffer.from('secret-manager', 'utf8'));
    
    let encrypted = cipher.update(secret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedSecret) {
    try {
      const parts = encryptedSecret.split(':');
      if (parts.length !== 3) return encryptedSecret;
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(this.encryptionKey, 'hex'), iv);
      decipher.setAAD(Buffer.from('secret-manager', 'utf8'));
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  async storeSecret(path, secret, metadata) {
    const encryptedSecret = this.encrypt(secret);
    const secretData = {
      secret: encryptedSecret,
      metadata: metadata,
      createdAt: new Date().toISOString()
    };
    
    this.storage.set(path, secretData);
    this.setCache(path, secret);
    return secretData;
  }

  async retrieveSecret(path) {
    const cacheKey = `local:${path}`;
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    const secretData = this.storage.get(path);
    if (!secretData) return null;

    const decryptedSecret = this.decrypt(secretData.secret);
    if (decryptedSecret) {
      this.setCache(cacheKey, decryptedSecret);
    }
    return decryptedSecret;
  }

  async deleteSecret(path) {
    this.storage.delete(path);
    this.cache.delete(path);
    this.cacheExpiry.delete(path);
    return true;
  }

  async listSecrets(prefix) {
    return Array.from(this.storage.keys()).filter(key => key.startsWith(prefix));
  }
}

// Secret manager factory
function createSecretManager() {
  switch (SECRET_CONFIG.provider) {
    case SECRET_PROVIDERS.VAULT:
      return new VaultSecretManager(SECRET_CONFIG);
    case SECRET_PROVIDERS.AWS_SECRETS:
      return new AWSSecretsManager(SECRET_CONFIG);
    case SECRET_PROVIDERS.LOCAL_ENCRYPTED:
    default:
      return new LocalEncryptedSecretManager(SECRET_CONFIG);
  }
}

// Global secret manager instance
const secretManager = createSecretManager();

// High-level API for secret management
export class SecretService {
  static async storeUserToken(userId, tokenType, token, expiresAt, tags = {}) {
    const path = secretManager.generateSecretPath(tokenType, userId);
    const metadata = new SecretMetadata(tokenType, userId, expiresAt, new Date(), tags);
    
    try {
      await secretManager.storeSecret(path, token, metadata);
      
      // Log the operation
      console.log(`🔐 Stored ${tokenType} for user ${userId} in external secret manager`);
      
      return { success: true, path };
    } catch (error) {
      console.error(`❌ Failed to store ${tokenType} for user ${userId}:`, error);
      throw error;
    }
  }

  static async retrieveUserToken(userId, tokenType) {
    const path = secretManager.generateSecretPath(tokenType, userId);
    
    try {
      const token = await secretManager.retrieveSecret(path);
      
      if (token) {
        console.log(`🔓 Retrieved ${tokenType} for user ${userId} from external secret manager`);
      }
      
      return token;
    } catch (error) {
      console.error(`❌ Failed to retrieve ${tokenType} for user ${userId}:`, error);
      throw error;
    }
  }

  static async deleteUserToken(userId, tokenType) {
    const path = secretManager.generateSecretPath(tokenType, userId);
    
    try {
      await secretManager.deleteSecret(path);
      console.log(`🗑️ Deleted ${tokenType} for user ${userId} from external secret manager`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Failed to delete ${tokenType} for user ${userId}:`, error);
      throw error;
    }
  }

  static async listUserTokens(userId) {
    const prefix = `autobot/${userId}`;
    
    try {
      const tokens = await secretManager.listSecrets(prefix);
      return tokens;
    } catch (error) {
      console.error(`❌ Failed to list tokens for user ${userId}:`, error);
      throw error;
    }
  }

  static async cleanupExpiredTokens() {
    try {
      const allTokens = await secretManager.listSecrets('autobot/');
      const expiredTokens = [];
      
      for (const tokenPath of allTokens) {
        const secretData = await secretManager.retrieveSecret(tokenPath);
        if (secretData && secretData.metadata && secretData.metadata.expiresAt) {
          if (new Date(secretData.metadata.expiresAt) < new Date()) {
            await secretManager.deleteSecret(tokenPath);
            expiredTokens.push(tokenPath);
          }
        }
      }
      
      console.log(`🧹 Cleaned up ${expiredTokens.length} expired tokens`);
      return { cleaned: expiredTokens.length, tokens: expiredTokens };
    } catch (error) {
      console.error('❌ Failed to cleanup expired tokens:', error);
      throw error;
    }
  }
}

// Export the secret service and configuration
export {
  SecretService,
  SECRET_PROVIDERS,
  SECRET_TYPES,
  SECRET_CONFIG,
  secretManager
};