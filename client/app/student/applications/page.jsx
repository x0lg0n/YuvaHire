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

export default function StudentApplicationsPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const response = await getMyApplications();
        setApplications(response.data.applications || []);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(err.response?.data?.message || "Failed to fetch applications");
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
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
      <div className="text-center text-red-500 py-8">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">My Applications</h1>
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
