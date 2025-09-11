const { body, param, query, validationResult } = require('express-validator');
const validator = require('validator');

// Enhanced validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Custom validators
const customValidators = {
  // Validate MongoDB ObjectId
  isValidObjectId: (value) => {
    return validator.isMongoId(value);
  },
  
  // Validate coordinates
  isValidCoordinate: (lat, lng) => {
    return validator.isFloat(lat.toString(), { min: -90, max: 90 }) &&
           validator.isFloat(lng.toString(), { min: -180, max: 180 });
  },
  
  // Validate file types
  isValidImageType: (mimetype) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return allowedTypes.includes(mimetype);
  },
  
  // Validate file size (in bytes)
  isValidFileSize: (size, maxSize = 5 * 1024 * 1024) => { // 5MB default
    return size <= maxSize;
  },
  
  // Sanitize and validate text input
  sanitizeText: (text, maxLength = 1000) => {
    if (!text || typeof text !== 'string') return '';
    
    // Remove HTML tags and escape special characters
    let sanitized = validator.escape(text.trim());
    
    // Remove null bytes and control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
    
    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    
    return sanitized;
  },
  
  // Validate email with additional checks
  isValidEmail: (email) => {
    if (!validator.isEmail(email)) return false;
    
    // Additional checks for common issues
    const domain = email.split('@')[1];
    if (!domain || domain.length < 3) return false;
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\.\./, // consecutive dots
      /^\.|\.$/, // starts or ends with dot
      /@\.|@$/, // @ followed by dot or at end
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(email));
  },
  
  // Validate password strength
  isStrongPassword: (password) => {
    return validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1
    });
  }
};

// Common validation chains
const commonValidations = {
  // ID parameter validation
  validateId: [
    param('id')
      .custom(customValidators.isValidObjectId)
      .withMessage('Invalid ID format')
  ],
  
  // Pagination validation
  validatePagination: [
    query('page')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Page must be between 1 and 1000'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  
  // Search validation
  validateSearch: [
    query('search')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Search term must be between 1 and 100 characters')
      .customSanitizer(value => customValidators.sanitizeText(value, 100))
  ],
  
  // Coordinate validation
  validateCoordinates: [
    body('coordinates.lat')
      .isFloat({ min: -90, max: 90 })
      .withMessage('Latitude must be between -90 and 90'),
    body('coordinates.lng')
      .isFloat({ min: -180, max: 180 })
      .withMessage('Longitude must be between -180 and 180')
  ],
  
  // File upload validation
  validateFileUpload: (req, res, next) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    const errors = [];
    
    req.files.forEach((file, index) => {
      // Check file type
      if (!customValidators.isValidImageType(file.mimetype)) {
        errors.push(`File ${index + 1}: Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.`);
      }
      
      // Check file size
      if (!customValidators.isValidFileSize(file.size)) {
        errors.push(`File ${index + 1}: File too large. Maximum size is 5MB.`);
      }
      
      // Check filename
      if (!file.originalname || file.originalname.length > 255) {
        errors.push(`File ${index + 1}: Invalid filename.`);
      }
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'File validation failed',
        errors
      });
    }
    
    next();
  }
};

module.exports = {
  handleValidationErrors,
  customValidators,
  commonValidations
};