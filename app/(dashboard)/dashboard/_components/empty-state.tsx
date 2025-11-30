'use client'

import { Button } from "@/components/ui/button"
import { PieChart, Plus } from 'lucide-react'

interface EmptyStateProps {
  onAddTransaction: () => void
}

export function EmptyState({ onAddTransaction }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center justify-center py-16 md:py-20 lg:py-24 px-4 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
      {/* Icon Container */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-6 shadow-lg relative overflow-hidden bg-gradient-to-br from-[#635BFF]/10 to-blue-500/10">
        <div className="absolute inset-0 border-2 border-[#635BFF]/20 rounded-full"></div>
        <PieChart className="w-10 h-10 sm:w-12 sm:h-12 text-[#635BFF] relative z-10" />
      </div>

      {/* Title */}
      <h3 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">No Transactions Yet</h3>
      
      {/* Description */}
      <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-8 md:mb-10 max-w-md leading-relaxed">
        Start by adding your first transaction to see beautiful charts and insights about your finances.
      </p>
      
      {/* CTA Button */}
      <Button 
        onClick={onAddTransaction}
        size="lg"
        className="bg-[#635BFF] hover:bg-[#5851EA] text-white shadow-lg hover:shadow-xl transition-all text-sm sm:text-base px-6 sm:px-8 py-5 sm:py-6"
      >
        <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
        Add Your First Transaction
      </Button>
    </section>
  )
}
