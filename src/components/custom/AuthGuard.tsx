'use client';

import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { LoginView } from '@/components/views/LoginView';
import { RegisterView } from '@/components/views/RegisterView';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, currentView, isCloudConnected, fetchCloudData } = useProjectStore();
  const [mounted, setMounted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasLoggedInUser, setHasLoggedInUser] = useState(false);

  // Polling đồng bộ đám mây định kỳ 8 giây/lần khi ở Dashboard chính
  useEffect(() => {
    if (!isCloudConnected || !currentUser) return;

    // Fetch dữ liệu cloud ngay khi đăng nhập thành công
    fetchCloudData();

    const interval = setInterval(() => {
      fetchCloudData();
    }, 8000);

    return () => clearInterval(interval);
  }, [isCloudConnected, currentUser, fetchCloudData]);

  useEffect(() => {
    setMounted(true);

    // Đọc nhanh và đồng bộ localStorage để kiểm tra trạng thái đăng nhập trước đó
    try {
      const rawData = localStorage.getItem('techproject-storage');
      if (rawData) {
        const parsed = JSON.parse(rawData);
        if (parsed?.state?.currentUser) {
          setHasLoggedInUser(true);
        }
      }
    } catch (e) {
      // Bỏ qua lỗi nếu localStorage bị chặn
    }

    // Lắng nghe Zustand hydration
    const unsub = useProjectStore.persist.onFinishHydration(() => {
      setIsHydrated(true);
    });

    if (useProjectStore.persist.hasHydrated()) {
      setIsHydrated(true);
    }

    return () => unsub();
  }, []);

  // Trong lúc chờ React mounted, hiển thị màn hình nền trống tối giản để tránh mismatch
  if (!mounted) {
    return <div className="fixed inset-0 bg-slate-950 z-50" />;
  }

  // Nếu Zustand chưa nạp xong dữ liệu từ storage
  if (!isHydrated) {
    // Nếu phát hiện có user đã đăng nhập trước đó -> Hiển thị loading nhẹ chờ vào thẳng Dashboard (tránh flash Login)
    if (hasLoggedInUser) {
      return (
        <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center z-50">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }
    // Nếu chưa đăng nhập -> Hiển thị form Đăng nhập ngay lập tức không cần chờ đợi!
    if (currentView === 'register') {
      return <RegisterView />;
    }
    return <LoginView />;
  }

  // Khi Zustand đã nạp xong dữ liệu chính thức
  if (!currentUser) {
    if (currentView === 'register') {
      return <RegisterView />;
    }
    return <LoginView />;
  }

  return <>{children}</>;
}
