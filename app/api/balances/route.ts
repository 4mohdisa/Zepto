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

// GET /api/balances - Get all account balances for user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const supabase = getServiceClient()

    // Check if table exists first
    const { data: tableCheck, error: tableError } = await supabase
      .from('account_balances')
      .select('id')
      .limit(1)

    if (tableError) {
      const pgError = tableError as any
      const errorCode = pgError?.code || ''
      const errorMessage = pgError?.message || ''

      if (errorCode === '42P01' || errorMessage.includes('does not exist')) {
        return NextResponse.json({
          error: 'Account balances table does not exist',
          code: 'TABLE_MISSING',
        }, { status: 404 })
      }

      return NextResponse.json({
        error: 'Database query failed',
        code: 'QUERY_ERROR',
        details: errorMessage,
      }, { status: 500 })
    }

    // Fetch balances
    const { data, error } = await supabase
      .from('account_balances')
      .select('*')
      .eq('user_id', userId)
      .order('account_type')

    if (error) {
      console.error('[API /balances] Query error:', error)
      return NextResponse.json({
        error: 'Failed to fetch balances',
        code: 'QUERY_ERROR',
        details: error.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      balances: data || [],
    })

  } catch (error: any) {
    console.error('[API /balances] Unhandled error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// POST /api/balances - Create or update an account balance
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
    const { account_type, current_balance, note } = body

    if (!account_type || typeof current_balance !== 'number') {
      return NextResponse.json({
        error: 'Missing required fields: account_type, current_balance',
        code: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Check if table exists first
    const { error: tableError } = await supabase
      .from('account_balances')
      .select('id')
      .limit(1)

    if (tableError) {
      const pgError = tableError as any
      if (pgError?.code === '42P01' || pgError?.message?.includes('does not exist')) {
        return NextResponse.json({
          error: 'Account balances table does not exist',
          code: 'TABLE_MISSING',
        }, { status: 404 })
      }
    }

    // Upsert the balance (no effective_date - that's tracked in history)
    const { data, error } = await supabase
      .from('account_balances')
      .upsert({
        user_id: userId,
        account_type,
        current_balance,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: 'user_id,account_type',
      })
      .select()
      .single()

    if (error) {
      console.error('[API /balances] Upsert error:', error)
      return NextResponse.json({
        error: 'Failed to update balance',
        code: 'UPSERT_ERROR',
        details: error.message,
        pgCode: (error as any)?.code
      }, { status: 500 })
    }

    // Also add to history via the history endpoint logic
    try {
      await supabase
        .from('account_balance_history')
        .insert({
          user_id: userId,
          account_type,
          balance_amount: current_balance,
          note: note || null,
          created_at: new Date().toISOString(),
        })
    } catch (historyError) {
      // Non-critical - log but don't fail the main operation
      console.warn('[API /balances] Failed to add history record:', historyError)
    }

    return NextResponse.json({
      success: true,
      balance: data
    })

  } catch (error: any) {
    console.error('[API /balances] POST error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}

// DELETE /api/balances?id={id} - Delete a balance
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
      return NextResponse.json({
        error: 'Missing required parameter: id',
        code: 'VALIDATION_ERROR'
      }, { status: 400 })
    }

    const supabase = getServiceClient()

    const { error } = await supabase
      .from('account_balances')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('[API /balances] Delete error:', error)
      return NextResponse.json({
        error: 'Failed to delete balance',
        code: 'DELETE_ERROR',
        details: error.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true
    })

  } catch (error: any) {
    console.error('[API /balances] DELETE error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}
