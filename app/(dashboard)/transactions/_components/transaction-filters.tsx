'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowUpDown, Search } from 'lucide-react'
import { categories } from '@/data/categories'

interface TransactionFiltersProps {
  dateFrom: string
  dateTo: string
  search: string
  categoryId: string
  typeOrder: 'default' | 'expense_first' | 'income_first'
  onDateFromChange: (date: string) => void
  onDateToChange: (date: string) => void
  onSearchChange: (search: string) => void
  onCategoryIdChange: (id: string) => void
  onTypeOrderChange: (order: 'default' | 'expense_first' | 'income_first') => void
}

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
  // Validate date range
  const isDateRangeInvalid = dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: Search and Category */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select
          value={categoryId}
          onValueChange={onCategoryIdChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bottom row: Date range and Type sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className="w-[140px]"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className="w-[140px]"
          />
        </div>

        {isDateRangeInvalid && (
          <span className="text-sm text-red-500">
            Start date must be before end date
          </span>
        )}

        <div className="flex items-center gap-2 sm:ml-auto">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (typeOrder === 'default') {
                onTypeOrderChange('expense_first')
              } else if (typeOrder === 'expense_first') {
                onTypeOrderChange('income_first')
              } else {
                onTypeOrderChange('default')
              }
            }}
            className="gap-1"
          >
            <ArrowUpDown className="h-3 w-3" />
            {typeOrder === 'default' && 'Date'}
            {typeOrder === 'expense_first' && 'Expenses First'}
            {typeOrder === 'income_first' && 'Income First'}
          </Button>
        </div>
      </div>
    </div>
  )
}
