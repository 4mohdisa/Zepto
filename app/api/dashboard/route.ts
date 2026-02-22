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

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch account balances
    const { data: balancesData, error: balancesError } = await supabase
      .from('account_balances')
      .select('*')
      .eq('user_id', userId)

    if (balancesError) throw balancesError

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

    if (transactionsError) throw transactionsError

    // Calculate total balance (from all accounts)
    const totalBalance = (balancesData || []).reduce(
      (sum, b) => sum + Number(b.current_balance || 0),
      0
    )

    const balancesByAccount = (balancesData || []).map(b => ({
      account_type: b.account_type,
      current_balance: Number(b.current_balance || 0),
    }))

    // Calculate KPIs from transactions
    const income = (transactionsData || [])
      .filter((t: any) => t.type === 'Income')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

    const expenses = (transactionsData || [])
      .filter((t: any) => t.type === 'Expense')
      .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)

    const netBalance = income - expenses
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0

    // Build daily series
    const daysInMonth = endDate.getDate()
    const dailySeries = []
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      const dayTransactions = (transactionsData || []).filter((t: any) => t.date === dateStr)
      
      const dayIncome = dayTransactions
        .filter((t: any) => t.type === 'Income')
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
      
      const dayExpense = dayTransactions
        .filter((t: any) => t.type === 'Expense')
        .reduce((sum: number, t: any) => sum + Number(t.amount || 0), 0)
      
      dailySeries.push({
        date: dateStr,
        income: dayIncome,
        expense: dayExpense,
      })
    }

    // Build category distribution
    const categoryMap = new Map<string, number>()
    
    ;(transactionsData || [])
      .filter((t: any) => t.type === 'Expense')
      .forEach((t: any) => {
        const categoryName = t.categories?.name || t.category_name || 'Uncategorized'
        const current = categoryMap.get(categoryName) || 0
        categoryMap.set(categoryName, current + Number(t.amount || 0))
      })

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
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
