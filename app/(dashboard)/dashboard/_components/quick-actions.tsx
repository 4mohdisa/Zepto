"use client"

import { Button } from "@/components/ui/button"
import { Plus, Upload, Wallet } from 'lucide-react'
import { MonthPicker } from '@/components/app/shared/month-picker'

interface QuickActionsProps {
  onAddTransaction: () => void
  onUploadFile: () => void
  onAddBalance: () => void
  selectedDate: Date
  onDateChange: (date: Date) => void
}

export function QuickActions({
  onAddTransaction,
  onUploadFile,
  onAddBalance,
  selectedDate,
  onDateChange,
}: QuickActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-5 border-b border-gray-200">
      <MonthPicker date={selectedDate} onDateChange={onDateChange} />
      
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          onClick={onUploadFile}
          variant="outline"
          size="sm"
          className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <Upload className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Upload</span>
        </Button>
        <Button
          onClick={onAddBalance}
          variant="outline"
          size="sm"
          className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <Wallet className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Balance</span>
        </Button>
        <Button
          onClick={onAddTransaction}
          size="sm"
          className="bg-[#635BFF] hover:bg-[#5851EA] text-white shadow-sm transition-all"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add transaction
        </Button>
      </div>
    </div>
  )
}
