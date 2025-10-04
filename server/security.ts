import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import * as cors from 'cors';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { storage } from './storage';
import { securityLogger } from './security-logger';

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        username: string;
      } | undefined;
    }
  }
}

// Rate limiting middleware
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs (increased for both development and production)
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  handler: (req, res) => {
    securityLogger.logRateLimitExceeded(req.ip || 'unknown', req.path);
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.'
    });
  }
});

// Strict rate limiting for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? Infinity : 5, // Disable rate limiting in development, 5 in production
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  handler: (req, res) => {
    securityLogger.logRateLimitExceeded(req.ip || 'unknown', req.path);
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.'
    });
  }
});

// Security headers middleware with enhanced protection
export const securityHeaders = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://www.gstatic.com", "https://translate.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "https://odysee.com", "https://player.twitch.tv", "https://www.youtube.com", "https://i.ytimg.com", "https://player.vimeo.com", "https://www.google-analytics.com", "https://www.googletagmanager.com", "http://127.0.0.1:5000", "https://www.gstatic.com", "http://localhost:5173", "https://www.paypal.com", "https://www.paypalobjects.com", "https://hilltopads.net", "https://*.hilltopads.net", "https://vjs.zencdn.net", "https://cdn.jsdelivr.net"],
      scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "blob:", "https://odysee.com", "https://player.twitch.tv", "https://www.youtube.com", "https://i.ytimg.com", "https://player.vimeo.com", "https://www.google-analytics.com", "https://www.googletagmanager.com", "http://127.0.0.1:5000", "https://www.gstatic.com", "http://localhost:5173", "https://www.paypal.com", "https://www.paypalobjects.com", "https://hilltopads.net", "https://*.hilltopads.net", "https://vjs.zencdn.net", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "https://image.tmdb.org", "https://odysee.com", "https://i.ytimg.com", "https://i.vimeocdn.com", "https://www.gstatic.com", "https://translate.googleapis.com", "https://i.pinimg.com", "https://www.paypal.com", "https://www.paypalobjects.com", "https://www.google-analytics.com", "https://www.googletagmanager.com", "https://hilltopads.net", "https://*.hilltopads.net"],
      frameSrc: ["'self'", "https://odysee.com", "https://player.twitch.tv", "https://www.youtube.com", "https://www.youtube-nocookie.com", "https://player.vimeo.com", "https://zupload.co", "https://zupload.cc", "https://zupload.io", "https://*.zupload.co", "https://*.zupload.cc", "https://*.zupload.io", "https://www.paypal.com", "https://hilltopads.net", "https://*.hilltopads.net", "https://selfishzone.com", "https://*.selfishzone.com"],
      connectSrc: ["'self'", "https://api.themoviedb.org", "https://image.tmdb.org", "http://127.0.0.1:5000", "http://localhost:5173", "https://odysee.com", "https://player.twitch.tv", "https://www.youtube.com", "ws://127.0.0.1:5000", "https://player.vimeo.com", "https://translate.googleapis.com", "https://www.google-analytics.com", "https://www.googletagmanager.com", "https://fonts.googleapis.com", "https://i.pinimg.com", "https://fonts.gstatic.com", "https://overbridgenet.com", "https://www.paypal.com", "https://api.paypal.com", "https://www.sandbox.paypal.com", "https://selfishzone.com", "https://*.selfishzone.com"],
      mediaSrc: ["'self'", "https:", "https://odysee.com", "https://player.twitch.tv", "https://www.youtube.com", "https://player.vimeo.com", "https://selfishzone.com", "https://*.selfishzone.com"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  referrerPolicy: {
    policy: "strict-origin-when-cross-origin"
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
export const corsOptions = {
  origin: process.env.CLIENT_URL || ['http://localhost:5173', 'https://odysee.com', 'https://www.youtube.com', 'https://player.twitch.tv', 'https://player.vimeo.com', 'https://translate.googleapis.com'],
  credentials: true,
  optionsSuccessStatus: 200
};

// CSRF Protection middleware
const csrfTokens: Record<string, { token: string; expires: number; userAgent: string; ipAddress: string }> = {};

export const generateCSRFToken = (userId: string, userAgent: string, ipAddress: string): string => {
  const token = randomBytes(32).toString('hex');
  const expires = Date.now() + 3600000; // 1 hour
  csrfTokens[userId] = { token, expires, userAgent, ipAddress };
  return token;
};

export const validateCSRFToken = (userId: string, token: string, userAgent: string, ipAddress: string): boolean => {
  const record = csrfTokens[userId];
  if (!record) return false;
  
  // Check if token is expired
  if (Date.now() > record.expires) {
    delete csrfTokens[userId];
    return false;
  }
  
  // Check if user agent matches
  if (record.userAgent !== userAgent) {
    delete csrfTokens[userId];
    return false;
  }
  
  // Check if IP address matches (loosely - same subnet)
  if (record.ipAddress !== ipAddress) {
    // For IPv4, check if first 3 octets match
    const recordIpParts = record.ipAddress.split('.');
    const currentIpParts = ipAddress.split('.');
    if (recordIpParts.length === 4 && currentIpParts.length === 4) {
      if (recordIpParts[0] !== currentIpParts[0] || 
          recordIpParts[1] !== currentIpParts[1] || 
          recordIpParts[2] !== currentIpParts[2]) {
        delete csrfTokens[userId];
        return false;
      }
    } else {
      // For other IP formats, delete the token
      delete csrfTokens[userId];
      return false;
    }
  }
  
  // Check if token matches
  const isValid = record.token === token;
  
  // Ne pas supprimer le token après utilisation pour permettre plusieurs requêtes
  // Le token expirera naturellement après 1 heure
  
  return isValid;
};

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests and authentication routes
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS' ||
      req.path === '/api/auth/login' || req.path === '/api/auth/register' ||
      req.path.startsWith('/api/favorites/') || req.path === '/api/favorites' ||
      req.path.startsWith('/api/watch-history/') || req.path === '/api/watch-history' ||
      req.path.startsWith('/api/watch-progress/') || req.path === '/api/watch-progress') {
    return next();
  }
  
  // For state-changing requests, validate CSRF token
  const csrfToken = req.headers['x-csrf-token'] as string || req.body._csrf;
  
  // Get user agent and IP address
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  
  if (req.user && (!csrfToken || !validateCSRFToken(req.user.userId, csrfToken, userAgent, ipAddress))) {
    securityLogger.logCSRFViolation(req.user.userId, ipAddress);
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  
  next();
};

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Check for potentially malicious input
  const maliciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers
    /data:/gi, // Data URLs
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // Iframe tags
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, // Object tags
    /<embed\b[^<]*>/gi, // Embed tags
    /vbscript:/gi, // VBScript protocol
  ];

  const checkObject = (obj: any) => {
    if (typeof obj === 'string') {
      // Check for encoded scripts
      const decoded = decodeURIComponent(obj);
      for (const pattern of maliciousPatterns) {
        if (pattern.test(decoded)) {
          securityLogger.logXSSAttempt(req.ip || 'unknown', decoded);
          return false;
        }
      }
      
      // Additional checks for encoded characters
      if (/<\s*script/i.test(decoded) || /&#x3[cC]/i.test(decoded) || /&#60/i.test(decoded)) {
        securityLogger.logXSSAttempt(req.ip || 'unknown', decoded);
        return false;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (!checkObject(obj[key])) {
          return false;
        }
      }
    }
    return true;
  };

  if (!checkObject(req.body) || !checkObject(req.query) || !checkObject(req.params)) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  next();
};

// XSS protection middleware with enhanced sanitization
export const xssProtection = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (input: any): any => {
    if (typeof input === 'string') {
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/&/g, '&amp;'); // This should be last to avoid double escaping
    } else if (typeof input === 'object' && input !== null) {
      // Handle arrays
      if (Array.isArray(input)) {
        return input.map(item => sanitize(item));
      }
      
      // Handle objects
      const sanitized: any = {};
      for (const key in input) {
        if (input.hasOwnProperty(key)) {
          sanitized[key] = sanitize(input[key]);
        }
      }
      return sanitized;
    }
    return input;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

// Session management middleware
export const sessionManagement = async (req: Request, res: Response, next: NextFunction) => {
  // Check if user has too many active sessions
  if (req.user) {
    try {
      const activeSessions = await storage.getActiveSessions();
      const userSessions = activeSessions.filter(session => session.userId === req.user!.userId);
      
      // Limit to 5 active sessions per user
      if (userSessions.length > 5) {
        // End the oldest session
        const oldestSession = userSessions.reduce((oldest, current) => 
          new Date(oldest.sessionStart) < new Date(current.sessionStart) ? oldest : current
        );
        await storage.endUserSession(oldestSession.id);
      }
    } catch (error) {
      console.error('Session management error:', error);
    }
  }
  
  next();
};

// Brute force protection middleware - DÉSACTIVÉ
// const loginAttempts: Record<string, { count: number; lastAttempt: number }> = {};

export const bruteForceProtection = (req: Request, res: Response, next: NextFunction) => {
  // Protection désactivée
  next();
  
  /*const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (!ip) {
    return res.status(400).json({ error: 'Unable to determine IP address' });
  }
  
  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { count: 0, lastAttempt: now };
  }
  
  // Reset count if outside the window
  if (now - loginAttempts[ip].lastAttempt > windowMs) {
    loginAttempts[ip].count = 0;
  }
  
  // Check if too many attempts
  if (loginAttempts[ip].count >= 5) {
    const timeLeft = windowMs - (now - loginAttempts[ip].lastAttempt);
    if (timeLeft > 0) {
      securityLogger.logBruteForceAttempt(ip, loginAttempts[ip].count);
      return res.status(429).json({
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil(timeLeft / 1000)
      });
    } else {
      // Reset if time has passed
      loginAttempts[ip].count = 0;
    }
  }
  
  // Increment attempt count
  loginAttempts[ip].count++;
  loginAttempts[ip].lastAttempt = now;
  
  next();*/
};

// Reset login attempts on successful login - DÉSACTIVÉ
export const resetLoginAttempts = (req: Request, res: Response, next: NextFunction) => {
  // Protection désactivée
  next();
  
  /*const ip = req.ip || req.connection.remoteAddress;
  if (ip && loginAttempts[ip]) {
    delete loginAttempts[ip];
  }
  next();*/
};

// Enhanced authentication middleware with HttpOnly cookie support
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // Check for token in Authorization header
  const authHeader = req.headers['authorization'];
  const tokenFromHeader = authHeader && authHeader.split(' ')[1];
  
  // Check for token in cookies
  const tokenFromCookie = req.cookies?.auth_token;
  
  const token = tokenFromHeader || tokenFromCookie;

  if (!token) {
    // For now, we'll allow requests without tokens but set user to undefined
    req.user = undefined;
    return next();
  }

  const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here-change-in-production";
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      // If token is invalid, clear the cookie and set user to undefined
      res.clearCookie('auth_token');
      req.user = undefined;
    } else {
      req.user = user;
    }
    next();
  });
};