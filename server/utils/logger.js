const winston = require('winston');
const path = require('path');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    if (stack) {
      log += `\nStack: ${stack}`;
    }
    
    if (Object.keys(meta).length > 0) {
      log += `\nMetadata: ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: {
    service: 'yuvahire-backend',
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),

    // Security logs
    new winston.transports.File({
      filename: path.join(logsDir, 'security.log'),
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 3
    })
  ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Override res.end to capture response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    // Log request details
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length') || 0,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    };

    // Different log levels based on status code
    if (res.statusCode >= 500) {
      logger.error('HTTP Request', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }

    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Database operation logger
const dbLogger = {
  logQuery: (operation, collection, query, duration) => {
    logger.info('Database Operation', {
      operation,
      collection,
      query: JSON.stringify(query),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
  },

  logError: (operation, collection, error) => {
    logger.error('Database Error', {
      operation,
      collection,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};

// Performance monitoring
const performanceLogger = {
  logSlowQuery: (query, duration, threshold = 1000) => {
    if (duration > threshold) {
      logger.warn('Slow Query Detected', {
        query: JSON.stringify(query),
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        timestamp: new Date().toISOString()
      });
    }
  },

  logMemoryUsage: () => {
    const usage = process.memoryUsage();
    logger.info('Memory Usage', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString()
    });
  },

  logCPUUsage: () => {
    const usage = process.cpuUsage();
    logger.info('CPU Usage', {
      user: `${usage.user}μs`,
      system: `${usage.system}μs`,
      timestamp: new Date().toISOString()
    });
  }
};

// Security event logger
const securityLogger = {
  logAuthAttempt: (username, success, ip, userAgent) => {
    const level = success ? 'info' : 'warn';
    logger[level]('Authentication Attempt', {
      username,
      success,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  logSecurityViolation: (violation, details, req) => {
    logger.error('Security Violation', {
      violation,
      details,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      path: req.path,
      method: req.method,
      userId: req.user?.id,
      timestamp: new Date().toISOString()
    });
  },

  logDataAccess: (resource, action, userId, success) => {
    logger.info('Data Access', {
      resource,
      action,
      userId,
      success,
      timestamp: new Date().toISOString()
    });
  }
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Application Error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    userId: req.user?.id,
    body: req.body,
    query: req.query,
    params: req.params,
    timestamp: new Date().toISOString()
  });

  next(err);
};

// Periodic system monitoring
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    performanceLogger.logMemoryUsage();
    performanceLogger.logCPUUsage();
  }, 60000); // Every minute
}

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  dbLogger,
  performanceLogger,
  securityLogger
};