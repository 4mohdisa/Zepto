"use client"

import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { usePathname } from 'next/navigation'

export function AppHeader() {
  const pathname = usePathname()
  
  // Get page title based on current route
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    if (pathname === '/transactions') return 'Transactions'
    if (pathname === '/recurring-transactions') return 'Recurring'
    return 'Zepto'
  }
  
  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b border-gray-200 bg-white transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4">
        <SidebarTrigger className="hover:bg-gray-100 transition-colors rounded-md -ml-1" />
        <Separator orientation="vertical" className="h-4 bg-gray-300" />
        <span className="text-sm font-medium text-gray-700">{getPageTitle()}</span>
      </div>
    </header>
  )
}
