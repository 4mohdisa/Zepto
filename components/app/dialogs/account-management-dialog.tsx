'use client'

import { useState, useEffect, useCallback } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { User } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmationDialog } from './confirmation-dialog'
import { InputField } from '../shared/form-fields'
import { LoadingButton } from '../shared/loading-button'

const profileFormSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
})

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, { message: "Current password must be at least 6 characters." }),
  newPassword: z.string().min(6, { message: "New password must be at least 6 characters." }),
  confirmPassword: z.string().min(6, { message: "Confirm password must be at least 6 characters." }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ProfileFormValues = z.infer<typeof profileFormSchema>
type PasswordFormValues = z.infer<typeof passwordFormSchema>

interface AccountManagementDialogProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
}

export function AccountManagementDialog({ isOpen, onClose, user }: AccountManagementDialogProps) {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState("profile")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { fullName: "", email: "" },
  })

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  })

  const fetchUserProfile = useCallback(async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          const newProfile = {
            id: user.id,
            name: user.user_metadata?.full_name || null,
            email: user.email || '',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          const { data: insertedProfile, error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile)
            .select()
            .single()
            
          if (insertError) throw insertError
          
          profileForm.reset({
            fullName: insertedProfile.name || '',
            email: insertedProfile.email
          })
        } else {
          throw profileError
        }
      } else {
        profileForm.reset({
          fullName: profileData.name || '',
          email: profileData.email
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Failed to load profile")
      profileForm.reset({
        fullName: user.user_metadata?.full_name || "",
        email: user.email || "",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase, profileForm])

  useEffect(() => {
    if (isOpen && user) {
      fetchUserProfile()
    }
  }, [isOpen, user, fetchUserProfile])

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { full_name: data.fullName }
      })
      if (metadataError) throw metadataError

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: data.fullName, updated_at: new Date().toISOString() })
        .eq('id', user.id)
      if (profileError) throw profileError

      if (data.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email: data.email })
        if (emailError) throw emailError
        
        const { error: profileEmailError } = await supabase
          .from('profiles')
          .update({ email: data.email, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        if (profileEmailError) throw profileEmailError
        
        toast.success("Email update initiated", {
          description: "Please check your new email for a confirmation link."
        })
      } else {
        toast.success("Profile updated successfully")
      }
      
      fetchUserProfile()
      onClose()
    } catch (error: unknown) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile", {
        description: error instanceof Error ? error.message : "Unknown error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: data.currentPassword,
      })

      if (signInError) {
        toast.error("Current password is incorrect")
        setIsLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      })
      if (updateError) throw updateError

      toast.success("Password updated successfully")
      passwordForm.reset()
      onClose()
    } catch (error: unknown) {
      console.error("Error updating password:", error)
      toast.error("Failed to update password", {
        description: error instanceof Error ? error.message : "Unknown error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)
      if (profileError) throw profileError

      const { error: transactionsError } = await supabase
        .from('transactions')
        .delete()
        .eq('user_id', user.id)
      if (transactionsError) console.error("Error deleting transactions:", transactionsError)

      const { error: recurringError } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('user_id', user.id)
      if (recurringError) console.error("Error deleting recurring transactions:", recurringError)

      toast.success("Account data deleted")
      toast.info("Your account has been marked for deletion", {
        description: "You have been signed out and your data has been removed."
      })
      
      await supabase.auth.signOut()
      window.location.href = '/sign-in'
    } catch (error: unknown) {
      console.error("Error deleting account:", error)
      toast.error("Failed to delete account", {
        description: "Please contact support if this issue persists."
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px] border-border bg-card shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">Account Management</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your account information or manage your account settings.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-hover-surface border border-border">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-4 py-4">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <InputField
                    control={profileForm.control}
                    name="fullName"
                    label="Full Name"
                    placeholder="Your name"
                  />
                  <InputField
                    control={profileForm.control}
                    name="email"
                    label="Email"
                    placeholder="Your email"
                    type="email"
                  />
                  <DialogFooter>
                    <LoadingButton type="submit" isLoading={isLoading} loadingText="Updating..." className="gradient-primary hover:gradient-primary-hover shadow-lg transition-all">
                      Update Profile
                    </LoadingButton>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4 py-4">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <InputField
                    control={passwordForm.control}
                    name="currentPassword"
                    label="Current Password"
                    placeholder="Current password"
                    type="password"
                  />
                  <InputField
                    control={passwordForm.control}
                    name="newPassword"
                    label="New Password"
                    placeholder="New password"
                    type="password"
                  />
                  <InputField
                    control={passwordForm.control}
                    name="confirmPassword"
                    label="Confirm Password"
                    placeholder="Confirm new password"
                    type="password"
                  />
                  <DialogFooter className="flex flex-col gap-2 sm:flex-row">
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="sm:mr-auto bg-destructive hover:bg-destructive/90 shadow-lg transition-all"
                    >
                      Delete Account
                    </Button>
                    <LoadingButton type="submit" isLoading={isLoading} loadingText="Updating..." className="gradient-primary hover:gradient-primary-hover shadow-lg transition-all">
                      Update Password
                    </LoadingButton>
                  </DialogFooter>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."
        cancelText="Cancel"
        confirmText="Delete Account"
      />
    </>
  )
}
