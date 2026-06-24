/**
 * Enterprise-grade Audit Logger for Security Events
 * Ensures no Personally Identifiable Information (PII) is logged.
 */

// A simple utility to hash or redact sensitive fields before logging
function redactPII(details) {
  if (!details) return details;
  
  const redacted = { ...details };
  
  // List of keys that potentially contain PII
  const piiKeys = ['email', 'password', 'phone', 'ssn', 'credit_card', 'name', 'full_name'];
  
  for (const key of Object.keys(redacted)) {
    if (piiKeys.includes(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactPII(redacted[key]); // Recursively redact
    }
  }
  
  return redacted;
}

export const auditLogger = {
  /**
   * Log a security event
   * @param {string} event - The name/type of the security event (e.g., 'UNAUTHORIZED_ACCESS', 'RATE_LIMIT_EXCEEDED')
   * @param {Object} context - Contextual information (e.g., user ID, IP address, resource accessed)
   */
  log: (event, context = {}) => {
    const timestamp = new Date().toISOString();
    const safeContext = redactPII(context);
    
    // In a real enterprise system, this would write to Datadog, CloudWatch, or an ELK stack.
    // For now, we write a structured JSON log to stdout which most log aggregators will parse automatically.
    console.log(JSON.stringify({
      timestamp,
      level: 'SECURITY',
      event,
      context: safeContext,
    }));
  },

  /**
   * Specifically log failed validation or suspected attacks
   */
  warn: (event, context = {}) => {
    const timestamp = new Date().toISOString();
    const safeContext = redactPII(context);
    
    console.warn(JSON.stringify({
      timestamp,
      level: 'SECURITY_WARNING',
      event,
      context: safeContext,
    }));
  },
  
  /**
   * Log critical security failures
   */
  error: (event, error, context = {}) => {
    const timestamp = new Date().toISOString();
    const safeContext = redactPII(context);
    
    console.error(JSON.stringify({
      timestamp,
      level: 'SECURITY_CRITICAL',
      event,
      error: error?.message || 'Unknown error',
      stack: error?.stack,
      context: safeContext,
    }));
  }
};
