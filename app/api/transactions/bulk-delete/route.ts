import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { transactionIds } = body

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid transaction IDs', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Delete only transactions that belong to the current user
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('user_id', userId)
      .in('id', transactionIds)

    if (error) {
      console.error('Bulk delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete transactions', code: 'DELETE_ERROR', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      deletedCount: transactionIds.length,
    })

  } catch (error) {
    console.error('Bulk delete API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
