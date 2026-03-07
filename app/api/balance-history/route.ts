import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Helper to create service role client (bypasses RLS)
function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const accountType = searchParams.get('accountType')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    const supabase = getServiceClient()

    // Check if table exists first
    const { data: tableCheck, error: tableError } = await supabase
      .from('account_balance_history')
      .select('id')
      .limit(1)

    if (tableError) {
      // Check for specific error codes
      const pgError = tableError as any
      const errorCode = pgError?.code || ''
      const errorMessage = pgError?.message || ''

      // Table doesn't exist
      if (errorCode === '42P01' || errorMessage.includes('does not exist')) {
        return NextResponse.json({
          error: 'Balance history table does not exist',
          code: 'TABLE_MISSING',
          message: 'The account_balance_history table needs to be created',
          sqlHint: 'Run the migration SQL from database/migrations/010_add_balance_history.sql'
        }, { status: 404 })
      }

      return NextResponse.json({
        error: 'Database query failed',
        code: 'QUERY_ERROR',
        details: errorMessage,
        pgCode: errorCode
      }, { status: 500 })
    }

    // Build query
    let query = supabase
      .from('account_balance_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (accountType && accountType !== 'all') {
      query = query.eq('account_type', accountType)
    }

    const { data, error } = await query

    if (error) {
      console.error('[API /balance-history] Query error:', error)
      return NextResponse.json({
        error: 'Failed to fetch balance history',
        code: 'QUERY_ERROR',
        details: error.message,
        pgCode: (error as any)?.code
      }, { status: 500 })
    }

    return NextResponse.json({
      history: data || [],
      count: data?.length || 0,
      duration: Date.now() - startTime
    })

  } catch (error: any) {
    console.error('[API /balance-history] Unhandled error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// POST to add a balance history record
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { account_type, balance_amount, note } = body

    if (!account_type || typeof balance_amount !== 'number') {
      return NextResponse.json({
        error: 'Missing required fields: account_type, balance_amount',
        code: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { data, error } = await supabase
      .from('account_balance_history')
      .insert({
        user_id: userId,
        account_type,
        balance_amount,
        note: note || null
      })
      .select()
      .single()

    if (error) {
      console.error('[API /balance-history] Insert error:', error)
      return NextResponse.json({
        error: 'Failed to add balance history',
        code: 'INSERT_ERROR',
        details: error.message,
        pgCode: (error as any)?.code
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      record: data
    })

  } catch (error: any) {
    console.error('[API /balance-history] POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}
