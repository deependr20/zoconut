'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  className?: string;
  showSidebar?: boolean;
}

export default function DashboardLayout({ 
  children, 
  className,
  showSidebar = true 
}: DashboardLayoutProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex h-[calc(100vh-4rem)]">
        {showSidebar && (
          <div className="hidden lg:block">
            <Sidebar />
          </div>
        )}
        <main className={cn(
          "flex-1 overflow-auto",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  );
}
