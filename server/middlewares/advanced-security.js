// Advanced security middleware for YuvaHire
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const hpp = require('hpp');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const { logger } = require('./monitoring');

// Rate limiting configurations
const createRateLimiter = (windowMs, max, message, skipSuccessfulRequests = false) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
        timestamp: new Date().toISOString()
      });
    }
  });
};

// Security middleware configuration
const applySecurityMiddleware = (app) => {
  // Basic security headers with CSP
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.cloudinary.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
  }));

  // CORS configuration with environment-specific origins
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [
        'https://yuvahire.com',
        'https://www.yuvahire.com',
        'https://app.yuvahire.com'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:3001'
      ];

  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logger.warn('CORS blocked request', { origin });
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'X-Requested-With',
      'X-API-Key',
      'X-Client-Version'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining'],
    maxAge: 86400 // 24 hours
  }));

  // Compression middleware
  app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));

  // HTTP Parameter Pollution protection
  app.use(hpp({
    whitelist: [
      'filter',
      'sort',
      'page',
      'limit',
      'fields'
    ]
  }));

  // MongoDB query sanitization
  app.use(mongoSanitize({
    replaceWith: '_'
  }));

  // XSS protection
  app.use(xss());

  // Request size limits
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting for different endpoints
  // Authentication endpoints - strict limits
  app.use('/api/auth/', createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 requests per window
    'Too many authentication attempts, please try again later',
    true
  ));

  // General API endpoints
  app.use('/api/', createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // 100 requests per window
    'Too many requests, please try again later'
  ));

  // Job applications - prevent spam
  app.use('/api/applications', createRateLimiter(
    60 * 60 * 1000, // 1 hour
    10, // 10 applications per hour
    'Too many job applications, please try again later'
  ));

  // File uploads - prevent abuse
  app.use('/api/upload', createRateLimiter(
    60 * 60 * 1000, // 1 hour
    20, // 20 uploads per hour
    'Too many file uploads, please try again later'
  ));

  // Admin endpoints - stricter limits
  app.use('/api/admin', createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    50, // 50 requests per window
    'Too many admin requests, please try again later'
  ));

  // Health check - no limits
  app.use('/api/health', (req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
  });
};

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    try {
      const { error } = schema.validate(req.body);
      if (error) {
        logger.warn('Validation error', {
          path: req.path,
          error: error.details[0].message,
          body: req.body
        });
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details[0].message
        });
      }
      next();
    } catch (err) {
      logger.error('Validation middleware error', { error: err.message });
      res.status(500).json({ error: 'Internal validation error' });
    }
  };
};

// SQL injection protection (for MongoDB, this is mainly for query sanitization)
const sanitizeQuery = (req, res, next) => {
  try {
    // Remove any potentially dangerous query parameters
    const dangerousKeys = ['$where', '$regex', '$ne', '$gt', '$lt', '$gte', '$lte'];
    dangerousKeys.forEach(key => {
      if (req.query[key]) {
        delete req.query[key];
        logger.warn('Dangerous query parameter removed', { key, path: req.path });
      }
    });
    next();
  } catch (err) {
    logger.error('Query sanitization error', { error: err.message });
    next();
  }
};

// File upload security
const validateFileUpload = (allowedTypes, maxSize) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      logger.warn('Invalid file type uploaded', {
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        user: req.user?.id
      });
      return res.status(400).json({ 
        error: 'Invalid file type',
        allowedTypes 
      });
    }

    // Check file size
    if (req.file.size > maxSize) {
      logger.warn('File too large uploaded', {
        size: req.file.size,
        maxSize,
        originalname: req.file.originalname,
        user: req.user?.id
      });
      return res.status(400).json({ 
        error: 'File too large',
        maxSize: maxSize / (1024 * 1024) + 'MB'
      });
    }

    // Check for malicious file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr'];
    const fileExtension = req.file.originalname.toLowerCase().substring(
      req.file.originalname.lastIndexOf('.')
    );
    
    if (dangerousExtensions.includes(fileExtension)) {
      logger.warn('Dangerous file extension uploaded', {
        extension: fileExtension,
        originalname: req.file.originalname,
        user: req.user?.id
      });
      return res.status(400).json({ error: 'File type not allowed' });
    }

    next();
  };
};

// JWT token validation with enhanced security
const validateToken = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    // Check token format
    if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/.test(token)) {
      logger.warn('Invalid token format', { ip: req.ip });
      return res.status(401).json({ 
        error: 'Invalid token format',
        code: 'TOKEN_INVALID_FORMAT'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check token expiration
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      logger.info('Token expired', { userId: decoded.id });
      return res.status(401).json({ 
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Check token issuer (if using multiple services)
    if (decoded.iss && decoded.iss !== 'yuvahire') {
      logger.warn('Invalid token issuer', { issuer: decoded.iss });
      return res.status(401).json({ 
        error: 'Invalid token issuer',
        code: 'TOKEN_INVALID_ISSUER'
      });
    }

    // Set user info in request object
    req.user = {
      id: decoded.id,
      userId: decoded.id,
      username: decoded.username,
      role: decoded.role,
      college_name: decoded.college_name,
      tokenIssuedAt: decoded.iat,
      tokenExpiresAt: decoded.exp
    };

    // Log successful authentication
    logger.info('User authenticated', {
      userId: decoded.id,
      username: decoded.username,
      role: decoded.role,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.info('Token expired', { ip: req.ip });
      return res.status(401).json({ 
        error: 'Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token', { ip: req.ip, error: error.message });
      return res.status(401).json({ 
        error: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }

    logger.error('Token validation error', { error: error.message });
    res.status(401).json({ 
      error: 'Token validation failed',
      code: 'TOKEN_VALIDATION_ERROR'
    });
  }
};

// Role-based access control
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const userRole = req.user.role;
    
    if (!roles.includes(userRole)) {
      logger.warn('Insufficient permissions', {
        userId: req.user.id,
        userRole,
        requiredRoles: roles,
        path: req.path
      });
      
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: userRole
      });
    }

    next();
  };
};

// Audit logging middleware
const auditLog = (action) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      logger.info('Audit log', {
        action,
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  applySecurityMiddleware,
  validateInput,
  sanitizeQuery,
  validateFileUpload,
  validateToken,
  requireRole,
  auditLog,
  createRateLimiter
};
