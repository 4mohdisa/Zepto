"use client"

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus, Menu } from 'lucide-react'
import { DateRangePickerWithRange } from '@/components/app/date-range-picker'
import { DateRange } from 'react-day-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { startOfMonth, endOfMonth } from 'date-fns'

interface AppHeaderProps {
  onAddTransaction?: () => void;
  onAddRecurringTransaction?: () => void;
  onDateRangeChange?: (range: DateRange | undefined) => void;
  dateRange?: DateRange | null;
}

export function AppHeader({
  onAddTransaction,
  onAddRecurringTransaction,
  onDateRangeChange,
  dateRange
}: AppHeaderProps = {}) {
  const pathname = usePathname()
  
  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname === '/transactions') return 'Transactions'
    if (pathname === '/recurring-transactions') return 'Recurring Transactions'
    if (pathname === '/categories') return 'Categories'
    if (pathname === '/settings') return 'Settings'
    return 'Ledgerly'
  }
  
  // Determine if we should show transactions actions
  const showTransactionsActions = pathname === '/transactions' && onAddTransaction && onDateRangeChange;
  
  // Determine if we should show recurring transactions actions
  const showRecurringActions = pathname === '/recurring-transactions' && onAddRecurringTransaction;

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear">
      <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
        <div className="flex items-center">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 h-4"
          />
          <h1 className="text-lg font-semibold text-foreground">{getPageTitle()}</h1>
        </div>
        
        {/* Page-specific actions */}
        {showTransactionsActions && (
          <div className="flex flex-col md:flex-row items-end md:items-center gap-4">
            <DateRangePickerWithRange 
              dateRange={dateRange || { from: startOfMonth(new Date()), to: endOfMonth(new Date()) }} 
              onDateRangeChange={onDateRangeChange} 
            />
            <div className="flex gap-4 ml-auto">
              <div className="md:hidden w-full">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="w-full">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={onAddTransaction}>
                      Add Transaction
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="hidden md:flex gap-4">
                <Button onClick={onAddTransaction}>
                  <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {showRecurringActions && (
          <div className="flex items-center gap-4">
            <div className="md:hidden w-full">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="w-full">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={onAddRecurringTransaction}>
                    Add Recurring Transaction
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="hidden md:flex gap-4">
              <Button onClick={onAddRecurringTransaction}>
                <Plus className="mr-2 h-4 w-4" /> Add Recurring Transaction
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}