"use client"

import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog"
import { useAuth } from "@/lib/auth-context"
import { applyToJob } from "@/lib/api"
import { useState } from "react"

export function JobCard({ job, onApply, hasApplied }) {
  const { user } = useAuth()
  const [applying, setApplying] = useState(false)
  const [error, setError] = useState("")

  const handleApply = async () => {
    try {
      setApplying(true)
      setError("")
      await applyToJob({ job_id: job._id })
      onApply && onApply(job._id)
    } catch (err) {
      setError(err.response?.data?.message || "Failed to apply")
    } finally {
      setApplying(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">            <div>
              <h3 className="text-xl font-semibold">{job.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Posted by {job.college_name}
              </p>
            </div>
          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
            {job.type}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Location:</span>
            {job.location}
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Salary:</span>
            ₹{job.salary.toLocaleString()}/year
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">View Details</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{job.title}</DialogTitle>              <DialogDescription>
                Posted by {job.college_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium">Job Description</h4>
                <p className="text-sm text-muted-foreground">
                  {job.description}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Requirements</h4>
                <p className="text-sm text-muted-foreground">
                  {job.requirements}
                </p>
              </div>
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
                    ₹{job.salary.toLocaleString()}/year
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Posted On</h4>
                  <p className="text-sm text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              {user?.role === "student" && (
                <Button
                  onClick={handleApply}
                  disabled={hasApplied || applying}
                >
                  {hasApplied ? "Applied" : applying ? "Applying..." : "Apply Now"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {user?.role === "student" && (
          <Button 
            onClick={handleApply}
            disabled={hasApplied || applying}
          >
            {hasApplied ? "Applied" : applying ? "Applying..." : "Apply Now"}
          </Button>
        )}
      </CardFooter>
      {error && (
        <div className="px-6 pb-4">
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}
    </Card>
  )
}
