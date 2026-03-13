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
    const { name, amount, date, type, account_type, category_id, merchant_id, description } = body

    // Validation
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required', code: 'VALIDATION_ERROR' }, { status: 400 })
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0', code: 'VALIDATION_ERROR' }, { status: 400 })
    }
    if (!date || typeof date !== 'string') {
      return NextResponse.json({ error: 'Date is required', code: 'VALIDATION_ERROR' }, { status: 400 })
    }
    if (!type || !['Income', 'Expense'].includes(type)) {
      return NextResponse.json({ error: 'Type must be Income or Expense', code: 'VALIDATION_ERROR' }, { status: 400 })
    }
    if (!account_type || typeof account_type !== 'string') {
      return NextResponse.json({ error: 'Account is required', code: 'VALIDATION_ERROR' }, { status: 400 })
    }
    if (!category_id || typeof category_id !== 'number') {
      return NextResponse.json({ error: 'Category is required', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get category name
    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', category_id)
      .single()

    // Validate merchant_id if provided
    if (merchant_id) {
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id')
        .eq('id', merchant_id)
        .eq('user_id', userId)
        .single()
      
      if (merchantError || !merchant) {
        return NextResponse.json({ 
          error: 'Invalid merchant ID or merchant does not belong to user', 
          code: 'VALIDATION_ERROR' 
        }, { status: 400 })
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        name,
        amount,
        type,
        account_type,
        category_id,
        category_name: category?.name || 'Uncategorized',
        merchant_id: merchant_id || null,
        date,
        description: description || '',
        recurring_frequency: 'Never',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error('Create transaction error:', error)
      return NextResponse.json({ error: 'Failed to create transaction', code: 'CREATE_ERROR', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json({ error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
