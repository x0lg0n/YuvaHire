"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAllColleges, createCollege, updateCollege, deleteCollege } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
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
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { PlusCircle, Edit, Trash2 } from "lucide-react"

const formSchema = z.object({
  name: z.string().min(3, "College name must be at least 3 characters"),
  location: z.string().min(3, "Location must be at least 3 characters"),
})

export default function AdminCollegesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [colleges, setColleges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCollege, setSelectedCollege] = useState(null)

  // Redirect if not super admin
  useEffect(() => {
    if (user && user.role !== 'super_admin') {
      router.push('/admin/jobs')
    }
  }, [user, router])

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        setLoading(true)
        const response = await getAllColleges()
        setColleges(response.data.colleges)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchColleges()
  }, [])

  useEffect(() => {
    if (selectedCollege) {
      form.reset({
        name: selectedCollege.name,
        location: selectedCollege.location,
      })
    } else {
      form.reset({
        name: "",
        location: "",
      })
    }
  }, [selectedCollege, form])

  const onSubmit = async (values) => {
    try {
      if (selectedCollege) {
        await updateCollege(selectedCollege._id, values)
        const updatedColleges = colleges.map(college => 
          college._id === selectedCollege._id 
            ? { ...college, ...values }
            : college
        )
        setColleges(updatedColleges)
      } else {
        const response = await createCollege(values)
        setColleges([...colleges, response.data.college])
      }
      setIsDialogOpen(false)
      setSelectedCollege(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this college?")) return
    
    try {
      await deleteCollege(id)
      setColleges(colleges.filter(college => college._id !== id))
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Colleges</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedCollege(null)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add College
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedCollege ? "Edit College" : "Add New College"}
              </DialogTitle>
              <DialogDescription>
                {selectedCollege 
                  ? "Update the college details below"
                  : "Enter the details of the new college"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter college name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <DialogFooter>
                  <Button type="submit">
                    {selectedCollege ? "Update College" : "Add College"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {colleges.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          No colleges added yet.
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>College Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colleges.map((college) => (
                <TableRow key={college._id}>
                  <TableCell className="font-medium">{college.name}</TableCell>
                  <TableCell>{college.location}</TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCollege(college)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(college._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
