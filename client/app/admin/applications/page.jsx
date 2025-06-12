"use client"

import { useEffect, useState } from "react"
import { getMyPostedJobs } from "@/lib/api"
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
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const response = await getMyPostedJobs()
        console.log('Jobs response:', response.data)
        setJobs(response.data.jobs || [])
      } catch (err) {
        console.error('Error fetching jobs:', err)
        setError(err.response?.data?.message || "Failed to fetch applications")
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

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

  const allApplications = (Array.isArray(jobs) ? jobs : []).reduce((acc, job) => {
    if (job.applications && Array.isArray(job.applications)) {
      const jobApplications = job.applications.map(app => ({
        ...app,
        job: {
          id: job._id,
          title: job.title,
          type: job.type,
          location: job.location,
          salary: job.salary
        }
      }))
      return [...acc, ...jobApplications]
    }
    return acc
  }, [])

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Job Applications</h1>

      {!allApplications.length ? (
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
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allApplications.map((application) => (
                <TableRow key={application._id}>
                  <TableCell className="flex items-center space-x-2">
                    <UserCircle className="h-8 w-8" />
                    <div>
                      <div className="font-medium">{application.student?.username}</div>
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
                              <h4 className="font-medium">Salary</h4>
                              <p className="text-sm text-muted-foreground">
                                ₹{(application.job.salary || 0).toLocaleString()}/year
                              </p>
                            </div>
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
