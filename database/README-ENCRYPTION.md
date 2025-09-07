# 🔒 Data Encryption Migration Guide

## Critical Security Update

**IMPORTANT**: This update implements encryption for sensitive user data stored in the database. All GitHub tokens and Cursor API keys will now be encrypted before storage.

## What's Being Encrypted

- **GitHub Access Tokens** - Used for repository access
- **Cursor API Keys** - User-provided API keys
- **Future sensitive data** - Any new sensitive fields will be encrypted

## Migration Steps

### 1. Deploy the Updated Code
The server code now includes:
- AES-256-GCM encryption functions
- Automatic encryption of sensitive data on save
- Automatic decryption of sensitive data on retrieval
- Migration endpoint for existing data

### 2. Set Encryption Key
Add to your Railway environment variables:
```
ENCRYPTION_KEY=your-32-character-secret-key-here
```

**Generate a secure key:**
```bash
# Generate a random 32-character hex key
openssl rand -hex 32
```

### 3. Run Data Migration
After deploying, call the migration endpoint:
```bash
curl -X POST https://web-production-8747.up.railway.app/api/admin/encrypt-existing-data
```

This will:
- Find all users with sensitive data
- Encrypt existing GitHub tokens and API keys
- Report the number of records processed

### 4. Verify Encryption
Check that data is encrypted by looking at the database:
```sql
-- This should show encrypted strings (containing colons)
SELECT id, email, 
  CASE WHEN "githubToken" LIKE '%:%:%' THEN 'ENCRYPTED' ELSE 'NOT_ENCRYPTED' END as token_status,
  CASE WHEN "cursorApiKey" LIKE '%:%:%' THEN 'ENCRYPTED' ELSE 'NOT_ENCRYPTED' END as key_status
FROM "Users" 
WHERE "githubToken" IS NOT NULL OR "cursorApiKey" IS NOT NULL;
```

## Security Features

### Encryption Algorithm
- **Algorithm**: AES-256-GCM
- **Key**: 32-byte random key from environment variable
- **IV**: Random 16-byte initialization vector per encryption
- **Auth Tag**: Prevents tampering

### Data Format
Encrypted data is stored as: `IV:AuthTag:EncryptedData`

### Automatic Handling
- **Save**: Sensitive data is automatically encrypted
- **Retrieve**: Sensitive data is automatically decrypted
- **Backward Compatible**: Handles both encrypted and unencrypted data

## Testing

### Test Encryption/Decryption
```bash
# Test the encryption functions
curl -X GET https://web-production-8747.up.railway.app/api/health
```

### Test User Profile
After migration, verify that:
1. User profiles load correctly
2. GitHub integration still works
3. API keys are functional

## Rollback Plan

If issues occur:
1. The system handles both encrypted and unencrypted data
2. You can temporarily disable encryption by not setting `ENCRYPTION_KEY`
3. Data remains accessible during transition

## Security Benefits

✅ **Database Security**: Sensitive data is encrypted at rest
✅ **Access Control**: Only the application can decrypt data
✅ **Compliance**: Meets data protection requirements
✅ **Future-Proof**: All new sensitive data is automatically encrypted

## Important Notes

- **Backup First**: Always backup your database before migration
- **Test Thoroughly**: Verify all functionality after migration
- **Monitor Logs**: Watch for any encryption/decryption errors
- **Key Management**: Store `ENCRYPTION_KEY` securely

## Support

If you encounter issues:
1. Check server logs for encryption errors
2. Verify `ENCRYPTION_KEY` is set correctly
3. Test with a small dataset first
4. Contact support with specific error messages