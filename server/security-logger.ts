import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Alternative approach for getting __dirname in both ESM and CommonJS
const getCurrentDir = (): string => {
  if (typeof __dirname !== 'undefined') {
    return __dirname;
  }
  try {
    const __filename = fileURLToPath(import.meta.url);
    return path.dirname(__filename);
  } catch {
    // Fallback for environments where import.meta.url is not available
    return process.cwd();
  }
};

const __dirname: string = getCurrentDir();

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Security event types
type SecurityEventType = 
  | 'FAILED_LOGIN'
  | 'SUCCESSFUL_LOGIN'
  | 'BRUTE_FORCE_ATTEMPT'
  | 'CSRF_FAILURE'
  | 'XSS_ATTEMPT'
  | 'SQL_INJECTION_ATTEMPT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'UNAUTHORIZED_ACCESS'
  | 'ADMIN_ACCESS'
  | 'PAYMENT_PROCESSING'
  | 'EMAIL_SENT'
  | 'PASSWORD_CHANGE'
  | 'ACCOUNT_LOCKOUT';

interface SecurityEvent {
  timestamp: Date;
  eventType: SecurityEventType;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

class SecurityLogger {
  private logFilePath: string;

  constructor() {
    this.logFilePath = path.join(logsDir, 'security.log');
  }

  /**
   * Log a security event
   * @param event The security event to log
   */
  logEvent(event: SecurityEvent): void {
    const logEntry = {
      ...event,
      timestamp: event.timestamp.toISOString()
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    // Write to file
    fs.appendFileSync(this.logFilePath, logLine);
    
    // Also log to console for immediate visibility
    console.log(`[SECURITY] ${logEntry.timestamp} - ${event.eventType} - ${event.ipAddress} - ${event.details || ''}`);
  }

  /**
   * Log a failed login attempt
   */
  logFailedLogin(ipAddress: string, email: string, userAgent?: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'FAILED_LOGIN',
      ipAddress,
      userAgent,
      details: `Failed login attempt for email: ${email}`,
      severity: 'MEDIUM'
    });
  }

  /**
   * Log a successful login
   */
  logSuccessfulLogin(userId: string, ipAddress: string, userAgent?: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'SUCCESSFUL_LOGIN',
      userId,
      ipAddress,
      userAgent,
      details: 'User successfully logged in',
      severity: 'LOW'
    });
  }

  /**
   * Log a brute force attempt
   */
  logBruteForceAttempt(ipAddress: string, attemptCount: number): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'BRUTE_FORCE_ATTEMPT',
      ipAddress,
      details: `Brute force attempt detected (${attemptCount} attempts)`,
      severity: 'HIGH'
    });
  }

  /**
   * Log a CSRF failure
   */
  logCSRFViolation(userId: string, ipAddress: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'CSRF_FAILURE',
      userId,
      ipAddress,
      details: 'CSRF token validation failed',
      severity: 'HIGH'
    });
  }

  /**
   * Log an XSS attempt
   */
  logXSSAttempt(ipAddress: string, input: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'XSS_ATTEMPT',
      ipAddress,
      details: `XSS attempt detected with input: ${input.substring(0, 100)}...`,
      severity: 'HIGH'
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(ipAddress: string, endpoint: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'RATE_LIMIT_EXCEEDED',
      ipAddress,
      details: `Rate limit exceeded for endpoint: ${endpoint}`,
      severity: 'MEDIUM'
    });
  }

  /**
   * Log unauthorized access attempt
   */
  logUnauthorizedAccess(ipAddress: string, endpoint: string, userId?: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'UNAUTHORIZED_ACCESS',
      userId,
      ipAddress,
      details: `Unauthorized access attempt to endpoint: ${endpoint}`,
      severity: 'HIGH'
    });
  }

  /**
   * Log admin access
   */
  logAdminAccess(userId: string, ipAddress: string, action: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'ADMIN_ACCESS',
      userId,
      ipAddress,
      details: `Admin action: ${action}`,
      severity: 'MEDIUM'
    });
  }

  /**
   * Log payment processing
   */
  logPaymentProcessing(userId: string, ipAddress: string, amount: number, currency: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'PAYMENT_PROCESSING',
      userId,
      ipAddress,
      details: `Payment processed: ${amount} ${currency}`,
      severity: 'LOW'
    });
  }

  /**
   * Log email sent
   */
  logEmailSent(to: string, subject: string, userId?: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'EMAIL_SENT',
      userId,
      ipAddress: 'SYSTEM',
      details: `Email sent to ${to} with subject: ${subject}`,
      severity: 'LOW'
    });
  }

  /**
   * Log password change
   */
  logPasswordChange(userId: string, ipAddress: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'PASSWORD_CHANGE',
      userId,
      ipAddress,
      details: 'User password changed',
      severity: 'MEDIUM'
    });
  }

  /**
   * Log account lockout
   */
  logAccountLockout(userId: string, ipAddress: string): void {
    this.logEvent({
      timestamp: new Date(),
      eventType: 'ACCOUNT_LOCKOUT',
      userId,
      ipAddress,
      details: 'User account locked due to security policy',
      severity: 'HIGH'
    });
  }
}

export const securityLogger = new SecurityLogger();