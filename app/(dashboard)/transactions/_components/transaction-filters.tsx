'use client'

import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CategoryCombobox } from '@/components/ui/category-combobox'
import { DateRangePicker } from '@/components/ui/date-picker'
import { Search } from 'lucide-react'
import { useCategories } from '@/hooks/use-categories'
import { cn } from '@/lib/utils'

interface TransactionFiltersProps {
  dateFrom: string
  dateTo: string
  search: string
  categoryId: string
  typeOrder: 'default' | 'expense_first' | 'income_first' | 'amount_high' | 'amount_low'
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onSearchChange: (search: string) => void
  onCategoryIdChange: (id: string) => void
  onTypeOrderChange: (order: 'default' | 'expense_first' | 'income_first' | 'amount_high' | 'amount_low') => void
}

// Shared input styles for consistent white surfaces
const inputBaseStyles = "bg-white border-gray-200 shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
const selectTriggerStyles = "bg-white border-gray-200 shadow-sm hover:border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"

export function TransactionFilters({
  dateFrom,
  dateTo,
  search,
  categoryId,
  typeOrder,
  onDateFromChange,
  onDateToChange,
  onSearchChange,
  onCategoryIdChange,
  onTypeOrderChange,
}: TransactionFiltersProps) {
  // Fetch real categories from the database
  const { categories, loading: categoriesLoading } = useCategories()
  
  // Validate date range
  const isDateRangeInvalid = dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Top row: Search and Category */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              "pl-9 h-9 sm:h-10",
              inputBaseStyles
            )}
          />
        </div>
        
        <CategoryCombobox
          options={categories}
          value={categoryId}
          onChange={onCategoryIdChange}
          placeholder="All Categories"
          disabled={categoriesLoading}
          showAllOption={true}
          allOptionLabel="All Categories"
        />
      </div>

      {/* Bottom row: Date range and Type sort */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-center">
        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onFromChange={onDateFromChange}
          onToChange={onDateToChange}
          fromPlaceholder="Start date"
          toPlaceholder="End date"
        />

        {isDateRangeInvalid && (
          <span className="text-xs sm:text-sm text-red-500">
            Start date must be before end date
          </span>
        )}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">Sort:</span>
          <Select
            value={typeOrder}
            onValueChange={(v) => onTypeOrderChange(v as typeof typeOrder)}
          >
            <SelectTrigger 
              className={cn(
                "w-[140px] sm:w-[160px] h-9 sm:h-10 text-xs sm:text-sm",
                selectTriggerStyles
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="default">Date (newest)</SelectItem>
              <SelectItem value="expense_first">Expenses First</SelectItem>
              <SelectItem value="income_first">Income First</SelectItem>
              <SelectItem value="amount_high">Amount (high)</SelectItem>
              <SelectItem value="amount_low">Amount (low)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
