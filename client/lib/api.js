import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
})

// Add response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 
                   "Something went wrong. Please try again."
    error.message = message
    return Promise.reject(error)
  }
)

// Auth
export const register = (data) => {
  // Transform college_name to match backend expectations
  const transformedData = { ...data }
  if (data.role === 'student') {
    transformedData.college_name = data.college_name
  }
  return api.post("/auth/register", transformedData)
}
export const login = (data) => api.post("/auth/login", data)

// Jobs
export const getJobs = () => api.get("/jobs")
export const getJobsByCollege = (collegeId) => api.get(`/jobs/college/${collegeId}`)
export const createJob = (data) => api.post("/jobs", data)
export const getMyPostedJobs = () => api.get("/jobs/my-posted")

// Applications
export const applyToJob = (data) => api.post("/applications", data)
export const getMyApplications = () => api.get("/applications/my-applications")

// Colleges
export const getAllColleges = () => api.get("/colleges")

export default api
