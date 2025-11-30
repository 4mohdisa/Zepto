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
    if (pathname === '/recurring-transactions') return 'Recurring Transactions'
    if (pathname === '/categories') return 'Categories'
    if (pathname === '/settings') return 'Settings'
    return 'Zepto'
  }
  
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-gray-200 bg-white transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 hover:bg-gray-50 transition-colors" />
        <Separator
          orientation="vertical"
          className="mx-2 h-4 bg-gray-200"
        />
        <h1 className="text-lg font-bold text-gray-900">{getPageTitle()}</h1>
      </div>
    </header>
  )
}