import { useMemo } from 'react'
import { format } from 'date-fns'

interface RawTransaction {
  id?: number
  user_id?: string
  name: string
  amount: number
  type: string
  date: string | Date
  category_name?: string | null
  category_id?: number | null
  description?: string | null
  account_type?: string | null
}

interface ChartTransaction {
  date: string
  amount: number
  type: string
  category_name: string | null
}

interface TableTransaction {
  id: string
  user_id: string
  name: string
  amount: number
  type: 'Income' | 'Expense'
  date: string
  category_name: string | null
  category_id: number | null
  description: string | null
  account_type: string | null
}

interface DashboardData {
  chartTransactions: ChartTransaction[]
  recentTransactions: TableTransaction[]
  hasTransactions: boolean
}

function formatDate(date: string | Date): string {
  if (typeof date === 'string') return date
  return format(date, 'yyyy-MM-dd')
}

export function useDashboardData(transactions: RawTransaction[] | undefined): DashboardData {
  const chartTransactions = useMemo((): ChartTransaction[] => {
    if (!transactions) return []
    
    return transactions.map(t => ({
      date: formatDate(t.date),
      amount: Number(t.amount),
      type: t.type,
      category_name: t.category_name ?? null
    }))
  }, [transactions])

  const recentTransactions = useMemo((): TableTransaction[] => {
    if (!transactions) return []
    
    return transactions.slice(0, 7).map(t => ({
      id: t.id?.toString() || '',
      user_id: t.user_id?.toString() || '',
      name: t.name,
      amount: Number(t.amount),
      type: (t.type === 'Income' ? 'Income' : 'Expense') as 'Income' | 'Expense',
      date: formatDate(t.date),
      category_name: t.category_name ?? null,
      category_id: t.category_id ?? null,
      description: t.description ?? null,
      account_type: t.account_type ?? null
    }))
  }, [transactions])

  const hasTransactions = useMemo(() => {
    return Boolean(transactions && transactions.length > 0)
  }, [transactions])

  return {
    chartTransactions,
    recentTransactions,
    hasTransactions
  }
}
