'use client';

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app/layout/sidebar';
import { AppHeader } from '@/components/app/layout/header';
import { LoadingOverlay } from '@/components/ui/loading-overlay';
import { useRequireAuth } from '@/hooks/use-require-auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <AppHeader />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}
