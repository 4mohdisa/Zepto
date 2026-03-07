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
    const period = searchParams.get('period') // YYYY-MM format
    const account = searchParams.get('account') || 'all'

    // Calculate date range from period
    const now = new Date()
    const year = period ? parseInt(period.split('-')[0]) : now.getFullYear()
    const month = period ? parseInt(period.split('-')[1]) - 1 : now.getMonth()
    
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    const supabase = getServiceClient()

    // Fetch account balances
    const { data: balancesData, error: balancesError } = await supabase
      .from('account_balances')
      .select('*')
      .eq('user_id', userId)

    if (balancesError) {
      console.error('[API /dashboard] Balances query error:', balancesError)
      return NextResponse.json({
        error: 'Failed to fetch account balances',
        code: 'BALANCES_QUERY_ERROR',
        details: balancesError.message,
        pgCode: (balancesError as any)?.code
      }, { status: 500 })
    }

    // Fetch transactions for the period
    let transactionsQuery = supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    if (account !== 'all') {
      transactionsQuery = transactionsQuery.eq('account_type', account)
    }

    const { data: transactionsData, error: transactionsError } = await transactionsQuery

    if (transactionsError) {
      console.error('[API /dashboard] Transactions query error:', transactionsError)
      return NextResponse.json({
        error: 'Failed to fetch transactions',
        code: 'TRANSACTIONS_QUERY_ERROR',
        details: transactionsError.message,
        pgCode: (transactionsError as any)?.code
      }, { status: 500 })
    }

    // Calculate total balance (from all accounts)
    const totalBalance = (balancesData || []).reduce(
      (sum, b) => sum + Number(b.current_balance || 0),
      0
    )

    const balancesByAccount = (balancesData || []).map(b => ({
      account_type: b.account_type,
      current_balance: Number(b.current_balance || 0),
    }))

    // Calculate KPIs from transactions - single pass O(n)
    let income = 0
    let expenses = 0
    const categoryMap = new Map<string, number>()
    
    // Pre-index transactions by date for O(1) lookup
    const transactionsByDate = new Map<string, { income: number; expense: number }>()
    
    for (const t of (transactionsData || [])) {
      const amount = Number(t.amount || 0)
      const type = t.type
      const date = t.date
      
      // Calculate KPIs
      if (type === 'Income') {
        income += amount
      } else if (type === 'Expense') {
        expenses += amount
        
        // Build category distribution
        const categoryName = t.categories?.name || t.category_name || 'Uncategorized'
        const current = categoryMap.get(categoryName) || 0
        categoryMap.set(categoryName, current + amount)
      }
      
      // Index by date for daily series
      if (date) {
        const existing = transactionsByDate.get(date) || { income: 0, expense: 0 }
        if (type === 'Income') {
          existing.income += amount
        } else if (type === 'Expense') {
          existing.expense += amount
        }
        transactionsByDate.set(date, existing)
      }
    }
    
    const netBalance = income - expenses
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0

    // Build daily series - O(days) not O(days × transactions)
    const daysInMonth = endDate.getDate()
    const dailySeries = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayData = transactionsByDate.get(dateStr) || { income: 0, expense: 0 }
      
      dailySeries.push({
        date: dateStr,
        income: dayData.income,
        expense: dayData.expense,
      })
    }

    const categoryDistribution = Array.from(categoryMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)

    return NextResponse.json({
      period: `${year}-${String(month + 1).padStart(2, '0')}`,
      total_balance: totalBalance,
      balances_by_account: balancesByAccount,
      kpis: {
        income,
        expenses,
        net_balance: netBalance,
        savings_rate: Math.max(0, savingsRate),
      },
      daily_series: dailySeries,
      category_distribution: categoryDistribution,
      _meta: {
        duration: Date.now() - startTime,
        transactionCount: transactionsData?.length || 0
      }
    })

  } catch (error: any) {
    console.error('[API /dashboard] Unhandled error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      details: error?.message || String(error)
    }, { status: 500 })
  }
}
