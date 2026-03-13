import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { Report, CreateReportInput, ReportSnapshot, ReportSummary, ReportInsight, MonthComparison } from '@/types/report'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getServiceClient() {
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  })
}

// GET /api/reports - List all reports for user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')

    const supabase = getServiceClient()

    let query = supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) {
      console.error('[API /reports] Query error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports', code: 'QUERY_ERROR', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ reports: data || [] })
  } catch (error: any) {
    console.error('[API /reports] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error?.message },
      { status: 500 }
    )
  }
}

// POST /api/reports - Create and generate a new report
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', code: 'AUTH_MISSING' },
        { status: 401 }
      )
    }

    const body: CreateReportInput = await request.json()
    const { periodType, dateFrom, dateTo, filters = {}, name } = body

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Date range is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = getServiceClient()

    // Generate default name if not provided
    const periodLabel = formatPeriodLabel(dateFrom, dateTo, periodType)
    const reportName = name?.trim() || `${periodLabel} Financial Summary`

    // Create report record with pending status
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        name: reportName,
        report_type: 'financial_summary',
        status: 'pending',
        period_type: periodType || 'month',
        date_from: dateFrom,
        date_to: dateTo,
        filters_json: filters,
        summary_json: {},
        snapshot_json: {},
        insights_json: [],
      })
      .select()
      .single()

    if (insertError || !report) {
      console.error('[API /reports] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create report', code: 'INSERT_ERROR', details: insertError?.message },
        { status: 500 }
      )
    }

    // Generate the report data
    try {
      const snapshot = await generateReportSnapshot(userId, dateFrom, dateTo, filters)
      const summary = extractSummary(snapshot)
      const insights = generateInsights(snapshot)

      // Update report with completed data
      const { data: updatedReport, error: updateError } = await supabase
        .from('reports')
        .update({
          status: 'completed',
          summary_json: summary,
          snapshot_json: snapshot,
          insights_json: insights,
          generated_at: new Date().toISOString(),
        })
        .eq('id', report.id)
        .eq('user_id', userId)
        .select()
        .single()

      if (updateError) {
        console.error('[API /reports] Update error:', updateError)
        // Update status to failed
        await supabase
          .from('reports')
          .update({ status: 'failed' })
          .eq('id', report.id)
          .eq('user_id', userId)
        
        return NextResponse.json(
          { error: 'Failed to generate report', code: 'GENERATION_ERROR', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({ report: updatedReport, success: true }, { status: 201 })
    } catch (genError: any) {
      console.error('[API /reports] Generation error:', genError)
      // Update status to failed
      await supabase
        .from('reports')
        .update({ status: 'failed' })
        .eq('id', report.id)
        .eq('user_id', userId)

      return NextResponse.json(
        { error: 'Failed to generate report', code: 'GENERATION_ERROR', details: genError?.message },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[API /reports] Unhandled error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR', details: error?.message },
      { status: 500 }
    )
  }
}

// Helper: Format period label
function formatPeriodLabel(dateFrom: string, dateTo: string, periodType?: string): string {
  const from = new Date(dateFrom)
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  
  if (periodType === 'year') {
    return from.getFullYear().toString()
  }
  
  return `${monthNames[from.getMonth()]} ${from.getFullYear()}`
}

// Helper: Generate report snapshot
async function generateReportSnapshot(
  userId: string,
  dateFrom: string,
  dateTo: string,
  filters: any
): Promise<ReportSnapshot> {
  const supabase = getServiceClient()

  // Fetch account balances
  const { data: balancesData } = await supabase
    .from('account_balances')
    .select('*')
    .eq('user_id', userId)

  // Fetch transactions for the period (without merchants join - not in schema)
  let transactionsQuery = supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .gte('date', dateFrom)
    .lte('date', dateTo)

  if (filters.accountType && filters.accountType !== 'all') {
    transactionsQuery = transactionsQuery.eq('account_type', filters.accountType)
  }

  const { data: transactionsData } = await transactionsQuery

  // Fetch merchants separately for lookup
  const { data: merchantsData } = await supabase
    .from('merchants')
    .select('id, merchant_name, normalized_name')
    .eq('user_id', userId)

  // Create merchant lookup map by normalized name
  const merchantLookup = new Map<string, { id: string; name: string }>()
  for (const m of (merchantsData || [])) {
    merchantLookup.set(m.normalized_name.toLowerCase(), { id: m.id, name: m.merchant_name })
    merchantLookup.set(m.merchant_name.toLowerCase(), { id: m.id, name: m.merchant_name })
  }

  // Fetch recurring transactions
  const { data: recurringData } = await supabase
    .from('recurring_transactions')
    .select('*')
    .eq('user_id', userId)

  // Calculate previous period for comparison
  const fromDate = new Date(dateFrom)
  const toDate = new Date(dateTo)
  const periodDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
  
  const prevFromDate = new Date(fromDate)
  prevFromDate.setDate(prevFromDate.getDate() - periodDays - 1)
  const prevToDate = new Date(fromDate)
  prevToDate.setDate(prevToDate.getDate() - 1)

  const prevFromStr = prevFromDate.toISOString().split('T')[0]
  const prevToStr = prevToDate.toISOString().split('T')[0]

  // Fetch previous period transactions
  const { data: prevTransactionsData } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', prevFromStr)
    .lte('date', prevToStr)

  // Calculate current period metrics
  let income = 0
  let expenses = 0
  const categoryMap = new Map<string, number>()
  const merchantMap = new Map<string, { id: string | null; name: string; total: number; count: number }>()
  const expensesList: any[] = []
  const allTransactions: any[] = []

  for (const t of (transactionsData || [])) {
    const amount = Number(t.amount || 0)
    const type = t.type

    if (type === 'Income') {
      income += amount
    } else if (type === 'Expense') {
      expenses += amount
      expensesList.push(t)

      // Category aggregation
      const catName = t.categories?.name || t.category_name || 'Uncategorized'
      categoryMap.set(catName, (categoryMap.get(catName) || 0) + amount)

      // Merchant aggregation - use merchant_name or name as fallback
      const merchantName = t.merchant_name || t.name || 'Unknown'
      const normalizedKey = merchantName.toLowerCase().trim()
      
      // Try to find merchant ID from lookup
      const merchantInfo = merchantLookup.get(normalizedKey)
      
      const existing = merchantMap.get(normalizedKey)
      if (existing) {
        existing.total += amount
        existing.count += 1
      } else {
        merchantMap.set(normalizedKey, {
          id: merchantInfo?.id || null,
          name: merchantInfo?.name || merchantName,
          total: amount,
          count: 1
        })
      }
    }

    allTransactions.push(t)
  }

  // Calculate previous period metrics
  let prevIncome = 0
  let prevExpenses = 0
  for (const t of (prevTransactionsData || [])) {
    const amount = Number(t.amount || 0)
    if (t.type === 'Income') prevIncome += amount
    else if (t.type === 'Expense') prevExpenses += amount
  }

  const netBalance = income - expenses
  const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
  const totalBalance = (balancesData || []).reduce((sum, b) => sum + Number(b.current_balance || 0), 0)

  // Build comparison
  const comparison: MonthComparison = {
    currentIncome: income,
    previousIncome: prevIncome,
    incomeChange: income - prevIncome,
    incomeChangePercent: prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0,
    currentExpenses: expenses,
    previousExpenses: prevExpenses,
    expensesChange: expenses - prevExpenses,
    expensesChangePercent: prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0,
    currentNetBalance: netBalance,
    previousNetBalance: prevIncome - prevExpenses,
    netBalanceChange: netBalance - (prevIncome - prevExpenses),
    netBalanceChangePercent: (prevIncome - prevExpenses) !== 0 ? ((netBalance - (prevIncome - prevExpenses)) / Math.abs(prevIncome - prevExpenses)) * 100 : 0,
  }

  // Build snapshot
  const snapshot: ReportSnapshot = {
    period: `${dateFrom}_${dateTo}`,
    periodLabel: formatPeriodLabel(dateFrom, dateTo),
    dateFrom,
    dateTo,
    summary: {
      income,
      expenses,
      netBalance,
      savingsRate: Math.max(0, savingsRate),
      totalBalance,
      transactionCount: transactionsData?.length || 0,
    },
    balancesByAccount: (balancesData || []).map(b => ({
      account_type: b.account_type,
      current_balance: Number(b.current_balance || 0),
    })),
    topCategories: Array.from(categoryMap.entries())
      .map(([name, total]) => ({ name, total, percentage: expenses > 0 ? (total / expenses) * 100 : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10),
    topMerchants: Array.from(merchantMap.values())
      .map(m => ({ 
        id: m.id || `temp-${m.name}`,
        name: m.name, 
        total: m.total, 
        transactionCount: m.count,
        percentage: expenses > 0 ? (m.total / expenses) * 100 : 0 
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10),
    recurringCommitments: (recurringData || [])
      .filter(r => r.type === 'Expense')
      .map(r => ({
        id: r.id,
        name: r.name,
        amount: r.amount,
        frequency: r.frequency,
        type: r.type,
      }))
      .slice(0, 10),
    largestExpenses: expensesList
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        date: t.date,
        type: t.type,
        category_name: t.categories?.name || t.category_name,
      })),
    largestTransactions: allTransactions
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        name: t.name,
        amount: t.amount,
        date: t.date,
        type: t.type,
        category_name: t.categories?.name || t.category_name,
      })),
    comparison,
    insights: [],
    generatedAt: new Date().toISOString(),
  }

  return snapshot
}

// Helper: Extract summary from snapshot
function extractSummary(snapshot: ReportSnapshot): ReportSummary {
  return snapshot.summary
}

// Helper: Generate insights
function generateInsights(snapshot: ReportSnapshot): ReportInsight[] {
  const insights: ReportInsight[] = []
  const { summary, comparison, topCategories, recurringCommitments } = snapshot

  // Spending trend insight
  if (comparison) {
    if (comparison.expensesChange > 0) {
      insights.push({
        type: 'warning',
        title: 'Spending Increased',
        description: `Your expenses increased by ${formatCurrency(comparison.expensesChange)} (${comparison.expensesChangePercent.toFixed(1)}%) compared to last month.`,
      })
    } else if (comparison.expensesChange < 0) {
      insights.push({
        type: 'positive',
        title: 'Spending Decreased',
        description: `Great job! Your expenses decreased by ${formatCurrency(Math.abs(comparison.expensesChange))} (${Math.abs(comparison.expensesChangePercent).toFixed(1)}%) compared to last month.`,
      })
    }

    // Income trend
    if (comparison.incomeChange > 0) {
      insights.push({
        type: 'positive',
        title: 'Income Increased',
        description: `Your income increased by ${formatCurrency(comparison.incomeChange)} (${comparison.incomeChangePercent.toFixed(1)}%) compared to last month.`,
      })
    } else if (comparison.incomeChange < 0) {
      insights.push({
        type: 'warning',
        title: 'Income Decreased',
        description: `Your income decreased by ${formatCurrency(Math.abs(comparison.incomeChange))} (${Math.abs(comparison.incomeChangePercent).toFixed(1)}%) compared to last month.`,
      })
    }
  }

  // Savings rate insight
  if (summary.savingsRate > 20) {
    insights.push({
      type: 'positive',
      title: 'Excellent Savings Rate',
      description: `You're saving ${summary.savingsRate.toFixed(1)}% of your income. Keep up the great work!`,
    })
  } else if (summary.savingsRate < 0) {
    insights.push({
      type: 'negative',
      title: 'Spending Exceeds Income',
      description: `Your expenses exceeded your income by ${formatCurrency(Math.abs(summary.netBalance))}. Consider reviewing your budget.`,
    })
  }

  // Top category insight
  if (topCategories.length > 0 && topCategories[0].total > 0) {
    const topCat = topCategories[0]
    insights.push({
      type: 'neutral',
      title: 'Top Spending Category',
      description: `${topCat.name} was your biggest expense at ${formatCurrency(topCat.total)} (${topCat.percentage?.toFixed(1)}% of total).`,
    })
  }

  // Recurring commitments insight
  if (recurringCommitments.length > 0) {
    const recurringTotal = recurringCommitments.reduce((sum, r) => sum + r.amount, 0)
    const recurringPercent = summary.expenses > 0 ? (recurringTotal / summary.expenses) * 100 : 0
    
    if (recurringPercent > 50) {
      insights.push({
        type: 'warning',
        title: 'High Recurring Expenses',
        description: `Recurring payments make up ${recurringPercent.toFixed(1)}% of your total expenses (${formatCurrency(recurringTotal)}).`,
      })
    } else {
      insights.push({
        type: 'neutral',
        title: 'Recurring Commitments',
        description: `You have ${recurringCommitments.length} recurring payments totaling ${formatCurrency(recurringTotal)} per cycle.`,
      })
    }
  }

  // No data insight
  if (summary.transactionCount === 0) {
    insights.push({
      type: 'neutral',
      title: 'No Transactions',
      description: 'No transactions were recorded for this period. Add transactions to see detailed insights.',
    })
  }

  return insights
}

// Helper: Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
