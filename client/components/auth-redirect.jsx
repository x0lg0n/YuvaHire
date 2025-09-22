"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function AuthRedirect({ children, redirectTo = null }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      // If user is authenticated, redirect to appropriate dashboard
      const dashboardPath = redirectTo || (user.role === 'student' ? '/student/home' : '/admin/jobs')
      router.push(dashboardPath)
    }
  }, [user, loading, router, redirectTo])

  // Show loading or nothing while redirecting
  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  // Don't render children if user is authenticated (they'll be redirected)
  if (user) {
    return null
  }

  return children
}
