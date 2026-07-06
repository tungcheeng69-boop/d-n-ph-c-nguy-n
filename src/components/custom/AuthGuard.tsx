'use client';

import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { LoginView } from '@/components/views/LoginView';
import { RegisterView } from '@/components/views/RegisterView';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isHydrated, currentView } = useProjectStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Trong lúc chờ Hydrated hoặc mounted, hiển thị loading screen
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

  // Nếu chưa đăng nhập -> Chặn render và hiển thị trực tiếp LoginView / RegisterView dưới dạng SPA
  if (!currentUser) {
    if (currentView === 'register') {
      return <RegisterView />;
    }
    return <LoginView />;
  }

  return <>{children}</>;
}
