import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')
    const categoryId = searchParams.get('categoryId')
    const typeOrder = searchParams.get('typeOrder') // 'expense_first' | 'income_first'
    const limit = parseInt(searchParams.get('limit') || '50')
    const cursor = searchParams.get('cursor')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Build query - join with categories only (merchant_id FK may not exist)
    let query = supabase
      .from('transactions')
      .select(`
        *,
        categories (id, name)
      `)
      .eq('user_id', userId)

    // Date range filter (inclusive)
    if (dateFrom) {
      const fromDate = new Date(dateFrom)
      fromDate.setHours(0, 0, 0, 0)
      query = query.gte('date', fromDate.toISOString().split('T')[0])
    }

    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      query = query.lte('date', toDate.toISOString().split('T')[0])
    }

    // Category filter
    if (categoryId && categoryId !== 'all') {
      query = query.eq('category_id', categoryId)
    }

    // Search filter (name or description)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Sort order
    if (typeOrder === 'expense_first') {
      query = query.order('type', { ascending: true }) // Expense before Income
    } else if (typeOrder === 'income_first') {
      query = query.order('type', { ascending: false }) // Income before Expense
    } else if (typeOrder === 'amount_high') {
      query = query.order('amount', { ascending: false })
    } else if (typeOrder === 'amount_low') {
      query = query.order('amount', { ascending: true })
    }

    // Default ordering by date desc, then id desc
    query = query.order('date', { ascending: false })
    query = query.order('id', { ascending: false })

    // Cursor pagination
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split('_')
      query = query.or(`date.lt.${cursorDate},and(date.eq.${cursorDate},id.lt.${cursorId})`)
    }

    // Limit + 1 to check if there's a next page
    query = query.limit(limit + 1)

    const { data: rows, error } = await query

    if (error) {
      console.error('Transactions fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transactions' },
        { status: 500 }
      )
    }

    // Check if there's a next page
    const hasNextPage = rows && rows.length > limit
    const dataRows = hasNextPage ? rows.slice(0, limit) : rows

    // Generate next cursor
    let nextCursor = null
    if (hasNextPage && dataRows.length > 0) {
      const lastRow = dataRows[dataRows.length - 1]
      nextCursor = `${lastRow.date}_${lastRow.id}`
    }

    // Fetch merchants separately for lookup by name (since merchant_id FK may not be reliable)
    const { data: merchantsData } = await supabase
      .from('merchants')
      .select('id, merchant_name, normalized_name')
      .eq('user_id', userId)

    // Create merchant lookup map
    const merchantLookup = new Map<string, { id: string; merchant_name: string }>()
    for (const m of (merchantsData || [])) {
      merchantLookup.set(m.merchant_name.toLowerCase(), { id: m.id, merchant_name: m.merchant_name })
      merchantLookup.set(m.normalized_name.toLowerCase(), { id: m.id, merchant_name: m.merchant_name })
    }

    // Enhance rows with merchant data based on name matching
    const enhancedRows = (dataRows || []).map((row: any) => {
      // Try to find merchant by transaction name
      const nameKey = row.name?.toLowerCase()
      const merchant = nameKey ? merchantLookup.get(nameKey) : null

      return {
        ...row,
        // Ensure merchants object exists for table display
        merchants: row.merchant_id && merchant ? merchant : merchant || null,
      }
    })

    return NextResponse.json({
      rows: enhancedRows,
      nextCursor,
      hasNextPage,
    })

  } catch (error) {
    console.error('Transactions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // If category_id is being updated, also fetch and update category_name
    if (updateData.category_id !== undefined) {
      const { data: category } = await supabase
        .from('categories')
        .select('name')
        .eq('id', updateData.category_id)
        .single()
      
      if (category) {
        updateData.category_name = category.name
      }
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Transaction update error:', error)
      return NextResponse.json(
        { error: 'Failed to update transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Transaction PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
