'use client';

import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { LoginView } from '@/components/views/LoginView';
import { RegisterView } from '@/components/views/RegisterView';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, currentView } = useProjectStore();
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [forceMount, setForceMount] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Lắng nghe sự kiện kết thúc hydration của Zustand persist ở Client-side
    const unsub = useProjectStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    // Nếu store đã được hydrate sẵn trước đó
    if (useProjectStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    // Liveness Fallback: Tránh kẹt vĩnh viễn ở màn hình loading sau 1.2 giây
    const timer = setTimeout(() => {
      setForceMount(true);
    }, 1200);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  // Trong lúc chờ Hydrated hoặc mounted, hiển thị loading screen
  if (!mounted || (!isHydrated && !forceMount)) {
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
