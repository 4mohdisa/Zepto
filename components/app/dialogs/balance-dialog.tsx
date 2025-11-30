'use client'

import { useState } from 'react'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { InputField } from '../shared/form-fields'
import { LoadingButton } from '../shared/loading-button'

const formSchema = z.object({
  balance: z.coerce.number().min(0, "Balance must be a positive number")
})

type FormValues = z.infer<typeof formSchema>

interface BalanceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BalanceDialog({ open, onOpenChange }: BalanceDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { balance: 0 }
  })

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to add balance:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-border bg-card shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Add Balance</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter your current account balance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <InputField
              control={form.control}
              name="balance"
              label="Balance Amount"
              placeholder="0.00"
              type="number"
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border hover:bg-hover-surface transition-colors">
                Cancel
              </Button>
              <LoadingButton type="submit" isLoading={isSubmitting} loadingText="Adding..." className="gradient-primary hover:gradient-primary-hover shadow-lg transition-all">
                Add Balance
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
