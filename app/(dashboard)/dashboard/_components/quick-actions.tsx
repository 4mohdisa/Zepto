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
    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
      <MonthPicker date={selectedDate} onDateChange={onDateChange} />
      
      <div className="flex items-center gap-2">
        <Button
          onClick={onUploadFile}
          variant="outline"
          size="sm"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload
        </Button>
        <Button
          onClick={onAddBalance}
          variant="outline"
          size="sm"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Balance
        </Button>
        <Button
          onClick={onAddTransaction}
          size="sm"
          className="bg-[#635BFF] hover:bg-[#5851EA] text-white"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add transaction
        </Button>
      </div>
    </div>
  )
}
