'use client'

import { useState } from 'react'
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Upload, X, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { DateRangePickerWithRange } from "@/components/app/shared/date-range-picker"
import { InputField, TextareaField } from '../shared/form-fields'
import { LoadingButton } from '../shared/loading-button'

const formSchema = z.object({
  file_name: z.string().min(1, "File name is required").max(100, "File name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  transaction_date_range: z.object({
    from: z.date({ required_error: "Start date is required" }),
    to: z.date({ required_error: "End date is required" })
  }).refine((data) => data.from <= data.to, {
    message: "End date cannot be before start date",
    path: ["to"]
  }).optional()
})

type FormValues = z.infer<typeof formSchema>

interface UploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file_name: "",
      description: "",
      transaction_date_range: undefined
    }
  })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, "")
      form.setValue("file_name", fileName)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    form.setValue("file_name", "")
  }

  const onSubmit = async (values: FormValues) => {
    if (!file) return

    setIsSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setFile(null)
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] border-border bg-card shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground">Upload Transactions</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload your financial transaction file and provide necessary details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left side - File upload */}
              <div className="space-y-4">
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 border-border transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground">CSV, XLS, PDF (MAX. 10MB)</p>
                    </div>
                    <input 
                      id="dropzone-file" 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange} 
                      accept=".csv,.xls,.xlsx,.pdf"
                    />
                  </label>
                </div>
                {file && (
                  <div className="flex items-center justify-between p-3 bg-hover-surface border border-border rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-primary" />
                      <span className="text-sm font-medium text-foreground">{file.name}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={handleRemoveFile} className="hover:bg-background">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Right side - Form fields */}
              <div className="space-y-4">
                <InputField
                  control={form.control}
                  name="file_name"
                  label="File Name"
                  placeholder="Enter file name"
                />

                <FormField
                  control={form.control}
                  name="transaction_date_range"
                  render={({ field: { value, onChange } }) => (
                    <FormItem>
                      <FormLabel>Transaction Date Range</FormLabel>
                      <FormControl>
                        <DateRangePickerWithRange
                          dateRange={value}
                          onDateRangeChange={onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <TextareaField
                  control={form.control}
                  name="description"
                  label="Description"
                  placeholder="Enter file description"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border hover:bg-hover-surface transition-colors">
                Cancel
              </Button>
              <LoadingButton 
                type="submit" 
                isLoading={isSubmitting} 
                loadingText="Uploading..."
                disabled={!file}
                className="gradient-primary hover:gradient-primary-hover shadow-lg transition-all"
              >
                Upload File
              </LoadingButton>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
