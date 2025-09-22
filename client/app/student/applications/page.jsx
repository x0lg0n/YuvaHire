"use client"

import { useEffect, useState } from "react"
import { getMyApplications } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { RefreshCw, Share2, Copy, ExternalLink, Clipboard } from "lucide-react"
import { copyToClipboard } from "@/lib/utils"

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retryCount, setRetryCount] = useState(0)
  const [isOfflineMode, setIsOfflineMode] = useState(false)
  const [isFallbackMode, setIsFallbackMode] = useState(false)
  
  const fetchApplications = async () => {
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
      
      const response = await getMyApplications();
      
      // Check if we're in one of the fallback modes
      if (response.offlineMode) {
        setIsOfflineMode(true);
        console.log('Using offline mode with client-side fallback data');
      }
      
      if (response.fallbackMode) {
        setIsFallbackMode(true);
        console.log('Using server fallback mode with demo data');
      }
      
      if (!response || !response.applications) {
        console.error('Invalid response format:', response);
        throw new Error('Received invalid data format from server');
      }
      
      setApplications(response.applications || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      
      // Handle different error scenarios with user-friendly messages
      if (err.message?.includes('connect') || err.message?.includes('network')) {
        setError("Cannot connect to the server. Please check your internet connection and ensure the backend is running.");
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status >= 500) {
        setError("The server encountered an error. Please try again later.");
      } else {
        setError(err.message || "Failed to fetch your applications");
      }
      
      // Set empty applications in case of error
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchApplications();
    
    // Set up a polling mechanism to retry in case of connection issues
    const intervalId = setInterval(() => {
      if (error && error.includes("connect") && retryCount < 3) {
        console.log(`Auto-retrying connection (${retryCount + 1}/3)...`);
        setRetryCount(prev => prev + 1);
        fetchApplications();
      }
    }, 5000); // Retry every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [error, retryCount]);
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
        <Button          onClick={() => {
            setRetryCount(0);
            fetchApplications();
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
      <h1 className="text-3xl font-bold">My Applications</h1>
      
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
        {Array.isArray(applications) && applications.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          You haven't applied to any jobs yet.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application._id}>
                  <TableCell className="font-medium">
                    {application.job.title}
                  </TableCell>
                  <TableCell>{application.job.college_name}</TableCell>
                  <TableCell>
                    {new Date(application.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      application.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : application.status === "accepted"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{application.job.title}</DialogTitle>
                          <DialogDescription>
                            Application Details
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Company</h4>                              <p className="text-sm text-muted-foreground">
                                {application.job.college_name}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Location</h4>
                              <p className="text-sm text-muted-foreground">
                                {application.job.location}
                              </p>
                            </div>
                            <div>                              <h4 className="font-medium">Salary</h4>
                              <p className="text-sm text-muted-foreground">
                                ₹{typeof application.job.salary === 'number' 
                                  ? application.job.salary.toLocaleString() 
                                  : application.job.salary}/year
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Applied On</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(application.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Status</h4>
                              <p className={`text-sm ${
                                application.status === "pending"
                                  ? "text-yellow-600"
                                  : application.status === "accepted"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">Job Description</h4>
                            <p className="text-sm text-muted-foreground">
                              {application.job.description}
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
