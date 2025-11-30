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
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 md:mb-8 gap-4 lg:gap-6">
      {/* Title Section */}
      <div className="space-y-1 w-full lg:w-auto">
        <h1 className="text-3xl sm:text-4xl lg:text-4xl xl:text-5xl font-bold text-foreground">
          Hi, <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#635BFF] to-blue-600">{userName}</span>
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">Welcome back! Here&apos;s your financial overview.</p>
      </div>
      
      {/* Actions Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
        {/* Month Picker */}
        <div className="w-full sm:w-auto">
          <MonthPicker
            date={selectedDate}
            onDateChange={onDateChange} 
          />
        </div>
        
        {/* Mobile Action Menu */}
        <div className="sm:hidden w-full">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full h-10 border-gray-200 hover:bg-gray-50 justify-between">
                <span className="flex items-center">
                  <Menu className="mr-2 h-4 w-4" />
                  Quick Actions
                </span>
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-gray-200 bg-white">
              <DropdownMenuItem onSelect={onAddTransaction} className="hover:bg-gray-50 cursor-pointer">
                <Plus className="mr-2 h-4 w-4 text-[#635BFF]" />
                Add Transaction
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onUploadFile} className="hover:bg-gray-50 cursor-pointer">
                <Upload className="mr-2 h-4 w-4 text-blue-600" />
                Upload File
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={onAddBalance} className="hover:bg-gray-50 cursor-pointer">
                <Plus className="mr-2 h-4 w-4 text-green-600" />
                Add Balance
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Tablet/Desktop Action Buttons */}
        <div className="hidden sm:flex gap-2 lg:gap-3 flex-wrap">
          <Button 
            onClick={onAddTransaction}
            size="default"
            className="bg-[#635BFF] hover:bg-[#5851EA] text-white shadow-md hover:shadow-lg transition-all whitespace-nowrap flex-shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden lg:inline">Add Transaction</span>
            <span className="lg:hidden">Add</span>
          </Button>
          <Button 
            onClick={onUploadFile} 
            variant="outline" 
            size="default"
            className="border-gray-200 hover:bg-gray-50 shadow-sm hover:shadow transition-all whitespace-nowrap flex-shrink-0"
          >
            <Upload className="mr-2 h-4 w-4" /> 
            <span className="hidden xl:inline">Upload File</span>
            <span className="xl:hidden">Upload</span>
          </Button>
          <Button 
            onClick={onAddBalance} 
            variant="secondary" 
            size="default"
            className="bg-gray-100 hover:bg-gray-200 shadow-sm hover:shadow transition-all whitespace-nowrap flex-shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" /> 
            <span className="hidden xl:inline">Add Balance</span>
            <span className="xl:hidden">Balance</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
