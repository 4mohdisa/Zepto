'use client';

import { useState, useCallback } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/layout/sidebar';
import { AppHeader } from '@/components/app/layout/header';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useRequireAuth } from '@/hooks/use-require-auth';
import { usePathname } from 'next/navigation';
import { DateRange } from 'react-day-picker';
import { startOfMonth, endOfMonth } from 'date-fns';

interface HeaderActionState {
  isAddTransactionOpen?: boolean;
  isAddRecurringTransactionOpen?: boolean;
  dateRange?: DateRange | null;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoading } = useRequireAuth();
  const [headerState, setHeaderState] = useState<HeaderActionState>({
    isAddTransactionOpen: false,
    isAddRecurringTransactionOpen: false,
    dateRange: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
  });

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    setHeaderState(prev => ({ ...prev, dateRange: range || null }));
    window.dispatchEvent(new CustomEvent('header:daterangechange', { detail: { dateRange: range } }));
  }, []);

  const handleAddTransaction = useCallback(() => {
    setHeaderState(prev => ({ ...prev, isAddTransactionOpen: true }));
    window.dispatchEvent(new CustomEvent('header:addtransaction'));
  }, []);

  const handleAddRecurringTransaction = useCallback(() => {
    setHeaderState(prev => ({ ...prev, isAddRecurringTransactionOpen: true }));
    window.dispatchEvent(new CustomEvent('header:addrecurringtransaction'));
  }, []);

  if (isLoading) {
    return <LoadingOverlay />;
  }

  const getHeaderProps = () => {
    if (pathname === '/transactions') {
      return {
        onAddTransaction: handleAddTransaction,
        onDateRangeChange: handleDateRangeChange,
        dateRange: headerState.dateRange
      };
    }
    
    if (pathname === '/recurring-transactions') {
      return {
        onAddRecurringTransaction: handleAddRecurringTransaction
      };
    }
    
    return {};
  };

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader {...getHeaderProps()} />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
