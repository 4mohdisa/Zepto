'use client'

import { Button } from "@/components/ui/button"
import { Upload, Plus, Menu } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MonthPicker } from '@/components/app/shared/month-picker'

interface DashboardHeaderProps {
  userName: string
  selectedDate: Date
  onDateChange: (date: Date) => void
  onAddTransaction: () => void
  onUploadFile: () => void
  onAddBalance: () => void
}

export function DashboardHeader({
  userName,
  selectedDate,
  onDateChange,
  onAddTransaction,
  onUploadFile,
  onAddBalance,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold text-foreground mb-1">
          Hi, <span className="bg-clip-text text-transparent" style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text', backgroundImage: 'linear-gradient(135deg, #4C7EF3 0%, #6D4CFF 100%)' }}>{userName}</span>
        </h1>
        <p className="text-muted-foreground text-base">Welcome back! Here&apos;s your financial overview.</p>
      </div>
      
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full md:w-auto">
        <MonthPicker
          date={selectedDate}
          onDateChange={onDateChange} 
        />
        
        {/* Mobile Action Menu */}
        <div className="md:hidden w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="w-full border-border hover:bg-hover-surface">
                <Menu className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-border bg-popover">
              <DropdownMenuItem onSelect={onAddTransaction} className="hover:bg-hover-surface">
                <Plus className="mr-2 h-4 w-4" />
                Add Transaction
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onUploadFile} className="hover:bg-hover-surface">
                <Upload className="mr-2 h-4 w-4" />
                Upload File
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onAddBalance} className="hover:bg-hover-surface">
                <Plus className="mr-2 h-4 w-4" />
                Add Balance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Desktop Action Buttons */}
        <div className="hidden md:flex gap-3">
          <Button 
            onClick={onAddTransaction}
            className="gradient-primary hover:gradient-primary-hover shadow-lg transition-all"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
          <Button 
            onClick={onUploadFile} 
            variant="outline" 
            className="border-border hover:bg-hover-surface shadow-sm transition-colors"
          >
            <Upload className="mr-2 h-4 w-4" /> 
            Upload File
          </Button>
          <Button 
            onClick={onAddBalance} 
            variant="secondary" 
            className="hover:bg-accent shadow-sm transition-colors"
          >
            <Plus className="mr-2 h-4 w-4" /> 
            Add Balance
          </Button>
        </div>
      </div>
    </div>
  )
}
