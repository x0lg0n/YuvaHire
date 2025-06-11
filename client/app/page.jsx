import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
        Welcome to YuvaHire
      </h1>
      <p className="mt-4 text-xl text-muted-foreground max-w-2xl">
        Connecting college students with exciting job opportunities. Find your next career move or hire talented students.
      </p>
      <div className="flex gap-4 mt-8">
        <Link href="/register">
          <Button size="lg">Get Started</Button>
        </Link>
        <Link href="/login">
          <Button variant="outline" size="lg">Sign In</Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-5xl">
        <div className="flex flex-col items-center p-6 border rounded-lg">
          <svg
            className="w-12 h-12 mb-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-xl font-semibold">For Students</h3>
          <p className="mt-2 text-muted-foreground">
            Discover job opportunities from various colleges and apply with ease
          </p>
        </div>
        
        <div className="flex flex-col items-center p-6 border rounded-lg">
          <svg
            className="w-12 h-12 mb-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="text-xl font-semibold">For Colleges</h3>
          <p className="mt-2 text-muted-foreground">
            Post job opportunities and manage applications efficiently
          </p>
        </div>
        
        <div className="flex flex-col items-center p-6 border rounded-lg">
          <svg
            className="w-12 h-12 mb-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="text-xl font-semibold">Easy to Use</h3>
          <p className="mt-2 text-muted-foreground">
            Simple and intuitive interface for both students and college administrators
          </p>
        </div>
      </div>
    </div>
  )
}
