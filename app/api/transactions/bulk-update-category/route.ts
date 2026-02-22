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
    const { transactionIds, categoryId } = body

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid transaction IDs' },
        { status: 400 }
      )
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Update only transactions that belong to the current user
    const { error } = await supabase
      .from('transactions')
      .update({ 
        category_id: categoryId,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .in('id', transactionIds)

    if (error) {
      console.error('Bulk update category error:', error)
      return NextResponse.json(
        { error: 'Failed to update transactions' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      updatedCount: transactionIds.length,
      success: true,
    })

  } catch (error) {
    console.error('Bulk update category API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
