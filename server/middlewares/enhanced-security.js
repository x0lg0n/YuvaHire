const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

// Enhanced security middleware configuration
const securityConfig = {
  // Rate limiting configuration
  rateLimiting: {
    // General API rate limiting
    api: rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
      }
    }),

    // Stricter rate limiting for auth endpoints
    auth: rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // limit each IP to 5 login attempts per windowMs
      message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 900
      },
      skipSuccessfulRequests: true,
      standardHeaders: true,
      legacyHeaders: false
    }),

    // Rate limiting for job applications
    applications: rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // limit each IP to 10 applications per hour
      message: {
        error: 'Too many job applications, please try again later.',
        retryAfter: 3600
      }
    })
  },

  // Helmet security headers configuration
  helmet: helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", process.env.CLIENT_URL],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),

  // MongoDB injection protection
  mongoSanitize: mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
      console.warn(`Potential NoSQL injection attempt blocked: ${key} from IP: ${req.ip}`);
    }
  }),

  // XSS protection
  xss: xss(),

  // HTTP Parameter Pollution protection
  hpp: hpp({
    whitelist: ['sort', 'fields', 'page', 'limit', 'status', 'type']
  }),

  // CORS configuration
  cors: {
    origin: function(origin, callback) {
      const allowedOrigins = [
        process.env.CLIENT_URL,
        'http://localhost:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3000'
      ].filter(Boolean);

      // Allow requests with no origin (mobile apps, curl, etc)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked for origin: ${origin} from IP: ${req?.ip}`);
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-API-Key',
      'X-Client-Version'
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count']
  },

  // Request validation middleware
  validation: {
    // Validate request size
    requestSize: (req, res, next) => {
      const contentLength = req.get('content-length');
      const maxSize = parseInt(process.env.MAX_REQUEST_SIZE) || 10 * 1024 * 1024; // 10MB

      if (contentLength && parseInt(contentLength) > maxSize) {
        return res.status(413).json({
          error: 'Request too large',
          message: `Request size cannot exceed ${maxSize} bytes`
        });
      }
      next();
    },

    // Validate request origin
    validateOrigin: (req, res, next) => {
      const origin = req.get('origin');
      const referer = req.get('referer');
      const userAgent = req.get('user-agent');

      // Log suspicious requests
      if (!userAgent || userAgent.includes('bot')) {
        console.warn(`Suspicious request from IP: ${req.ip}, User-Agent: ${userAgent}`);
      }

      next();
    }
  },

  // API key validation for external integrations
  apiKey: (req, res, next) => {
    const apiKey = req.get('X-API-Key');
    const validApiKeys = (process.env.VALID_API_KEYS || '').split(',');

    if (req.path.startsWith('/api/external/') && !validApiKeys.includes(apiKey)) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'Valid API key required for external API access'
      });
    }

    next();
  }
};

// Security audit logging
const securityLogger = {
  logSecurityEvent: (event, req, details = {}) => {
    const securityLog = {
      timestamp: new Date().toISOString(),
      event,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      ...details
    };

    console.warn('SECURITY EVENT:', JSON.stringify(securityLog));

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
      // Sentry.captureMessage(`Security Event: ${event}`, 'warning', { extra: securityLog });
    }
  }
};

module.exports = {
  securityConfig,
  securityLogger
};