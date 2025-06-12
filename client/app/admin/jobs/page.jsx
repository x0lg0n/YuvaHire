"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getMyPostedJobs } from "@/lib/api"
import { Button } from "@/components/ui/button"
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
import { PlusCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminJobsPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchJobs = async () => {
      try {        setLoading(true)
        const response = await getMyPostedJobs()
        console.log('Jobs response:', response)
        setJobs(response.jobs || [])
      } catch (err) {
        console.error('Error fetching jobs:', err)
        setError(err.response?.data?.message || "Failed to fetch jobs")
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
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Posted Jobs</h1>
        <Button onClick={() => router.push("/admin/jobs/new")}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Post New Job
        </Button>
      </div>

      {!Array.isArray(jobs) || jobs.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          You haven't posted any jobs yet.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Salary</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job._id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{job.type}</TableCell>
                  <TableCell>₹{(job.salary || 0).toLocaleString()}</TableCell>
                  <TableCell>{formatDate(job.deadline)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{job.title}</DialogTitle>
                          <DialogDescription>
                            Posted for {job.college_name}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Location</h4>
                              <p className="text-sm text-muted-foreground">
                                {job.location}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Type</h4>
                              <p className="text-sm text-muted-foreground">
                                {job.type}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Salary</h4>
                              <p className="text-sm text-muted-foreground">
                                ₹{(job.salary || 0).toLocaleString()}/year
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Deadline</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(job.deadline)}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">Description</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {job.description}
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium">Requirements</h4>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {job.requirements}
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
