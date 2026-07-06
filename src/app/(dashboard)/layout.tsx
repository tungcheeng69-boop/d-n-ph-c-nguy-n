'use client';

import React from 'react';
import { SidebarProvider } from '@/components/custom/SidebarContext';
import { Sidebar } from '@/components/custom/Sidebar';
import { Navbar } from '@/components/custom/Navbar';
import { AuthGuard } from '@/components/custom/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen bg-background">
          {/* Sidebar Navigation */}
          <Sidebar />

          {/* Main Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header / Top Navbar */}
            <Navbar />

            {/* Content Area */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-[1600px] w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
