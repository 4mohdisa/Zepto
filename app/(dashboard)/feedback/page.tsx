'use client'

import { useState, useCallback, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertTriangle, Lightbulb, MessageSquare, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { SubmissionDialog } from './_components/submission-dialog'
import {
  pageContainer,
  pageContent,
  pageHeading,
  bodyText,
  primaryButton,
} from '@/lib/styles'
import { cn } from '@/lib/utils'
import { usePageView } from '@/hooks/use-page-view'

interface Submission {
  id: number
  type: 'issue' | 'feature_request'
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  severity?: string
  category?: string
}

// Status badge component
function StatusBadge({ status }: { status: string }) {
  const styles = {
    open: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
    resolved: 'bg-green-50 text-green-700 border-green-200',
    closed: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  const labels = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    closed: 'Closed',
  }

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium rounded-md px-2 py-0.5', styles[status as keyof typeof styles])}
    >
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

// Type badge component
function TypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-xs font-medium rounded-md px-2 py-0.5',
        type === 'issue'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-purple-50 text-purple-700 border-purple-200'
      )}
    >
      {type === 'issue' ? 'Issue' : 'Feature'}
    </Badge>
  )
}

// Severity badge component
function SeverityBadge({ severity }: { severity?: string }) {
  if (!severity) return null

  const styles = {
    low: 'bg-gray-100 text-gray-600 border-gray-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    high: 'bg-orange-50 text-orange-700 border-orange-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium rounded-md px-2 py-0.5', styles[severity as keyof typeof styles])}
    >
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </Badge>
  )
}

export default function FeedbackPage() {
  usePageView('feedback')
  
  const pathname = usePathname()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false)
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('submit')

  // Fetch submissions
  const fetchSubmissions = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/submissions')
      if (!response.ok) {
        throw new Error('Failed to fetch submissions')
      }
      const data = await response.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      // Silently fail - not critical
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubmissions()
  }, [fetchSubmissions])

  // Filter submissions
  const issues = submissions.filter((s) => s.type === 'issue')
  const features = submissions.filter((s) => s.type === 'feature_request')

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className={pageContainer}>
      <div className={pageContent}>
        {/* Header */}
        <div className="mb-6">
          <h1 className={pageHeading}>Feedback</h1>
          <p className={`${bodyText} mt-1`}>
            Report issues or suggest new features
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full sm:w-auto grid-cols-2 sm:inline-flex">
            <TabsTrigger value="submit" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Submit
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Clock className="h-4 w-4" />
              History ({submissions.length})
            </TabsTrigger>
          </TabsList>

          {/* Submit Tab */}
          <TabsContent value="submit" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Report Issue Card */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsIssueDialogOpen(true)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {issues.length} reported
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-3">Report an Issue</CardTitle>
                  <CardDescription className="text-sm">
                    Found a bug or something not working? Let us know and we will fix it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className={primaryButton} onClick={() => setIsIssueDialogOpen(true)}>
                    Report Issue
                  </Button>
                </CardContent>
              </Card>

              {/* Feature Request Card */}
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setIsFeatureDialogOpen(true)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center">
                      <Lightbulb className="h-5 w-5 text-purple-600" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {features.length} requested
                    </Badge>
                  </div>
                  <CardTitle className="text-base mt-3">Request a Feature</CardTitle>
                  <CardDescription className="text-sm">
                    Have an idea to make Zepto better? We would love to hear it.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className={primaryButton} onClick={() => setIsFeatureDialogOpen(true)}>
                    Request Feature
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Info Card */}
            <Card className="bg-gray-50 border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  What happens next?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1.5 list-disc list-inside">
                  <li>We review every submission within 24-48 hours</li>
                  <li>You will see status updates in the History tab</li>
                  <li>For critical issues, we prioritize fixing them quickly</li>
                  <li>Feature requests help shape the future of Zepto</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : submissions.length > 0 ? (
              <div className="space-y-3">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <TypeBadge type={submission.type} />
                            <StatusBadge status={submission.status} />
                            {submission.severity && <SeverityBadge severity={submission.severity} />}
                            {submission.category && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {submission.category}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-medium text-gray-900 truncate">{submission.title}</h3>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {submission.description}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            Submitted {formatDate(submission.created_at)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-gray-900 font-medium mb-1">No submissions yet</h3>
                <p className="text-sm text-gray-500">
                  Your reported issues and feature requests will appear here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Submission Dialogs */}
        <SubmissionDialog
          isOpen={isIssueDialogOpen}
          onClose={() => setIsIssueDialogOpen(false)}
          type="issue"
          currentRoute={pathname}
          onSuccess={fetchSubmissions}
        />

        <SubmissionDialog
          isOpen={isFeatureDialogOpen}
          onClose={() => setIsFeatureDialogOpen(false)}
          type="feature_request"
          currentRoute={pathname}
          onSuccess={fetchSubmissions}
        />
      </div>
    </div>
  )
}
