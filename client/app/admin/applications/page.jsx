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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function AdminApplicationsPage() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const response = await getMyPostedJobs()
        setJobs(response.data)
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch applications")
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await updateApplicationStatus(applicationId, status)
      // Refresh jobs data after status update
      const response = await getMyPostedJobs()
      setJobs(response.data)
    } catch (err) {
      console.error("Failed to update application status:", err)
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
      <div className="text-center text-red-500 py-8">
        {error}
      </div>
    )
  }

  const applications = jobs.flatMap(job => 
    job.applications?.map(app => ({
      ...app,
      job: {
        title: job.title,
        type: job.type,
        location: job.location,
        salary: job.salary
      }
    })) || []
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Job Applications</h1>

      {applications.length === 0 ? (
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
              {applications.map((application) => (
                <TableRow key={application._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {application.student.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">
                          {application.student.username}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Student
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{application.job.title}</TableCell>
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
                          <DialogTitle>Application Details</DialogTitle>
                          <DialogDescription>
                            Review application for {application.job.title}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarFallback>
                                {application.student.username.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">
                                {application.student.username}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Student
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Job Title</h4>
                              <p className="text-sm text-muted-foreground">
                                {application.job.title}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Job Type</h4>
                              <p className="text-sm text-muted-foreground">
                                {application.job.type}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Location</h4>
                              <p className="text-sm text-muted-foreground">
                                {application.job.location}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Salary</h4>
                              <p className="text-sm text-muted-foreground">
                                ₹{application.job.salary.toLocaleString()}/year
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Applied On</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(application.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Current Status</h4>
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
                        </div>
                        <DialogFooter className="gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleStatusUpdate(application._id, "rejected")}
                            disabled={application.status === "rejected"}
                          >
                            Reject
                          </Button>
                          <Button
                            onClick={() => handleStatusUpdate(application._id, "accepted")}
                            disabled={application.status === "accepted"}
                          >
                            Accept
                          </Button>
                        </DialogFooter>
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
