import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
}

// GET /api/reports/[id] - Get a single report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const { id } = await params

    const supabase = getServiceClient()

    const { data: report, error } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Report not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }
      console.error('[API /reports/[id]] Query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch report', code: 'QUERY_ERROR', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('[API /reports/[id]] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error?.message },
      { status: 500 }
    )
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const { id } = await params

    const supabase = getServiceClient()

    // Check if report exists and belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('reports')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Delete the report
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('[API /reports/[id]] Delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete report', code: 'DELETE_ERROR', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, deleted: true })
  } catch (error: any) {
    console.error('[API /reports/[id]] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error?.message },
      { status: 500 }
    )
  }
}

// PATCH /api/reports/[id] - Update report (e.g., mark as exported)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()

    const supabase = getServiceClient()

    // Check if report exists and belongs to user
    const { data: existing, error: checkError } = await supabase
      .from('reports')
      .select('id, export_count')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (checkError || !existing) {
      return NextResponse.json(
        { error: 'Report not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    }

    // Handle export tracking
    if (body.exported) {
      updates.last_exported_at = new Date().toISOString()
      updates.export_count = (existing.export_count || 0) + 1
    }

    // Handle name update
    if (body.name && typeof body.name === 'string') {
      updates.name = body.name.trim()
    }

    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('[API /reports/[id]] Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update report', code: 'UPDATE_ERROR', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ report: updatedReport, success: true })
  } catch (error: any) {
    console.error('[API /reports/[id]] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error?.message },
      { status: 500 }
    )
  }
}
