"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { register as registerUser, getAllColleges } from "@/lib/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "college_admin"]),
  college_name: z.string().min(2, "College name is required"),
})

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [colleges, setColleges] = React.useState([])
  const [loadingColleges, setLoadingColleges] = React.useState(true)

  React.useEffect(() => {
    const fetchColleges = async () => {
      try {
        const response = await getAllColleges()
        setColleges(response.data.colleges)
      } catch (err) {
        console.error("Failed to load colleges:", err)
      } finally {
        setLoadingColleges(false)
      }
    }
    fetchColleges()
  }, [])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "student",
      college_name: "",
    },
  })
  const onSubmit = async (values) => {
      setError("")
      setIsLoading(true)
      try {
        const response = await registerUser(values)
        await login(response.data)
        router.push(values.role === "student" ? "/student/jobs" : "/admin/jobs")
      } catch (err) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

  const role = form.watch("role")

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an Account</CardTitle>
          <CardDescription>
            Sign up to start finding or posting jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Choose a username" 
                        autoComplete="username" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Choose a password" 
                        autoComplete="new-password"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="college_admin">College Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />              <FormField
                control={form.control}
                name="college_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>College {role === "student" ? "Name" : "to Manage"}</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      disabled={loadingColleges}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingColleges ? "Loading colleges..." : "Select a college"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {colleges.map((college) => (
                          <SelectItem key={college._id} value={college.name}>
                            {college.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
