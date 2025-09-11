const rateLimit = require('express-rate-limit');
const validator = require('validator');

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize all string inputs
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'string') {
          // Escape HTML and remove potentially dangerous characters
          obj[key] = validator.escape(obj[key]);
          // Remove null bytes
          obj[key] = obj[key].replace(/\0/g, '');
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);
  
  next();
};

// Enhanced rate limiting configurations
const createRateLimit = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        retryAfter: Math.round(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
const rateLimits = {
  general: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests
    'Too many requests from this IP, please try again later.'
  ),
  auth: createRateLimit(
    15 * 60 * 1000, // 15 minutes
    50, // 50 requests (increased for testing)
    'Too many authentication attempts, please try again later.'
  ),
  api: createRateLimit(
    1 * 60 * 1000, // 1 minute
    20, // 20 requests
    'API rate limit exceeded, please slow down.'
  ),
  upload: createRateLimit(
    60 * 60 * 1000, // 1 hour
    10, // 10 uploads
    'Upload limit exceeded, please try again later.'
  )
};

// Security headers configuration
const securityHeaders = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false // Disable for development
};

module.exports = {
  sanitizeInput,
  rateLimits,
  securityHeaders
};