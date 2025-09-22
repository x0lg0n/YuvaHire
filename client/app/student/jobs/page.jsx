"use client"

import { useEffect, useState } from "react"
import { getJobs, getMyApplications } from "@/lib/api"
import { JobCard } from "@/components/job-card"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [isFallbackMode, setIsFallbackMode] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      setIsOfflineMode(false);
      setIsFallbackMode(false);
      
      // Try to ping the server first to check connectivity
      try {
        const healthCheck = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
          timeout: 3000
        });
        if (!healthCheck.ok) {
          console.warn('Health check failed with status:', healthCheck.status);
        }
      } catch (healthErr) {
        console.warn('Health check failed:', healthErr);
        // Continue anyway, the main request might still work
      }
      
      const [jobsResponse, applicationsResponse] = await Promise.all([
        getJobs(),
        getMyApplications()
      ]);
      
      // Check if we're in one of the fallback modes for jobs
      if (jobsResponse.offlineMode) {
        setIsOfflineMode(true);
        console.log('Using offline mode with client-side fallback data for jobs');
      }
      
      if (jobsResponse.fallbackMode) {
        setIsFallbackMode(true);
        console.log('Using server fallback mode with demo data for jobs');
      }
      
      // Check if we're in one of the fallback modes for applications
      if (applicationsResponse.offlineMode) {
        setIsOfflineMode(true);
        console.log('Using offline mode with client-side fallback data for applications');
      }
      
      if (applicationsResponse.fallbackMode) {
        setIsFallbackMode(true);
        console.log('Using server fallback mode with demo data for applications');
      }
      
      setJobs(jobsResponse.jobs || []);
      setApplications(applicationsResponse.applications || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      
      // Handle different error scenarios with user-friendly messages
      if (err.message?.includes('connect') || err.message?.includes('network')) {
        setError("Cannot connect to the server. Please check your internet connection and ensure the backend is running.");
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status >= 500) {
        setError("The server encountered an error. Please try again later.");
      } else {
        setError(err.message || "Failed to fetch jobs and applications");
      }
      
      setJobs([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    fetchData();
    
    // Set up a polling mechanism to retry in case of connection issues
    const intervalId = setInterval(() => {
      if (error && error.includes("connect") && retryCount < 3) {
        console.log(`Auto-retrying connection (${retryCount + 1}/3)...`);
        setRetryCount(prev => prev + 1);
        fetchData();
      }
    }, 5000); // Retry every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [error, retryCount]);

  const handleApply = (jobId) => {
    setApplications([...applications, { job: { _id: jobId } }])
  }

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <Alert variant="destructive" className="max-w-md mb-4">
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription className="mt-2">{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => {
            setRetryCount(0);
            fetchData();
          }}
          className="mt-4"
        >
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Retry Connection
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Show fallback/offline mode banner if active */}
      {(isOfflineMode || isFallbackMode) && (
        <Alert className="mb-4 bg-amber-50 border-amber-300">
          <AlertTitle className="text-amber-800">
            {isOfflineMode ? "Offline Mode" : "Limited Connectivity Mode"}
          </AlertTitle>
          <AlertDescription className="text-amber-700">
            {isOfflineMode 
              ? "You're viewing sample data because the server is unreachable." 
              : "The server is running in fallback mode with demo data due to database connectivity issues."}
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Available Jobs</h1>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search jobs..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No jobs found. Try adjusting your search.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredJobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onApply={handleApply}
              hasApplied={applications.some(app => app.job._id === job._id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
