// ========================================
// MONITORING AND ALERTING SYSTEM
// ========================================
// This file implements monitoring and alerts for token storage/export

import crypto from 'crypto';

// Alert levels
const ALERT_LEVELS = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Alert types
const ALERT_TYPES = {
  TOKEN_EXPORT: 'token_export',
  TOKEN_STORAGE: 'token_storage',
  TOKEN_EXPIRATION: 'token_expiration',
  ENCRYPTION_FAILURE: 'encryption_failure',
  UNAUTHORIZED_ACCESS: 'unauthorized_access'
};

// In-memory alert store (in production, use Redis or database)
const alerts = [];
const MAX_ALERTS = 1000;

// Alert creation function
function createAlert(type, level, message, metadata = {}) {
  const alert = {
    id: crypto.randomUUID(),
    type,
    level,
    message,
    metadata,
    timestamp: new Date().toISOString(),
    acknowledged: false
  };
  
  alerts.push(alert);
  
  // Keep only the most recent alerts
  if (alerts.length > MAX_ALERTS) {
    alerts.shift();
  }
  
  // Log the alert
  console.log(`🚨 ALERT [${level.toUpperCase()}] ${type}: ${message}`, metadata);
  
  return alert;
}

// Token export monitoring
function monitorTokenExport(query, userAgent, ip) {
  // Check for suspicious queries that might export tokens
  const suspiciousPatterns = [
    /SELECT.*githubToken/i,
    /SELECT.*cursorApiKey/i,
    /SELECT.*accessToken/i,
    /EXPORT.*token/i,
    /DUMP.*token/i,
    /\.csv.*token/i,
    /\.json.*token/i
  ];
  
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(query));
  
  if (isSuspicious) {
    createAlert(
      ALERT_TYPES.TOKEN_EXPORT,
      ALERT_LEVELS.CRITICAL,
      'Potential token export attempt detected',
      {
        query: query.substring(0, 200), // Truncate for security
        userAgent,
        ip,
        timestamp: new Date().toISOString()
      }
    );
  }
}

// Token storage monitoring
function monitorTokenStorage(action, userId, tokenType) {
  createAlert(
    ALERT_TYPES.TOKEN_STORAGE,
    ALERT_LEVELS.INFO,
    `Token ${action} for user ${userId}`,
    {
      action, // 'stored', 'updated', 'deleted'
      userId,
      tokenType, // 'github', 'cursor', 'project'
      timestamp: new Date().toISOString()
    }
  );
}

// Token expiration monitoring
function monitorTokenExpiration(tokenType, count, timeUntilExpiry) {
  const level = timeUntilExpiry < 60 * 60 * 1000 ? ALERT_LEVELS.WARN : ALERT_LEVELS.INFO;
  
  createAlert(
    ALERT_TYPES.TOKEN_EXPIRATION,
    level,
    `${count} ${tokenType} tokens expiring soon`,
    {
      tokenType,
      count,
      timeUntilExpiry,
      timestamp: new Date().toISOString()
    }
  );
}

// Encryption failure monitoring
function monitorEncryptionFailure(operation, error, userId) {
  createAlert(
    ALERT_TYPES.ENCRYPTION_FAILURE,
    ALERT_LEVELS.ERROR,
    `Encryption failure during ${operation}`,
    {
      operation,
      error: error.message,
      userId,
      timestamp: new Date().toISOString()
    }
  );
}

// Unauthorized access monitoring
function monitorUnauthorizedAccess(attempt, ip, userAgent) {
  createAlert(
    ALERT_TYPES.UNAUTHORIZED_ACCESS,
    ALERT_LEVELS.CRITICAL,
    `Unauthorized access attempt: ${attempt}`,
    {
      attempt,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    }
  );
}

// Get alerts with filtering
function getAlerts(filters = {}) {
  let filteredAlerts = [...alerts];
  
  if (filters.level) {
    filteredAlerts = filteredAlerts.filter(alert => alert.level === filters.level);
  }
  
  if (filters.type) {
    filteredAlerts = filteredAlerts.filter(alert => alert.type === filters.type);
  }
  
  if (filters.acknowledged !== undefined) {
    filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === filters.acknowledged);
  }
  
  if (filters.since) {
    const sinceDate = new Date(filters.since);
    filteredAlerts = filteredAlerts.filter(alert => new Date(alert.timestamp) >= sinceDate);
  }
  
  // Sort by timestamp (newest first)
  return filteredAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Acknowledge alert
function acknowledgeAlert(alertId) {
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedAt = new Date().toISOString();
    return true;
  }
  return false;
}

// Get alert statistics
function getAlertStatistics() {
  const stats = {
    total: alerts.length,
    byLevel: {},
    byType: {},
    unacknowledged: 0,
    last24Hours: 0
  };
  
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  alerts.forEach(alert => {
    // Count by level
    stats.byLevel[alert.level] = (stats.byLevel[alert.level] || 0) + 1;
    
    // Count by type
    stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    
    // Count unacknowledged
    if (!alert.acknowledged) {
      stats.unacknowledged++;
    }
    
    // Count last 24 hours
    if (new Date(alert.timestamp) >= oneDayAgo) {
      stats.last24Hours++;
    }
  });
  
  return stats;
}

// Express middleware for monitoring
function monitoringMiddleware(req, res, next) {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Monitor for token data in responses
    if (typeof data === 'string' && data.includes('githubToken')) {
      createAlert(
        ALERT_TYPES.TOKEN_EXPORT,
        ALERT_LEVELS.CRITICAL,
        'Token data detected in API response',
        {
          endpoint: req.path,
          method: req.method,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        }
      );
    }
    
    originalSend.call(this, data);
  };
  
  next();
}

// Export monitoring functions
export {
  createAlert,
  monitorTokenExport,
  monitorTokenStorage,
  monitorTokenExpiration,
  monitorEncryptionFailure,
  monitorUnauthorizedAccess,
  getAlerts,
  acknowledgeAlert,
  getAlertStatistics,
  monitoringMiddleware,
  ALERT_LEVELS,
  ALERT_TYPES
};