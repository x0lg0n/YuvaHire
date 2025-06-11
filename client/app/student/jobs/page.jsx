"use client"

import { useEffect, useState } from "react"
import { getJobs, getMyApplications } from "@/lib/api"
import { JobCard } from "@/components/job-card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [jobsResponse, applicationsResponse] = await Promise.all([
          getJobs(),
          getMyApplications()
        ])
        setJobs(jobsResponse.data)
        setApplications(applicationsResponse.data)
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch jobs")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
