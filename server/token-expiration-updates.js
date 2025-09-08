// ========================================
// TOKEN EXPIRATION UPDATES FOR SERVER
// ========================================
// This file contains the updates needed to implement token expiration

// 1. Add token expiration check helper function (add after line 2398)
const tokenExpirationHelper = `
// Helper function to check token expiration
function checkTokenExpiration(tokenExpiresAt, tokenType = 'GitHub token') {
  if (tokenExpiresAt && new Date(tokenExpiresAt) < new Date()) {
    throw new Error(\`\${tokenType} has expired. Please re-authenticate.\`);
  }
}
`;

// 2. Update all bot functions to include token expiration
const botFunctionUpdates = [
  {
    function: 'runSecurityScan',
    update: `
    // Get user's GitHub token with expiration check
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('githubToken, tokenExpiresAt')
      .eq('id', project.UserId)
      .single();
    
    if (userError || !user) {
      throw new Error('User not found');
    }
    
    // Check if token is expired
    checkTokenExpiration(user.tokenExpiresAt, 'GitHub token');
    
    const githubToken = decrypt(user.githubToken);
    `
  },
  {
    function: 'checkDependencyUpdates',
    update: `
    // Get user's GitHub token with expiration check
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('githubToken, tokenExpiresAt')
      .eq('id', project.UserId)
      .single();
    
    if (userError || !user) {
      throw new Error('User not found');
    }
    
    // Check if token is expired
    checkTokenExpiration(user.tokenExpiresAt, 'GitHub token');
    
    const githubToken = decrypt(user.githubToken);
    `
  },
  {
    function: 'runCustomBot',
    update: `
    // Get user's GitHub token and Cursor API key with expiration check
    const { data: user, error: userError } = await supabase
      .from('Users')
      .select('githubToken, cursorApiKey, tokenExpiresAt, cursorApiKeyExpiresAt')
      .eq('id', project.UserId)
      .single();
    
    if (userError || !user) {
      throw new Error('User not found');
    }
    
    // Check if tokens are expired
    checkTokenExpiration(user.tokenExpiresAt, 'GitHub token');
    checkTokenExpiration(user.cursorApiKeyExpiresAt, 'Cursor API key');
    
    const githubToken = decrypt(user.githubToken);
    const cursorApiKey = decrypt(user.cursorApiKey);
    `
  }
];

// 3. Add automated token cleanup endpoint
const tokenCleanupEndpoint = `
// Automated token cleanup endpoint
app.post('/api/admin/cleanup-expired-tokens', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Clean up expired GitHub tokens
    const { data: githubCleaned, error: githubError } = await supabase
      .from('Users')
      .update({ 
        githubToken: null, 
        tokenExpiresAt: null,
        updatedAt: new Date().toISOString()
      })
      .lt('tokenExpiresAt', new Date().toISOString())
      .not('githubToken', 'is', null);
    
    if (githubError) {
      console.error('Error cleaning up GitHub tokens:', githubError);
    }
    
    // Clean up expired Cursor API keys
    const { data: cursorCleaned, error: cursorError } = await supabase
      .from('Users')
      .update({ 
        cursorApiKey: null, 
        cursorApiKeyExpiresAt: null,
        updatedAt: new Date().toISOString()
      })
      .lt('cursorApiKeyExpiresAt', new Date().toISOString())
      .not('cursorApiKey', 'is', null);
    
    if (cursorError) {
      console.error('Error cleaning up Cursor API keys:', cursorError);
    }
    
    res.json({
      message: 'Token cleanup completed',
      githubTokensCleaned: githubCleaned?.length || 0,
      cursorKeysCleaned: cursorCleaned?.length || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Token cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});
`;

// 4. Add token monitoring endpoint
const tokenMonitoringEndpoint = `
// Token monitoring endpoint
app.get('/api/admin/token-status', async (req, res) => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get token statistics
    const { data: users, error: usersError } = await supabase
      .from('Users')
      .select('githubToken, cursorApiKey, tokenExpiresAt, cursorApiKeyExpiresAt');
    
    if (usersError) {
      throw new Error('Failed to fetch user data');
    }
    
    const stats = {
      totalUsers: users.length,
      usersWithGithubTokens: users.filter(u => u.githubToken && u.githubToken !== '').length,
      usersWithCursorKeys: users.filter(u => u.cursorApiKey && u.cursorApiKey !== '').length,
      expiredGithubTokens: users.filter(u => u.tokenExpiresAt && new Date(u.tokenExpiresAt) < new Date()).length,
      expiredCursorKeys: users.filter(u => u.cursorApiKeyExpiresAt && new Date(u.cursorApiKeyExpiresAt) < new Date()).length,
      githubTokensExpiringSoon: users.filter(u => {
        if (!u.tokenExpiresAt) return false;
        const expiresAt = new Date(u.tokenExpiresAt);
        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        return expiresAt > new Date() && expiresAt < oneHourFromNow;
      }).length,
      cursorKeysExpiringSoon: users.filter(u => {
        if (!u.cursorApiKeyExpiresAt) return false;
        const expiresAt = new Date(u.cursorApiKeyExpiresAt);
        const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
        return expiresAt > new Date() && expiresAt < oneHourFromNow;
      }).length
    };
    
    res.json({
      timestamp: new Date().toISOString(),
      statistics: stats,
      recommendations: {
        cleanupNeeded: stats.expiredGithubTokens > 0 || stats.expiredCursorKeys > 0,
        attentionNeeded: stats.githubTokensExpiringSoon > 0 || stats.cursorKeysExpiringSoon > 0
      }
    });
    
  } catch (error) {
    console.error('Token status error:', error);
    res.status(500).json({ error: error.message });
  }
});
`;

// 5. Add startup token cleanup
const startupCleanup = `
// Add this to the server startup (after line 3990)
if (!process.env.ENCRYPTION_KEY) {
  console.log('🚨 CRITICAL: ENCRYPTION_KEY not set - sensitive data will not be encrypted!');
  console.log('🔐 Please set ENCRYPTION_KEY environment variable for data security');
} else {
  console.log('🔐 ENCRYPTION_KEY is set - sensitive data will be encrypted');
}

// Clean up expired tokens on startup
(async () => {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Clean up expired tokens
    const { data: cleaned, error } = await supabase
      .from('Users')
      .update({ 
        githubToken: null, 
        tokenExpiresAt: null,
        updatedAt: new Date().toISOString()
      })
      .lt('tokenExpiresAt', new Date().toISOString())
      .not('githubToken', 'is', null);
    
    if (error) {
      console.error('Startup token cleanup error:', error);
    } else {
      console.log('🧹 Startup token cleanup completed');
    }
  } catch (error) {
    console.error('Startup cleanup error:', error);
  }
})();
`;

// Export all updates
module.exports = {
  tokenExpirationHelper,
  botFunctionUpdates,
  tokenCleanupEndpoint,
  tokenMonitoringEndpoint,
  startupCleanup
};