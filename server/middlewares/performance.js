// Performance optimization and caching middleware for YuvaHire
const Redis = require('ioredis');
const { logger } = require('./monitoring');

// Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD,
  db: process.env.REDIS_DB || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnClusterDown: 300,
  enableReadyCheck: true,
  maxLoadingTimeout: 10000,
  autoResubscribe: true,
  autoResendUnfulfilledCommands: true,
});

// Cache configuration
const CACHE_TTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400 // 24 hours
};

// Cache middleware
const cacheMiddleware = (ttl = CACHE_TTL.MEDIUM, keyGenerator = null) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) : `cache:${req.originalUrl}`;
      
      // Try to get from cache
      const cachedData = await redis.get(cacheKey);
      
      if (cachedData) {
        logger.debug('Cache hit', { key: cacheKey, path: req.path });
        return res.json(JSON.parse(cachedData));
      }

      // Cache miss - store original send method
      const originalSend = res.send;
      
      // Override send method to cache response
      res.send = function(data) {
        if (res.statusCode === 200 && data) {
          redis.setex(cacheKey, ttl, data)
            .then(() => {
              logger.debug('Cached response', { key: cacheKey, ttl });
            })
            .catch(err => {
              logger.error('Cache storage error', { error: err.message });
            });
        }
        
        originalSend.call(this, data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
      next();
    }
  };
};

// Database query optimization
const optimizeQueries = (req, res, next) => {
  // Add query optimization headers
  res.set('X-Query-Optimization', 'enabled');
  
  // Parse and optimize query parameters
  if (req.query) {
    // Limit pagination
    if (req.query.limit) {
      const limit = parseInt(req.query.limit);
      req.query.limit = Math.min(limit, 100); // Max 100 items per page
    }
    
    // Add default pagination
    if (!req.query.page) {
      req.query.page = 1;
    }
    
    // Optimize sort parameters
    if (req.query.sort) {
      const allowedSortFields = ['createdAt', 'updatedAt', 'title', 'salary', 'deadline'];
      const sortField = req.query.sort.split(':')[0];
      if (!allowedSortFields.includes(sortField)) {
        req.query.sort = 'createdAt:desc';
      }
    }
  }
  
  next();
};

// Response compression and optimization
const optimizeResponse = (req, res, next) => {
  // Add performance headers
  res.set('X-Response-Time', Date.now());
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  
  // Optimize JSON responses
  const originalJson = res.json;
  res.json = function(data) {
    // Remove sensitive fields from response
    if (data && typeof data === 'object') {
      const sanitizedData = sanitizeResponse(data);
      return originalJson.call(this, sanitizedData);
    }
    return originalJson.call(this, data);
  };
  
  next();
};

// Sanitize response data
const sanitizeResponse = (data) => {
  if (Array.isArray(data)) {
    return data.map(item => sanitizeResponse(item));
  }
  
  if (data && typeof data === 'object') {
    const sanitized = { ...data };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        delete sanitized[field];
      }
    });
    
    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeResponse(sanitized[key]);
      }
    });
    
    return sanitized;
  }
  
  return data;
};

// Database connection pooling optimization
const optimizeDatabaseConnection = () => {
  const mongoose = require('mongoose');
  
  // Configure connection pooling
  mongoose.connection.on('connected', () => {
    logger.info('Database connected with optimized settings');
  });
  
  mongoose.connection.on('error', (err) => {
    logger.error('Database connection error', { error: err.message });
  });
  
  mongoose.connection.on('disconnected', () => {
    logger.warn('Database disconnected');
  });
  
  // Set connection options
  const connectionOptions = {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false,
    autoIndex: false, // Disable auto-indexing in production
    autoCreate: false // Disable auto-collection creation
  };
  
  return connectionOptions;
};

// Memory usage monitoring
const monitorMemoryUsage = () => {
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

// Query performance monitoring
const monitorQueryPerformance = (query) => {
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
        duration: `${duration}ms`
      });
    }
  };
};

// Cache invalidation utilities
const cacheUtils = {
  // Invalidate cache by pattern
  invalidatePattern: async (pattern) => {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info('Cache invalidated', { pattern, count: keys.length });
      }
    } catch (error) {
      logger.error('Cache invalidation error', { error: error.message });
    }
  },
  
  // Invalidate user-specific cache
  invalidateUserCache: async (userId) => {
    await cacheUtils.invalidatePattern(`user:${userId}:*`);
    await cacheUtils.invalidatePattern(`cache:*/user/${userId}*`);
  },
  
  // Invalidate job-related cache
  invalidateJobCache: async (jobId = null) => {
    if (jobId) {
      await cacheUtils.invalidatePattern(`job:${jobId}:*`);
      await cacheUtils.invalidatePattern(`cache:*/jobs/${jobId}*`);
    } else {
      await cacheUtils.invalidatePattern('cache:*/jobs*');
    }
  },
  
  // Clear all cache
  clearAll: async () => {
    try {
      await redis.flushdb();
      logger.info('All cache cleared');
    } catch (error) {
      logger.error('Cache clear error', { error: error.message });
    }
  }
};

// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  // Monitor response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow requests
    if (duration > 2000) { // 2 seconds
      logger.warn('Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent')
      });
    }
    
    // Log all requests in debug mode
    logger.debug('Request completed', {
      method: req.method,
      path: req.path,
      duration: `${duration}ms`,
      statusCode: res.statusCode
    });
  });
  
  next();
};

// Health check with performance metrics
const healthCheck = async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: 'connected',
      cache: 'connected'
    };
    
    // Check database connection
    try {
      const mongoose = require('mongoose');
      health.database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    } catch (error) {
      health.database = 'error';
    }
    
    // Check cache connection
    try {
      await redis.ping();
      health.cache = 'connected';
    } catch (error) {
      health.cache = 'disconnected';
    }
    
    res.json(health);
  } catch (error) {
    logger.error('Health check error', { error: error.message });
    res.status(500).json({ status: 'error', message: error.message });
  }
};

module.exports = {
  redis,
  cacheMiddleware,
  optimizeQueries,
  optimizeResponse,
  optimizeDatabaseConnection,
  monitorMemoryUsage,
  monitorQueryPerformance,
  cacheUtils,
  performanceMonitor,
  healthCheck,
  CACHE_TTL
};
