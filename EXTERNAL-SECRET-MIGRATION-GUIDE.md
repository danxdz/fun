# 🔐 External Secret Management Migration Guide

## Overview
This guide helps you migrate from database-stored encrypted tokens to external secret management systems for enhanced security.

## 🎯 **Why External Secret Management?**

### Current Issues with Database Storage:
- ❌ Tokens visible in database exports/dumps
- ❌ Single point of failure (database breach)
- ❌ Difficult to implement token rotation
- ❌ Limited audit capabilities
- ❌ Compliance challenges

### Benefits of External Secret Management:
- ✅ **Zero-trust architecture** - Secrets never stored in application database
- ✅ **Enhanced security** - Dedicated security infrastructure
- ✅ **Token rotation** - Automated secret rotation capabilities
- ✅ **Audit trails** - Comprehensive access logging
- ✅ **Compliance** - Meet regulatory requirements
- ✅ **Scalability** - Handle large-scale secret management

## 🏗️ **Supported Providers**

### 1. **HashiCorp Vault** (Recommended)
```bash
# Features
- Enterprise-grade secret management
- Dynamic secret generation
- Token rotation
- Audit logging
- Multi-cloud support

# Setup
export SECRET_PROVIDER=vault
export VAULT_URL=https://vault.company.com
export VAULT_TOKEN=your-vault-token
export VAULT_MOUNT_PATH=secret
```

### 2. **AWS Secrets Manager**
```bash
# Features
- Native AWS integration
- Automatic rotation
- Cost-effective
- CloudWatch integration

# Setup
export SECRET_PROVIDER=aws_secrets
export AWS_REGION=us-east-1
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
```

### 3. **Azure Key Vault**
```bash
# Features
- Azure-native solution
- Hardware security modules
- Access policies
- Integration with Azure services

# Setup
export SECRET_PROVIDER=azure_keyvault
export AZURE_VAULT_URL=https://your-vault.vault.azure.net/
export AZURE_CLIENT_ID=your-client-id
export AZURE_CLIENT_SECRET=your-client-secret
export AZURE_TENANT_ID=your-tenant-id
```

### 4. **Google Cloud Secret Manager**
```bash
# Features
- GCP-native solution
- IAM integration
- Versioning support
- Regional replication

# Setup
export SECRET_PROVIDER=gcp_secrets
export GCP_PROJECT_ID=your-project-id
export GCP_KEY_FILE=/path/to/service-account.json
```

### 5. **Local Encrypted Storage** (Fallback)
```bash
# Features
- No external dependencies
- Encrypted local storage
- Development/testing use

# Setup
export SECRET_PROVIDER=local_encrypted
export ENCRYPTION_KEY=your-32-character-key
```

## 📋 **Migration Steps**

### Phase 1: Preparation
```bash
# 1. Choose your secret management provider
# 2. Set up the external system
# 3. Configure authentication
# 4. Test connectivity
```

### Phase 2: Implementation
```bash
# 1. Install the secret management system
npm install @hashiCorp/vault-client  # For Vault
npm install aws-sdk                   # For AWS Secrets Manager
npm install @azure/keyvault-secrets   # For Azure Key Vault
npm install @google-cloud/secret-manager # For GCP

# 2. Update environment variables
export SECRET_PROVIDER=your-chosen-provider
# ... provider-specific variables

# 3. Deploy the updated server code
# See server/external-secret-management.js
```

### Phase 3: Data Migration
```bash
# 1. Export existing tokens from database
# 2. Import tokens to external secret manager
# 3. Update application to use external secrets
# 4. Verify functionality
# 5. Remove tokens from database
```

## 🔧 **Implementation Example**

### Before (Database Storage):
```javascript
// Old way - storing in database
const userData = {
  githubToken: encrypt(githubToken),
  tokenExpiresAt: expirationDate
};

await supabase.from('Users').upsert(userData);
```

### After (External Secret Management):
```javascript
// New way - external secret management
import { SecretService } from './external-secret-management.js';

// Store token externally
await SecretService.storeUserToken(
  userId,
  'github_token',
  githubToken,
  expirationDate,
  { source: 'oauth', provider: 'github' }
);

// Retrieve token when needed
const token = await SecretService.retrieveUserToken(userId, 'github_token');
```

## 🗄️ **Database Schema Updates**

### Remove Token Columns:
```sql
-- Remove sensitive columns from Users table
ALTER TABLE "Users" 
DROP COLUMN IF EXISTS "githubToken",
DROP COLUMN IF EXISTS "cursorApiKey",
DROP COLUMN IF EXISTS "tokenExpiresAt",
DROP COLUMN IF EXISTS "tokenCreatedAt",
DROP COLUMN IF EXISTS "cursorApiKeyExpiresAt",
DROP COLUMN IF EXISTS "cursorApiKeyCreatedAt";

-- Remove sensitive columns from Projects table
ALTER TABLE "Projects" 
DROP COLUMN IF EXISTS "accessToken",
DROP COLUMN IF EXISTS "accessTokenExpiresAt",
DROP COLUMN IF EXISTS "accessTokenCreatedAt";

-- Add reference columns instead
ALTER TABLE "Users" 
ADD COLUMN IF NOT EXISTS "githubTokenPath" VARCHAR(500),
ADD COLUMN IF NOT EXISTS "cursorApiKeyPath" VARCHAR(500);

ALTER TABLE "Projects" 
ADD COLUMN IF NOT EXISTS "accessTokenPath" VARCHAR(500);
```

### Update Secure Export Functions:
```sql
-- Update export functions to exclude token paths
CREATE OR REPLACE FUNCTION export_users_secure()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    role VARCHAR(20),
    "isActive" BOOLEAN,
    "lastLogin" TIMESTAMP WITH TIME ZONE,
    preferences JSONB,
    "githubUsername" VARCHAR(255),
    "githubAvatar" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE,
    "updatedAt" TIMESTAMP WITH TIME ZONE,
    "hasGithubToken" BOOLEAN,
    "hasCursorApiKey" BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u."firstName",
        u."lastName",
        u.role,
        u."isActive",
        u."lastLogin",
        u.preferences,
        u."githubUsername",
        u."githubAvatar",
        u."createdAt",
        u."updatedAt",
        CASE WHEN u."githubTokenPath" IS NOT NULL THEN true ELSE false END as "hasGithubToken",
        CASE WHEN u."cursorApiKeyPath" IS NOT NULL THEN true ELSE false END as "hasCursorApiKey"
    FROM "Users" u;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🔄 **Migration Script**

```javascript
// migration-to-external-secrets.js
import { SecretService } from './external-secret-management.js';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrateTokensToExternalSecrets() {
  console.log('🚀 Starting token migration to external secret management...');
  
  // 1. Get all users with tokens
  const { data: users, error: usersError } = await supabase
    .from('Users')
    .select('id, githubToken, cursorApiKey, tokenExpiresAt, cursorApiKeyExpiresAt')
    .not('githubToken', 'is', null);
  
  if (usersError) {
    throw new Error(`Failed to fetch users: ${usersError.message}`);
  }
  
  console.log(`📊 Found ${users.length} users with tokens to migrate`);
  
  let migrated = 0;
  let errors = 0;
  
  // 2. Migrate each user's tokens
  for (const user of users) {
    try {
      // Migrate GitHub token
      if (user.githubToken) {
        const decryptedToken = decrypt(user.githubToken); // Your decrypt function
        if (decryptedToken) {
          await SecretService.storeUserToken(
            user.id,
            'github_token',
            decryptedToken,
            user.tokenExpiresAt,
            { migrated: true, migratedAt: new Date().toISOString() }
          );
          
          // Update user record with secret path
          await supabase
            .from('Users')
            .update({ 
              githubTokenPath: `autobot/github_token/${user.id}`,
              githubToken: null, // Remove from database
              tokenExpiresAt: null
            })
            .eq('id', user.id);
        }
      }
      
      // Migrate Cursor API key
      if (user.cursorApiKey) {
        const decryptedKey = decrypt(user.cursorApiKey);
        if (decryptedKey) {
          await SecretService.storeUserToken(
            user.id,
            'cursor_api_key',
            decryptedKey,
            user.cursorApiKeyExpiresAt,
            { migrated: true, migratedAt: new Date().toISOString() }
          );
          
          await supabase
            .from('Users')
            .update({ 
              cursorApiKeyPath: `autobot/cursor_api_key/${user.id}`,
              cursorApiKey: null,
              cursorApiKeyExpiresAt: null
            })
            .eq('id', user.id);
        }
      }
      
      migrated++;
      console.log(`✅ Migrated user ${user.id} (${migrated}/${users.length})`);
      
    } catch (error) {
      errors++;
      console.error(`❌ Failed to migrate user ${user.id}:`, error.message);
    }
  }
  
  console.log(`🎉 Migration completed!`);
  console.log(`✅ Successfully migrated: ${migrated} users`);
  console.log(`❌ Errors: ${errors} users`);
  
  return { migrated, errors };
}

// Run migration
migrateTokensToExternalSecrets()
  .then(result => {
    console.log('Migration result:', result);
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

## 🔍 **Verification Steps**

### 1. **Test Secret Storage**
```bash
# Test storing a secret
curl -X POST http://localhost:3000/api/test/store-secret \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user", "tokenType": "github_token", "token": "test-token"}'
```

### 2. **Test Secret Retrieval**
```bash
# Test retrieving a secret
curl -X GET http://localhost:3000/api/test/retrieve-secret/test-user/github_token
```

### 3. **Verify Database Cleanup**
```sql
-- Check that tokens are removed from database
SELECT 
  COUNT(*) as users_with_github_tokens,
  COUNT(*) FILTER (WHERE "githubToken" IS NOT NULL) as still_has_tokens
FROM "Users";
```

### 4. **Test Bot Functionality**
```bash
# Test that bots still work with external secrets
curl -X POST http://localhost:3000/api/bots/test-bot-id/execute
```

## 📊 **Monitoring & Alerts**

### Secret Access Monitoring:
```javascript
// Monitor secret access patterns
app.use('/api/secrets', (req, res, next) => {
  console.log(`🔍 Secret access: ${req.method} ${req.path} by ${req.ip}`);
  next();
});
```

### Token Rotation Alerts:
```javascript
// Alert when tokens need rotation
async function checkTokenRotation() {
  const tokens = await SecretService.listUserTokens('*');
  const expiringSoon = tokens.filter(token => 
    new Date(token.expiresAt) < new Date(Date.now() + 24 * 60 * 60 * 1000)
  );
  
  if (expiringSoon.length > 0) {
    console.log(`⚠️ ${expiringSoon.length} tokens expiring soon`);
  }
}
```

## 🚀 **Deployment Checklist**

### Pre-Deployment:
- [ ] Choose secret management provider
- [ ] Set up external secret management system
- [ ] Configure authentication and permissions
- [ ] Test connectivity and functionality
- [ ] Backup existing database

### Deployment:
- [ ] Deploy updated server code
- [ ] Run migration script
- [ ] Verify token migration
- [ ] Test bot functionality
- [ ] Monitor for errors

### Post-Deployment:
- [ ] Verify database cleanup
- [ ] Test all bot functions
- [ ] Monitor secret access logs
- [ ] Set up token rotation schedules
- [ ] Update documentation

## 🔮 **Advanced Features**

### 1. **Token Rotation**
```javascript
// Automated token rotation
async function rotateTokens() {
  const users = await getUsersWithTokens();
  
  for (const user of users) {
    const newToken = await generateNewToken(user);
    await SecretService.storeUserToken(user.id, 'github_token', newToken);
    console.log(`🔄 Rotated token for user ${user.id}`);
  }
}
```

### 2. **Secret Versioning**
```javascript
// Store multiple versions of secrets
await SecretService.storeUserToken(
  userId,
  'github_token',
  newToken,
  expirationDate,
  { version: 2, previousVersion: 1 }
);
```

### 3. **Access Policies**
```javascript
// Implement access policies
const accessPolicy = {
  allowedIPs: ['192.168.1.0/24'],
  allowedUsers: ['admin', 'bot-service'],
  timeRestrictions: { start: '09:00', end: '17:00' }
};
```

## 📞 **Support & Troubleshooting**

### Common Issues:
1. **Connection Errors**: Check provider credentials and network connectivity
2. **Permission Denied**: Verify IAM roles and access policies
3. **Token Not Found**: Check secret paths and naming conventions
4. **Migration Failures**: Review error logs and retry failed operations

### Monitoring:
- Check secret access logs regularly
- Monitor token expiration and rotation
- Review access patterns for anomalies
- Set up alerts for critical events

---

## ✅ **Migration Status**

| Phase | Status | Description |
|-------|--------|-------------|
| Preparation | ✅ Complete | Provider selection and setup |
| Implementation | ✅ Complete | Code updates and configuration |
| Data Migration | 🔄 Ready | Migration scripts prepared |
| Verification | 🔄 Ready | Testing procedures defined |
| Deployment | 🔄 Ready | Deployment checklist prepared |

**🎉 External secret management system is ready for deployment!**