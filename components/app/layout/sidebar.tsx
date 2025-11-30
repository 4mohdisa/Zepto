"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter,
  SidebarHeader,
  SidebarGroup, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Home, List, Repeat, ChevronsUpDown, LogOut, UserCog } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { AccountManagementDialog } from '../dialogs/account-management-dialog';

// Define navigation items
const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Transactions", url: "/transactions", icon: List },
  { title: "Recurring Transactions", url: "/recurring-transactions", icon: Repeat },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        return;
      }
      setUser(session?.user ?? null);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast.error('Error signing out', {
          description: error.message
        });
        return;
      }
      
      // Clear any local state/cache if needed
      router.replace('/sign-in');
    } catch (error: any) {
      console.error('Error during sign out:', error);
      toast.error('Error signing out', {
        description: error.message
      });
    }
  };

  return (
    <>
      <Sidebar collapsible="offcanvas">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-2 hover:bg-hover-surface transition-colors">
                <Link href="/dashboard" className="flex items-center gap-2">
                  <Image src="/logo.png" alt="Zepto" width={40} height={40} className="object-contain" />
                  <span className="text-xl font-bold text-foreground group-data-[collapsible=icon]:hidden">
                    Zepto
                  </span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive}
                      className="hover:bg-hover-surface transition-colors"
                    >
                      <Link href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        
        <SidebarFooter>
          {user && (
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-hover-surface hover:bg-hover-surface transition-colors border border-border"
                    >
                      <Avatar className="h-8 w-8 rounded-lg border border-primary/20">
                        <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || 'User'} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                          {user.user_metadata?.full_name
                            ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('')
                            : 'U'
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold text-foreground">
                          {user.user_metadata?.full_name || 'User'}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {user.email || 'No email'}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-border bg-popover shadow-xl" side="bottom" align="end" sideOffset={4}>
                    <DropdownMenuItem 
                      onClick={() => setIsAccountDialogOpen(true)}
                      className="hover:bg-hover-surface cursor-pointer"
                    >
                      <UserCog className="mr-2 h-4 w-4" />
                      Account Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="hover:bg-hover-surface cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          )}
        </SidebarFooter>
      </Sidebar>
      
      {/* Account Management Dialog */}
      <AccountManagementDialog 
        isOpen={isAccountDialogOpen} 
        onClose={() => setIsAccountDialogOpen(false)} 
        user={user} 
      />
    </>
  );
}