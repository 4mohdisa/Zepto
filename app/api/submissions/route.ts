import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Initialize Resend if API key is available
const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Email configuration
const FEEDBACK_TO_EMAIL = process.env.FEEDBACK_TO_EMAIL || ''
const FEEDBACK_FROM_EMAIL = process.env.FEEDBACK_FROM_EMAIL || 'onboarding@resend.dev'

// Helper to check if error is "table does not exist"
function isTableMissingError(error: any): boolean {
  const message = error?.message || ''
  const code = error?.code || ''
  return (
    code === '42P01' ||
    message.includes('relation') && message.includes('does not exist') ||
    message.includes('user_submissions')
  )
}

// Helper to create Supabase client
function getSupabaseClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
}

// GET /api/submissions - List user's submissions
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from('user_submissions')
      .select('id, type, title, description, status, created_at, severity, category')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching submissions:', error)
      
      if (isTableMissingError(error)) {
        return NextResponse.json(
          { 
            error: 'Submissions table not found. Please run migration 016.',
            code: 'TABLE_MISSING',
            details: error.message
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch submissions', code: 'FETCH_ERROR', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ submissions: data || [] })
  } catch (error: any) {
    console.error('Submissions GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/submissions - Create a new submission
export async function POST(request: NextRequest) {
  let submissionData: any = null
  
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      type, 
      title, 
      description, 
      route, 
      severity, 
      category, 
      diagnostics 
    } = body

    // Validation
    if (!type || !['issue', 'feature_request'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid type is required (issue or feature_request)', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (title.trim().length > 100) {
      return NextResponse.json(
        { error: 'Title must be 100 characters or less', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (description.trim().length > 2000) {
      return NextResponse.json(
        { error: 'Description must be 2000 characters or less', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Validate severity for issues
    if (type === 'issue' && severity && !['low', 'medium', 'high', 'critical'].includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Sanitize diagnostics - only include safe fields
    const sanitizedDiagnostics = diagnostics ? sanitizeDiagnostics(diagnostics) : null

    const supabase = getSupabaseClient()

    // STEP 1: Database write (source of truth)
    const { data, error } = await supabase
      .from('user_submissions')
      .insert({
        user_id: userId,
        type,
        title: title.trim(),
        description: description.trim(),
        route: route || null,
        severity: type === 'issue' ? (severity || 'medium') : null,
        category: category || null,
        diagnostics_json: sanitizedDiagnostics,
        status: 'open'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating submission:', error)
      
      if (isTableMissingError(error)) {
        return NextResponse.json(
          { 
            error: 'Submissions table not found. Please run migration 016.',
            code: 'TABLE_MISSING',
            details: error.message
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to create submission', code: 'CREATE_ERROR', details: error.message },
        { status: 500 }
      )
    }

    // Store submission data for email
    submissionData = data

    // STEP 2: Send notification email (non-blocking)
    let emailSent = false
    let emailWarning = false

    if (resend && FEEDBACK_TO_EMAIL) {
      try {
        const emailResult = await sendFeedbackEmail({
          type,
          title: title.trim(),
          description: description.trim(),
          route: route || null,
          severity: type === 'issue' ? (severity || 'medium') : null,
          category: category || null,
          submissionId: data.id,
          createdAt: data.created_at,
          userId,
          diagnostics: sanitizedDiagnostics
        })

        if (emailResult.success) {
          emailSent = true
        } else {
          emailWarning = true
          console.warn('Feedback email failed to send:', emailResult.error)
        }
      } catch (emailError) {
        emailWarning = true
        console.warn('Feedback email exception:', emailError)
      }
    } else {
      // Log why email wasn't sent (for debugging)
      if (!resend) {
        console.debug('Resend not configured - skipping email notification')
      } else if (!FEEDBACK_TO_EMAIL) {
        console.debug('FEEDBACK_TO_EMAIL not set - skipping email notification')
      }
    }

    // STEP 3: Return success (database is source of truth)
    const response: any = {
      success: true,
      submission: data,
      emailSent
    }

    // Include warning if email failed but DB succeeded
    if (emailWarning) {
      response.warning = 'Submission saved but notification email failed to send'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error: any) {
    console.error('Submissions POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/submissions - Update a submission (only if status is 'open')
export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, title, description } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // Check if submission belongs to user and is still open
    const { data: existing, error: checkError } = await supabase
      .from('user_submissions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (checkError) {
      if (isTableMissingError(checkError)) {
        return NextResponse.json(
          { 
            error: 'Submissions table not found. Please run migration 016.',
            code: 'TABLE_MISSING'
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: 'Submission not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (!existing) {
      return NextResponse.json(
        { error: 'Submission not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    if (existing.status !== 'open') {
      return NextResponse.json(
        { error: 'Cannot edit submission that is already being processed', code: 'CANNOT_EDIT' },
        { status: 403 }
      )
    }

    // Build update object
    const updates: any = {}
    if (title !== undefined) {
      if (title.trim().length === 0 || title.trim().length > 100) {
        return NextResponse.json(
          { error: 'Title must be 1-100 characters', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      updates.title = title.trim()
    }
    if (description !== undefined) {
      if (description.trim().length === 0 || description.trim().length > 2000) {
        return NextResponse.json(
          { error: 'Description must be 1-2000 characters', code: 'VALIDATION_ERROR' },
          { status: 400 }
        )
      }
      updates.description = description.trim()
    }

    const { data, error } = await supabase
      .from('user_submissions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating submission:', error)
      return NextResponse.json(
        { error: 'Failed to update submission', code: 'UPDATE_ERROR', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ submission: data, success: true })
  } catch (error: any) {
    console.error('Submissions PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/submissions - Delete a submission
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Submission ID is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    const { error } = await supabase
      .from('user_submissions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting submission:', error)
      
      if (isTableMissingError(error)) {
        return NextResponse.json(
          { 
            error: 'Submissions table not found. Please run migration 016.',
            code: 'TABLE_MISSING'
          },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to delete submission', code: 'DELETE_ERROR', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, deleted: true })
  } catch (error: any) {
    console.error('Submissions DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Send feedback notification email via Resend
 */
interface EmailParams {
  type: 'issue' | 'feature_request'
  title: string
  description: string
  route: string | null
  severity: string | null
  category: string | null
  submissionId: number
  createdAt: string
  userId: string
  diagnostics: any
}

interface EmailResult {
  success: boolean
  error?: string
}

async function sendFeedbackEmail(params: EmailParams): Promise<EmailResult> {
  if (!resend) {
    return { success: false, error: 'Resend not initialized' }
  }

  if (!FEEDBACK_TO_EMAIL) {
    return { success: false, error: 'FEEDBACK_TO_EMAIL not configured' }
  }

  const isIssue = params.type === 'issue'
  const subject = isIssue
    ? `[Zepto] New Issue Report: ${params.title.substring(0, 60)}${params.title.length > 60 ? '...' : ''}`
    : `[Zepto] New Feature Request: ${params.title.substring(0, 60)}${params.title.length > 60 ? '...' : ''}`

  const typeLabel = isIssue ? 'Issue Report' : 'Feature Request'
  const severityOrCategory = isIssue 
    ? (params.severity ? `Severity: ${params.severity.toUpperCase()}` : '')
    : (params.category ? `Area: ${params.category}` : '')

  // Build clean, minimal email HTML
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background-color: ${isIssue ? '#dc2626' : '#7c3aed'}; padding: 24px; color: #ffffff;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 600;">${typeLabel}</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 14px;">Zepto Feedback System</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 24px;">
      <!-- Title -->
      <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #111827;">${escapeHtml(params.title)}</h2>
      
      <!-- Metadata -->
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; margin-bottom: 20px; font-size: 13px; color: #6b7280;">
        <div style="margin-bottom: 8px;">
          <strong style="color: #374151;">Submission ID:</strong> #${params.submissionId}
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="color: #374151;">User ID:</strong> ${params.userId}
        </div>
        ${params.route ? `
        <div style="margin-bottom: 8px;">
          <strong style="color: #374151;">Page:</strong> ${escapeHtml(params.route)}
        </div>
        ` : ''}
        ${severityOrCategory ? `
        <div style="margin-bottom: 8px;">
          <strong style="color: #374151;">${isIssue ? 'Severity' : 'Area'}:</strong> ${escapeHtml(severityOrCategory.split(': ')[1])}
        </div>
        ` : ''}
        <div>
          <strong style="color: #374151;">Submitted:</strong> ${formatDate(params.createdAt)}
        </div>
      </div>
      
      <!-- Description -->
      <div style="margin-bottom: 20px;">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Description</h3>
        <div style="background-color: #f9fafb; border-radius: 6px; padding: 16px; font-size: 14px; line-height: 1.6; color: #374151; white-space: pre-wrap;">${escapeHtml(params.description)}</div>
      </div>
      
      <!-- Diagnostics (only if present and safe) -->
      ${formatDiagnostics(params.diagnostics)}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      <p style="margin: 0;">This is an automated notification from Zepto. Submission stored in database with ID #${params.submissionId}.</p>
    </div>
  </div>
</body>
</html>
  `

  try {
    const { data, error } = await resend.emails.send({
      from: FEEDBACK_FROM_EMAIL,
      to: FEEDBACK_TO_EMAIL,
      subject,
      html,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' }
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Format date for email display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  } catch {
    return dateStr
  }
}

/**
 * Format diagnostics section for email (only safe fields)
 */
function formatDiagnostics(diagnostics: any): string {
  if (!diagnostics || typeof diagnostics !== 'object') {
    return ''
  }

  const safeFields: string[] = []
  
  if (diagnostics.environment) {
    safeFields.push(`<div><strong>Environment:</strong> ${escapeHtml(diagnostics.environment)}</div>`)
  }
  
  if (diagnostics.userAgent) {
    const ua = escapeHtml(diagnostics.userAgent)
    safeFields.push(`<div><strong>User Agent:</strong> ${ua.substring(0, 100)}${ua.length > 100 ? '...' : ''}</div>`)
  }

  if (safeFields.length === 0) {
    return ''
  }

  return `
    <div style="margin-top: 20px;">
      <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Technical Info</h3>
      <div style="background-color: #f9fafb; border-radius: 6px; padding: 12px; font-size: 12px; color: #6b7280; font-family: monospace;">
        ${safeFields.join('')}
      </div>
    </div>
  `
}

/**
 * Sanitize diagnostics object to remove sensitive data
 * Only include safe, non-sensitive fields
 */
function sanitizeDiagnostics(diagnostics: any): any {
  if (!diagnostics || typeof diagnostics !== 'object') {
    return null
  }

  // List of allowed safe fields
  const allowedFields = [
    'route',
    'pathname',
    'environment',
    'appVersion',
    'userAgent',
    'timestamp',
    'lastError',
  ]

  const sanitized: any = {}
  
  for (const field of allowedFields) {
    if (diagnostics[field] !== undefined) {
      // Sanitize string values
      if (typeof diagnostics[field] === 'string') {
        // Skip if it looks like sensitive data
        if (isSensitiveString(diagnostics[field])) {
          sanitized[field] = '[REDACTED]'
        } else {
          sanitized[field] = diagnostics[field]
        }
      } else if (typeof diagnostics[field] === 'object') {
        // Recursively sanitize objects
        sanitized[field] = sanitizeDiagnostics(diagnostics[field])
      } else {
        sanitized[field] = diagnostics[field]
      }
    }
  }

  return sanitized
}

/**
 * Check if a string looks like sensitive data
 */
function isSensitiveString(str: string): boolean {
  if (!str || typeof str !== 'string') return false
  
  // Check for patterns that indicate sensitive data
  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /api[_-]?key/i,
    /authorization/i,
    /bearer\s+/i,
    /\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}/, // Credit card
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, // Email
    /\$[\d,]+\.?\d*/, // Dollar amounts
    /\d{4}-\d{2}-\d{2}.+\d+\.\d+/, // CSV-like data with date and amount
  ]
  
  return sensitivePatterns.some(pattern => pattern.test(str))
}
