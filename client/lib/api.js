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
  (response) => response,
  (error) => {
    // Get error message from response or fallback
    const message = error.response?.data?.message || 
                   "Something went wrong. Please try again."
    error.message = message
    
    // Handle unauthorized errors (token expired or invalid)
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    }
    
    console.error('API Error:', {
      status: error.response?.status,
      message: error.message,
      path: error.config?.url,
      method: error.config?.method
    });
    
    return Promise.reject(error)
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

// Colleges
export const getAllColleges = () => api.get("/colleges")
export const createCollege = (data) => api.post("/colleges", data)
export const updateCollege = (id, data) => api.put(`/colleges/${id}`, data)
export const deleteCollege = (id) => api.delete(`/colleges/${id}`)

export default api
