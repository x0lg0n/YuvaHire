import axios from "axios"

// Determine API URL with fallback strategy
const getApiUrl = () => {
  // First try the environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // Then try these ports in order
  const possiblePorts = [5000, 5001, 5002, 5003, 5004, 5005];
  
  // In client-side code, return the first option as default
  // The interceptor will handle connection errors
  return `http://localhost:${possiblePorts[0]}/api`;
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Set up request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Create a detailed error object for debugging
    const errorDetails = {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      path: error.config?.url,
      method: error.config?.method,
      data: error.response?.data,
      requestData: error.config?.data,
      headers: error.config?.headers,
      timestamp: new Date().toISOString(),
      name: error.name,
      code: error.code
    };
    
    // Log full error details to console
    console.error('API Error:', errorDetails);
    
    // Create a more user-friendly error with all necessary context
    const enhancedError = new Error(errorDetails.message || 'Unknown API error');
    enhancedError.status = errorDetails.status;
    enhancedError.data = errorDetails.data;
    enhancedError.details = errorDetails;
    enhancedError.isApiError = true;
      // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        // Unauthorized - clear auth state and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (typeof window !== 'undefined') {
          enhancedError.message = "Your session has expired. Please log in again.";
          // Use timeout to avoid immediate redirect interrupting error handling
          setTimeout(() => {
            window.location.href = "/login";
          }, 100);
        }
      } else if (error.response.status === 403) {
        enhancedError.message = "You don't have permission to perform this action";
      } else if (error.response.status === 404) {
        enhancedError.message = "The requested resource was not found";
      } else {
        enhancedError.message = error.response.data?.message || "An error occurred while processing your request";
      }
    } else if (error.request) {
      // Request made but no response received (network error)
      enhancedError.isNetworkError = true;
      
      // Try to determine if it's a CORS issue or server unavailable
      if (error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        enhancedError.message = "Unable to connect to the server. Please check your internet connection and ensure the server is running.";
      } else if (error.code === 'ECONNABORTED') {
        enhancedError.message = "Request timed out. The server took too long to respond.";
      } else {
        enhancedError.message = "Unable to connect to the server. Please check your internet connection";
      }
      
      // Check server availability silently
      setTimeout(() => {
        fetch('/api/health', { method: 'HEAD' })
          .catch(e => console.log('Health check confirms server unavailable:', e.message));
      }, 500);
    } else {
      // Error in request setup
      enhancedError.message = error.message || "An error occurred while setting up the request";
    }    // Add retry utility to the error object
    enhancedError.retry = async () => {
      // Create a new request with the same config but new timestamp
      const retryConfig = { ...error.config, headers: { ...error.config?.headers } };
      retryConfig.headers['X-Retry-Timestamp'] = new Date().toISOString();
      return api(retryConfig);
    };
    
    // Return our enhanced error instead of the original
    return Promise.reject(enhancedError);
  }
)

// User Profile
export const updateUserProfile = (data) => {
  return api.put("/users/profile", data)
}

// Auth
export const register = (data) => {
  // Transform college_name to match backend expectations
  const transformedData = { ...data }
  if (data.role === 'student') {
    transformedData.college_name = data.college_name
  }
  return api.post("/auth/register", transformedData)
}

export const login = (credentials) => {
  return api.post("/auth/login", credentials)
}

// Jobs
export const getJobs = async () => {
  try {
    // Use a longer timeout for this specific request
    const config = { 
      timeout: 15000,  // 15 seconds
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };
    
    // First try the health endpoint to see if server is responsive
    try {
      await api.head("/health", { timeout: 3000 });
    } catch (healthErr) {
      console.warn('Health check failed, server might be down:', healthErr.message);
      // Continue anyway, as the main endpoint might still work
    }
    
    const response = await api.get("/jobs/my-college", config);
    
    // Check if we're in fallback mode (server using demo data)
    if (response.fallbackMode) {
      console.log('Server is running in fallback mode with demo data');
    }
    
    return response;
  } catch (error) {
    // Add more specific error context
    if (error.code === 'ECONNABORTED') {
      error.message = "Request timed out. The server took too long to respond.";
    }
    
    // If we can't connect at all, create mock response
    if (!error.response && (error.message.includes('connect') || error.message.includes('network'))) {
      console.warn('Network error, returning mock job data:', error.message);
      
      // Return mock fallback data on client side as last resort
      return {
        jobs: [
          {
            _id: 'offline-job-1',
            title: 'Frontend Developer Intern',
            description: 'This is demo job data shown when the server is unreachable. Work on React applications with a skilled team.',
            location: 'Remote',
            type: 'Internship',
            college_name: 'Demo College',
            salary: 10000,
            requirements: 'React, JavaScript, HTML, CSS',
            createdAt: new Date().toISOString(),
            deadline: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString()
          },
          {
            _id: 'offline-job-2',
            title: 'Backend Developer',
            description: 'Build robust APIs using Node.js and Express. This is offline demo data.',
            location: 'Bangalore',
            type: 'Full-time',
            college_name: 'Demo University',
            salary: 25000,
            requirements: 'Node.js, Express, MongoDB',
            createdAt: new Date().toISOString(),
            deadline: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString()
          }
        ],
        total: 2,
        offlineMode: true,
        message: 'Showing offline data because the server is unreachable.'
      };
    }
    
    throw error;
  }
}

export const createJob = (data) => api.post("/jobs", data)
export const getMyPostedJobs = () => api.get("/jobs/my-posted")

// Applications
export const applyToJob = (data) => api.post("/applications", data)

export const getMyApplications = async () => {
  try {
    // Use a longer timeout for this specific request
    const config = { 
      timeout: 15000,  // 15 seconds
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    };
    
    // First try the health endpoint to see if server is responsive
    try {
      await api.head("/health", { timeout: 3000 });
    } catch (healthErr) {
      console.warn('Health check failed, server might be down:', healthErr.message);
      // Continue anyway, as the main endpoint might still work
    }
    
    const response = await api.get("/applications/my-applications", config);
    
    // Check if we're in fallback mode (server using demo data)
    if (response.fallbackMode) {
      console.log('Server is running in fallback mode with demo data');
    }
    
    return response;
  } catch (error) {
    // Add more specific error context
    if (error.code === 'ECONNABORTED') {
      error.message = "Request timed out. The server took too long to respond.";
    }
    
    // If we can't connect at all, create mock response
    if (!error.response && (error.message.includes('connect') || error.message.includes('network'))) {
      console.warn('Network error, returning mock data:', error.message);
        // Return mock fallback data on client side as last resort
      return {
        applications: [
          {
            _id: 'offline-1',
            status: 'pending',
            createdAt: new Date().toISOString(),
            job: {
              _id: 'offline-job-1',
              title: 'Offline Demo Job',
              description: 'This is demo data shown when the server is unreachable.',
              location: 'Remote',
              type: 'Internship',
              college_name: 'Demo College',
              salary: 10000 // Changed to number instead of string
            },
            student: {
              _id: 'offline-student',
              username: 'you',
              email: 'your-email@example.com'
            }
          }
        ],
        total: 1,
        offlineMode: true,
        message: 'Showing offline data because the server is unreachable.'
      };
    }
    
    throw error;
  }
}

export const getJobApplications = (jobId) => api.get(`/applications/job/${jobId}`)
export const updateApplicationStatus = (applicationId, status) => api.put(`/applications/${applicationId}/status`, { status })

// Colleges
export const getAllColleges = () => api.get("/colleges")
export const createCollege = (data) => api.post("/colleges", data)
export const updateCollege = (id, data) => api.put(`/colleges/${id}`, data)
export const deleteCollege = (id) => api.delete(`/colleges/${id}`)

export default api
