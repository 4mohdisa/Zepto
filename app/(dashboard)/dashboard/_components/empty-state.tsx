'use client'

import { Button } from "@/components/ui/button"
import { PieChart, Plus } from 'lucide-react'

interface EmptyStateProps {
  onAddTransaction: () => void
}

export function EmptyState({ onAddTransaction }: EmptyStateProps) {
  return (
    <section className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-xl relative overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(76, 126, 243, 0.1) 0%, rgba(109, 76, 255, 0.1) 100%)' }}>
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
        <PieChart className="w-12 h-12 text-primary relative z-10" />
      </div>
      <h3 className="text-3xl font-bold mb-3 text-foreground">No Transactions Yet</h3>
      <p className="text-muted-foreground mb-10 max-w-md leading-relaxed text-lg">
        Start by adding your first transaction to see beautiful charts and insights about your finances.
      </p>
      <Button 
        onClick={onAddTransaction}
        size="lg"
        className="gradient-primary hover:gradient-primary-hover shadow-xl transition-all text-base px-8 py-6"
      >
        <Plus className="mr-2 h-5 w-5" />
        Add Your First Transaction
      </Button>
    </section>
  )
}
