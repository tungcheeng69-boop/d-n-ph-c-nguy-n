'use client';

import React from 'react';
import { AuthGuard } from '@/components/custom/AuthGuard';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8 overflow-hidden select-none">
        {/* Các vòng tròn gradient nền nghệ thuật */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/20 blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] animate-pulse" style={{ animationDuration: '6s' }} />

        {/* Nội dung Auth Pages */}
        <div className="relative z-10 w-full max-w-md">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}
