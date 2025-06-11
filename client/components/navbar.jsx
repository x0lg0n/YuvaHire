"use client"

import * as React from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { UserCircle } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"

export function Navbar() {
  const router = useRouter()
  const [user, setUser] = React.useState(null)

  React.useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser(null)
    router.push("/login")
  }

  return (
    <nav className="border-b">
      <div className="flex h-16 items-center px-4 mx-auto max-w-7xl">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">YuvaHire</span>
        </Link>
        
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          
          {user ? (
            <>
              <Link href={user.role === "student" ? "/student/jobs" : "/admin/jobs"}>
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Button variant="ghost" onClick={handleLogout}>
                Logout
              </Button>
              <UserCircle className="h-8 w-8" />
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button>Sign Up</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
