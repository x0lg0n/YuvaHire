// Advanced error handling and logging system for YuvaHire
const winston = require('winston');
const { createLogger, format, transports } = winston;
const Sentry = require('@sentry/node');

// Initialize Sentry for error tracking
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app: true })
    ]
  });
}

// Custom log format
const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json(),
  format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Create logger instance with multiple transports
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport for development
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    }),
    // File transport for errors
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // File transport for all logs
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    // Separate file for audit logs
    new transports.File({
      filename: 'logs/audit.log',
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true,
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    })
  ],
  exceptionHandlers: [
    new transports.File({ filename: 'logs/exceptions.log' })
  ],
  rejectionHandlers: [
    new transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Custom error classes
class YuvaHireError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'YuvaHireError';
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

class ValidationError extends YuvaHireError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.details = details;
  }
}

class AuthenticationError extends YuvaHireError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends YuvaHireError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends YuvaHireError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

class ConflictError extends YuvaHireError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

class RateLimitError extends YuvaHireError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Send error to Sentry if configured
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      extra: {
        method: req.method,
        url: req.url,
        userId: req.user?.id,
        userAgent: req.get('User-Agent')
      }
    });
  }

  // Determine error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || null;

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
    details = null;
  }

  // Create error response
  const errorResponse = {
    error: {
      message,
      code,
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }
  };

  // Add details if available
  if (details) {
    errorResponse.error.details = details;
  }

  // Add request ID for tracking
  if (req.id) {
    errorResponse.error.requestId = req.id;
  }

  res.status(statusCode).json(errorResponse);
};

// Request ID middleware for tracking
const requestIdMiddleware = (req, res, next) => {
  req.id = req.headers['x-request-id'] || generateRequestId();
  res.set('X-Request-ID', req.id);
  next();
};

// Generate unique request ID
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation error handler
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(error => error.message);
  return new ValidationError('Validation failed', errors);
};

// MongoDB duplicate key error handler
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new ConflictError(`${field} '${value}' already exists`);
};

// MongoDB cast error handler
const handleCastError = (err) => {
  return new ValidationError(`Invalid ${err.path}: ${err.value}`);
};

// JWT error handler
const handleJWTError = (err) => {
  if (err.name === 'TokenExpiredError') {
    return new AuthenticationError('Token has expired');
  }
  if (err.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  return new AuthenticationError('Token validation failed');
};

// Rate limit error handler
const handleRateLimitError = (err) => {
  return new RateLimitError(err.message);
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userId: req.user?.id
    });

    // Log slow requests
    if (duration > 2000) {
      logger.warn('Slow request detected', {
        requestId: req.id,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        userId: req.user?.id
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Database query monitoring
const dbQueryLogger = (query) => {
  const startTime = Date.now();
  
  return {
    end: () => {
      const duration = Date.now() - startTime;
      
      if (duration > 1000) { // Log slow queries (>1s)
        logger.warn('Slow query detected', {
          operation: query.op,
          collection: query.collection,
          duration: `${duration}ms`,
          query: query.getQuery()
        });
      }
      
      // Log all queries in debug mode
      logger.debug('Database query', {
        operation: query.op,
        collection: query.collection,
        duration: `${duration}ms`,
        query: query.getQuery()
      });
    }
  };
};

// Audit logging
const auditLogger = (action, userId, details = {}) => {
  logger.info('Audit log', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    details,
    ip: details.ip,
    userAgent: details.userAgent
  });
};

// Security event logging
const securityLogger = (event, details = {}) => {
  logger.warn('Security event', {
    event,
    timestamp: new Date().toISOString(),
    details,
    ip: details.ip,
    userAgent: details.userAgent,
    userId: details.userId
  });
};

// Health check logging
const healthCheckLogger = (status, details = {}) => {
  logger.info('Health check', {
    status,
    timestamp: new Date().toISOString(),
    details
  });
};

// Memory usage monitoring
const memoryUsageLogger = () => {
  const used = process.memoryUsage();
  
  logger.info('Memory usage', {
    rss: `${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024 * 100) / 100} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024 * 100) / 100} MB`,
    external: `${Math.round(used.external / 1024 / 1024 * 100) / 100} MB`
  });
  
  // Alert if memory usage is high
  const heapUsedMB = used.heapUsed / 1024 / 1024;
  if (heapUsedMB > 500) { // 500MB threshold
    logger.warn('High memory usage detected', { heapUsedMB });
  }
};

// Graceful shutdown logging
const gracefulShutdown = (signal) => {
  logger.info('Graceful shutdown initiated', { signal });
  
  // Close database connections
  const mongoose = require('mongoose');
  mongoose.connection.close(() => {
    logger.info('Database connection closed');
  });
  
  // Close Redis connections
  const { redis } = require('./performance');
  redis.quit(() => {
    logger.info('Redis connection closed');
  });
  
  // Close Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.close(2000).then(() => {
      logger.info('Sentry closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    error: err.message,
    stack: err.stack
  });
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }
  
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack
  });
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(reason);
  }
});

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = {
  logger,
  errorHandler,
  requestIdMiddleware,
  asyncHandler,
  performanceMonitor,
  dbQueryLogger,
  auditLogger,
  securityLogger,
  healthCheckLogger,
  memoryUsageLogger,
  YuvaHireError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  handleValidationError,
  handleDuplicateKeyError,
  handleCastError,
  handleJWTError,
  handleRateLimitError
};
