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

    // Build query
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

    // Type order
    if (typeOrder === 'expense_first') {
      query = query.order('type', { ascending: true }) // Expense before Income
    } else if (typeOrder === 'income_first') {
      query = query.order('type', { ascending: false }) // Income before Expense
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

    return NextResponse.json({
      rows: dataRows || [],
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
