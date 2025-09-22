const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Create a local fallback data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Maximum number of connection attempts
const MAX_RETRIES = 3;
let retryCount = 0;

// Connection options
const connectionOptions = {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4
};

// Sample data for fallback mode
const sampleData = {
  jobs: [
    { 
      id: 'sample-job-1',
      title: 'Software Developer Internship',
      description: 'Sample job for testing when database is offline',
      location: 'Remote',
      type: 'Internship',
      college_name: 'Sample College',
      salary: '10000-15000'
    },
    {
      id: 'sample-job-2',
      title: 'Data Analyst',
      description: 'Sample data analyst position',
      location: 'Mumbai',
      type: 'Full-time',
      college_name: 'Demo University',
      salary: '30000-40000'
    }
  ],
  applications: [
    {
      id: 'sample-app-1',
      job: {
        id: 'sample-job-1',
        title: 'Software Developer Internship',
        description: 'Sample job for testing when database is offline',
        location: 'Remote',
        type: 'Internship',
        college_name: 'Sample College',
        salary: '10000-15000'
      },
      student: {
        id: 'sample-student',
        username: 'student',
        email: 'student@example.com'
      },
      status: 'pending',
      createdAt: new Date().toISOString()
    }
  ]
};

// Flag to indicate if we're in fallback mode (no database)
let fallbackMode = false;

// Connect to MongoDB with retry logic
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/yuvahire';
  
  try {
    console.log(`Attempting to connect to MongoDB (Attempt ${retryCount + 1}/${MAX_RETRIES})...`);
    await mongoose.connect(uri, connectionOptions);
    console.log('MongoDB Connected Successfully');
    fallbackMode = false;
    retryCount = 0;
    return true;
  } catch (error) {
    console.error(`MongoDB connection error (Attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);
    
    // If we've reached max retries, switch to fallback mode
    if (++retryCount >= MAX_RETRIES) {
      console.warn('Maximum retries reached. Switching to local fallback data mode');
      fallbackMode = true;
      return false;
    }
    
    // Wait for a few seconds before retrying
    const retryDelay = retryCount * 2000; // Exponential backoff
    console.log(`Retrying in ${retryDelay/1000} seconds...`);
    await new Promise(resolve => setTimeout(resolve, retryDelay));
    return connectDB(); // Recursive retry
  }
};

// Connection event handlers
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
  if (!fallbackMode) {
    console.log('Attempting to reconnect...');
    connectDB();
  }
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  if (!fallbackMode) {
    console.log('Attempting to reconnect...');
    connectDB();
  }
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected');
  fallbackMode = false;
});

// Function to get sample data when in fallback mode
const getSampleData = (collection) => {
  if (!fallbackMode) {
    return null;
  }
  
  if (!sampleData[collection]) {
    console.warn(`No sample data available for collection: ${collection}`);
    return [];
  }
  
  console.log(`Using sample data for ${collection} (fallback mode)`);
  return [...sampleData[collection]];
};

// Check if we're in fallback mode
const isFallbackMode = () => fallbackMode;

module.exports = {
  connectDB,
  getSampleData,
  isFallbackMode
};
