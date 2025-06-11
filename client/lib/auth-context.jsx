"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { jwtDecode } from "jwt-decode"

const AuthContext = createContext({
  user: null,
  login: async () => {},
  logout: async () => {},
  loading: true
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check token validity and expiration
  const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token)
      return decoded.exp * 1000 > Date.now()
    } catch {
      return false
    }
  }

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")
    
    if (storedUser && token && isTokenValid(token)) {
      setUser(JSON.parse(storedUser))
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else if (storedUser || token) {
      // If either exists but is invalid, clear them
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      delete axios.defaults.headers.common["Authorization"]
    }
    
    setLoading(false)
  }, [])

  const login = async (data) => {
    try {
      console.log('Login data received:', data)
      if (!data.token || !data.user) {
        throw new Error('Invalid login response format')
      }

      console.log('Setting auth data:', { username: data.user.username, role: data.user.role })
      
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.token}`
      setUser(data.user)
      
      console.log('Auth setup complete with role:', data.user.role)
      return true
    } catch (error) {
      console.error('Error in auth setup:', error)
      // Clean up any partial state
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      delete axios.defaults.headers.common["Authorization"]
      setUser(null)
      throw error
    }
  }

  const logout = async () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
    router.push("/login")
  }

  // Add axios response interceptor for handling token expiration
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          if (error.response.data.message === 'Token has expired') {
            logout()
          }
        }
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
