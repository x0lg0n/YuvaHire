const winston = require('winston');
const { createLogger, format, transports } = winston;

// Custom format for structured logging
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

// Create logger instance
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
    // File transport for production
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  // Log request start
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length')
    });

    // Emit metrics for monitoring
    if (global.metrics) {
      global.metrics.httpRequestDuration.observe(
        { method: req.method, status_code: res.statusCode },
        duration / 1000
      );
      global.metrics.httpRequestsTotal.inc({ method: req.method, status_code: res.statusCode });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Emit error metrics
  if (global.metrics) {
    global.metrics.httpErrorsTotal.inc({ method: req.method, status_code: res.statusCode });
  }

  next(err);
};

// Database query monitoring
const dbQueryLogger = (query) => {
  logger.debug('Database query', {
    operation: query.op,
    collection: query.collection,
    duration: query.executionTime,
    query: query.getQuery()
  });

  // Emit database metrics
  if (global.metrics) {
    global.metrics.dbQueryDuration.observe(
      { operation: query.op, collection: query.collection },
      query.executionTime / 1000
    );
  }
};

module.exports = {
  logger,
  performanceMonitor,
  errorLogger,
  dbQueryLogger
};
