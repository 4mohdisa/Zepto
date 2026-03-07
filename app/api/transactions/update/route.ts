import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_MISSING' }, { status: 401 })
    }

    const body = await request.json()
    const { transactionId, name, amount, date, type, account_type, category_id, description } = body

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID is required', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (name !== undefined) updateData.name = name
    if (amount !== undefined) updateData.amount = amount
    if (date !== undefined) updateData.date = date
    if (type !== undefined) updateData.type = type
    if (account_type !== undefined) updateData.account_type = account_type
    if (description !== undefined) updateData.description = description

    // Handle category update
    if (category_id !== undefined) {
      updateData.category_id = category_id
      
      // Get category name
      const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('id', category_id)
        .single()
      
      updateData.category_name = category?.name || 'Uncategorized'
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update transaction error:', error)
      return NextResponse.json({ error: 'Failed to update transaction', code: 'UPDATE_ERROR', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
