"use client"

import { useEffect, useState } from "react"
import { getMyPostedJobs, getJobApplications, updateApplicationStatus } from "@/lib/api"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserCircle } from "lucide-react"

export default function AdminApplicationsPage() {
  const [allApplications, setAllApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updateLoading, setUpdateLoading] = useState(false)

  useEffect(() => {
    const fetchApplications = async () => {
      try {        setLoading(true)
        // First get all jobs posted by this admin
        const jobsResponse = await getMyPostedJobs()
        const jobs = jobsResponse.jobs || []
        
        // Then get applications for each job
        const applicationsPromises = jobs.map(job => getJobApplications(job._id))
        const applicationsResponses = await Promise.all(applicationsPromises)
        
        // Combine all applications
        const allApps = applicationsResponses.flatMap(response => response.applications || [])
        setAllApplications(allApps)
      } catch (err) {
        console.error('Error fetching applications:', err)
        setError(err.response?.data?.message || "Failed to fetch applications")
      } finally {
        setLoading(false)
      }
    }
    fetchApplications()
  }, [])

  const handleStatusUpdate = async (applicationId, newStatus) => {
    try {
      setUpdateLoading(true)
      await updateApplicationStatus(applicationId, newStatus)
      setAllApplications(prevApps => 
        prevApps.map(app => 
          app._id === applicationId 
            ? { ...app, status: newStatus }
            : app
        )
      )
    } catch (err) {
      console.error('Error updating application status:', err)
      setError('Failed to update application status')
    } finally {
      setUpdateLoading(false)
    }
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (e) {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Job Applications</h1>
      
      {allApplications.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No applications received yet.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Current Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{allApplications.map((application) => (<TableRow key={application._id}><TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/10">
                        <UserCircle className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{application.student?.username}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{application.job.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {application.job.type} • {application.job.location}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(application.createdAt)}</TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      application.status === 'accepted' ? 'bg-green-100 text-green-800' :
                      application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {application.status === "pending" && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-green-100 hover:bg-green-200"
                            onClick={() => handleStatusUpdate(application._id, "accepted")}
                            disabled={updateLoading}
                          >
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="bg-red-100 hover:bg-red-200"
                            onClick={() => handleStatusUpdate(application._id, "rejected")}
                            disabled={updateLoading}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Application Details</DialogTitle>
                            <DialogDescription>
                              Submitted on {formatDate(application.createdAt)}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium">Applicant</h4>
                                <p className="text-sm text-muted-foreground">
                                  {application.student?.username}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium">Status</h4>
                                <p className="text-sm text-muted-foreground">
                                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium">Job</h4>
                                <p className="text-sm text-muted-foreground">
                                  {application.job.title}
                                </p>
                              </div>
                              <div>
                                <h4 className="font-medium">Location</h4>
                                <p className="text-sm text-muted-foreground">
                                  {application.job.location}
                                </p>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
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
