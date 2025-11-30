import { CreditCard, LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  className?: string
}

export function EmptyState({ 
  icon: Icon = CreditCard, 
  title = "No data yet",
  description,
  className = "h-full"
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div 
        className="rounded-full w-16 h-16 mb-4 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, rgba(76, 126, 243, 0.1) 0%, rgba(109, 76, 255, 0.1) 100%)' }}
      >
        <Icon className="h-8 w-8 text-primary" />
      </div>
      <p className="text-muted-foreground font-medium">{title}</p>
      {description && (
        <p className="text-muted-foreground/70 text-sm mt-1 text-center max-w-xs">{description}</p>
      )}
    </div>
  )
}
