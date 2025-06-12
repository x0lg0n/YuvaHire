import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
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
    // Log detailed error information
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      path: error.config?.url,
      method: error.config?.method,
      data: error.response?.data
    });
    
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      if (error.response.status === 401) {
        // Unauthorized - clear auth state and redirect
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (typeof window !== 'undefined') {
          window.location.href = "/login";
        }
      } else if (error.response.status === 403) {
        error.message = "You don't have permission to perform this action";
      } else if (error.response.status === 404) {
        error.message = "The requested resource was not found";
      } else {
        error.message = error.response.data?.message || "An error occurred while processing your request";
      }
    } else if (error.request) {
      // Request made but no response received (network error)
      error.message = "Unable to connect to the server. Please check your internet connection";
    } else {
      // Error in request setup
      error.message = "An error occurred while setting up the request";
    }
    
    return Promise.reject(error);
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
export const getJobs = () => api.get("/jobs/my-college") // Get jobs for student's college
export const createJob = (data) => api.post("/jobs", data)
export const getMyPostedJobs = () => api.get("/jobs/my-posted")

// Applications
export const applyToJob = (data) => api.post("/applications", data)
export const getMyApplications = () => api.get("/applications/my-applications")
export const getJobApplications = (jobId) => api.get(`/applications/job/${jobId}`)
export const updateApplicationStatus = (applicationId, status) => api.put(`/applications/${applicationId}/status`, { status })

export default api
