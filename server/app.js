require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

// Import database connection with fallback support
const { connectDB, isFallbackMode } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const collegeRoutes = require('./routes/colleges');
const userRoutes = require('./routes/users');

// Initialize the database connection
connectDB()
  .then(connected => {
    console.log(connected 
      ? 'Database connected successfully' 
      : 'Running in fallback mode - some features will be limited');
  })
  .catch(err => {
    console.error('Database initialization error:', err);
    console.log('Starting server in fallback mode');
  });

const app = express();

// Security middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc)
    if(!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      process.env.CLIENT_URL, // From environment variable if set
    ].filter(Boolean); // Remove any undefined/null values
    
    // Check if the origin is allowed
    if(allowedOrigins.indexOf(origin) === -1){
      console.log('CORS blocked for origin:', origin);
      return callback(null, false);
    }
    
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/api/users', userRoutes);

// Simple HEAD endpoint for connection testing
app.head('/api/health', (req, res) => {
  res.status(200).end();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  // Check MongoDB connection
  const dbStatus = mongoose.connection.readyState;
  const dbStatusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  // Determine overall health status
  const isHealthy = dbStatus === 1;
  
  // Add more details in development mode
  const details = process.env.NODE_ENV !== 'production' ? {
    mongodb: {
      status: dbStatusMap[dbStatus],
      host: mongoose.connection.host,
      name: mongoose.connection.name
    },
    memory: {
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    },
    uptime: `${Math.floor(process.uptime())} seconds`
  } : undefined;
  
  res.status(isHealthy ? 200 : 503).json({ 
    status: isHealthy ? 'healthy' : 'unhealthy',
    message: isHealthy ? 'YuvaHire Backend is running!' : 'Backend is running but some services are unavailable',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    details
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log detailed error information
  console.error('Server error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params
  });
  
  // Don't expose stack trace in production
  const isProduction = process.env.NODE_ENV === 'production';
  
  res.status(err.status || 500).json({ 
    error: {
      message: err.message || 'Internal server error',
      status: err.status || 500,
      ...(isProduction ? {} : { stack: err.stack }),
      path: req.path,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = app;

