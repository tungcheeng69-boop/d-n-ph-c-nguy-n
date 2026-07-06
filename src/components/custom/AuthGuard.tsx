'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, isHydrated } = useProjectStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Chỉ kiểm tra khi Zustand store đã được nạp dữ liệu từ localStorage
    if (mounted && isHydrated) {
      const isAuthPage = pathname === '/login' || pathname === '/register';
      
      if (!currentUser && !isAuthPage) {
        // Chưa đăng nhập và truy cập trang được bảo vệ -> Redirect về Login
        router.replace('/login');
      } else if (currentUser && isAuthPage) {
        // Đã đăng nhập và truy cập trang đăng nhập/đăng ký -> Redirect về Dashboard
        router.replace('/');
      }
    }
  }, [currentUser, isHydrated, pathname, router, mounted]);

  // Trong lúc chờ Hydrated hoặc mounted, hiển thị loading screen sang trọng
  if (!mounted || !isHydrated) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium animate-pulse">TECHPROJECT đang tải...</p>
        </div>
      </div>
    );
  }

  const isAuthPage = pathname === '/login' || pathname === '/register';
  
  // Nếu chưa đăng nhập mà không ở trang auth -> Chặn render children để tránh nháy giao diện
  if (!currentUser && !isAuthPage) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground font-medium">Đang chuyển hướng...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
