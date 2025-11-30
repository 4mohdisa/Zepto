"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

const formSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
})

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        throw error
      }

      setEmailSent(true)
      toast.success("Password reset email sent", {
        description: "Check your email for the reset link"
      })
    } catch (error: any) {
      toast.error("Failed to send reset email", {
        description: error.message || "Please try again"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md border-border shadow-2xl bg-white">
        <CardHeader className="space-y-4">
          <div className="flex justify-center items-center gap-2 mb-2">
            <img src="/logo.png" alt="Zepto" className="h-14 w-14 object-contain" />
            <h1 className="text-3xl font-bold text-foreground">
              Zepto
            </h1>
          </div>
          <CardTitle className="text-2xl font-semibold text-center text-foreground">Reset your password</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {emailSent
              ? "Check your email for a link to reset your password"
              : "Enter your email and we'll send you a link to reset your password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!emailSent ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full gradient-primary hover:gradient-primary-hover transition-all shadow-lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending reset link...
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            <div className="p-4 border border-success/30 rounded-lg bg-success/10">
              <p className="text-sm text-success">
                We&apos;ve sent a link to reset your password. Please check your email and follow the instructions.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/sign-in" className="text-sm text-primary hover:text-secondary transition-colors">
            Back to sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}