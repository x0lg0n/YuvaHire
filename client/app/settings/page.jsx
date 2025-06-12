"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/lib/auth-context"
import { updateUserProfile } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ProtectedRoute } from "@/components/protected-route"
import { Upload } from "lucide-react"

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  avatar_url: z.string().optional(),
})

export default function SettingsPage() {  const { user, login } = useAuth()
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: user?.username || "",
      avatar_url: user?.avatar_url || "",
    },
  })
  const onSubmit = async (values) => {
    setError("")
    setIsLoading(true)
    try {
      const { data } = await updateUserProfile(values)
      await login({ token: localStorage.getItem("token"), user: data.user })
      setSuccessMessage("Profile updated successfully!")
    } catch (err) {
      setError(err.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.readAsDataURL(file)
      // TODO: Implement file upload and set avatar_url
    }
  }

  return (
    <ProtectedRoute>
      <div className="container max-w-xl py-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Manage your account settings and profile preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-8 flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || user?.avatar_url} />
                <AvatarFallback>{user?.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="avatar-upload"
                  onChange={handleAvatarChange}
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById("avatar-upload").click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Change Picture
                </Button>
              </div>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {successMessage && (
                  <Alert>
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
