"use client"

import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useEffect } from "react"

export function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")      } else if (requiredRole && user.role !== requiredRole) {
        router.push(
          user.role === "student" 
            ? "/student/jobs" 
            : user.role === "college_admin" 
              ? "/admin/jobs"
              : "/login"
        )
      }
    }
  }, [user, loading, router, requiredRole])

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user || (requiredRole && user.role !== requiredRole)) {
    return null
  }

  return children
}
