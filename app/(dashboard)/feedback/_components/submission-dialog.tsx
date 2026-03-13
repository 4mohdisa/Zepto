'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { primaryButton, secondaryButton } from '@/lib/styles'
import { trackEvent, EVENT_ISSUE_REPORT_SUBMITTED, EVENT_FEATURE_REQUEST_SUBMITTED } from '@/lib/analytics'

interface SubmissionDialogProps {
  isOpen: boolean
  onClose: () => void
  type: 'issue' | 'feature_request'
  currentRoute: string
  onSuccess: () => void
}

export function SubmissionDialog({
  isOpen,
  onClose,
  type,
  currentRoute,
  onSuccess,
}: SubmissionDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('medium')
  const [category, setCategory] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isIssue = type === 'issue'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    if (!trimmedTitle) {
      toast.error('Title is required')
      return
    }

    if (!trimmedDescription) {
      toast.error('Description is required')
      return
    }

    setIsSubmitting(true)

    try {
      // Build diagnostics for issues only
      const diagnostics = isIssue
        ? {
            route: currentRoute,
            environment: process.env.NODE_ENV,
            timestamp: new Date().toISOString(),
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          }
        : undefined

      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: trimmedTitle,
          description: trimmedDescription,
          route: currentRoute,
          severity: isIssue ? severity : undefined,
          category: category || undefined,
          diagnostics,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || `Failed to submit ${isIssue ? 'issue' : 'request'}`)
        return
      }

      // Track analytics
      if (isIssue) {
        trackEvent(EVENT_ISSUE_REPORT_SUBMITTED, { severity, has_diagnostics: !!diagnostics })
      } else {
        trackEvent(EVENT_FEATURE_REQUEST_SUBMITTED, { has_category: !!category })
      }

      // Show success toast
      toast.success(
        isIssue
          ? 'Issue reported successfully. Thank you!'
          : 'Feature request submitted. Thank you!'
      )

      // Show mild warning if email notification failed (non-critical)
      if (data.warning) {
        toast.info('Note: Notification email could not be sent, but your submission was saved.')
      }

      // Reset form
      setTitle('')
      setDescription('')
      setSeverity('medium')
      setCategory('')

      onSuccess()
      onClose()
    } catch (error) {
      toast.error(`Failed to submit ${isIssue ? 'issue' : 'request'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 overflow-hidden" aria-describedby="dialog-description">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {isIssue ? 'Report an Issue' : 'Request a Feature'}
          </DialogTitle>
          <DialogDescription id="dialog-description" className="sr-only">
            {isIssue 
              ? 'Submit an issue report to help us improve Zepto. Please provide a clear title and description.' 
              : 'Submit a feature request to help us improve Zepto. Please describe your idea in detail.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={isIssue ? 'e.g. Dashboard not loading' : 'e.g. Add export to PDF'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-9 text-sm"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
          </div>

          {/* Severity for issues */}
          {isIssue && (
            <div className="space-y-1.5">
              <Label htmlFor="severity" className="text-xs font-medium">
                Severity
              </Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger id="severity" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                  <SelectItem value="medium">Medium - Affects workflow</SelectItem>
                  <SelectItem value="high">High - Major problem</SelectItem>
                  <SelectItem value="critical">Critical - App unusable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Category for feature requests */}
          {!isIssue && (
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-xs font-medium">
                Area
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category" className="h-9 text-sm">
                  <SelectValue placeholder="Select area (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dashboard">Dashboard</SelectItem>
                  <SelectItem value="transactions">Transactions</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="categories">Categories</SelectItem>
                  <SelectItem value="merchants">Merchants</SelectItem>
                  <SelectItem value="reports">Reports</SelectItem>
                  <SelectItem value="ui">UI/UX</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-medium">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder={
                isIssue
                  ? 'Describe the issue and steps to reproduce...'
                  : 'Describe the feature you would like to see...'
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] text-sm resize-none"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {description.length}/2000 characters
            </p>
          </div>

          {/* Current route info */}
          <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
            Current page: {currentRoute}
          </div>

          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className={secondaryButton}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className={primaryButton}
              disabled={isSubmitting || !title.trim() || !description.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
