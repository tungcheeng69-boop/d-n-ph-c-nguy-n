'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { useSidebar } from './SidebarContext';
import { ThemeToggle } from './ThemeToggle';
import { Menu, Wallet, User as UserIcon, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logoutUser } = useProjectStore();
  const { toggle } = useSidebar();

  // Xác định Page Title dựa trên route
  const getPageTitle = () => {
    if (pathname === '/') return 'Tổng quan hệ thống';
    if (pathname === '/projects') return 'Quản lý dự án kỹ thuật';
    if (pathname.startsWith('/projects/')) return 'Chi tiết dự án';
    if (pathname === '/profile') return 'Thông tin cá nhân';
    if (pathname === '/users') return 'Quản lý nhân sự';
    return 'TECHPROJECT';
  };

  // Hàm format tiền tệ VNĐ
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/10 bg-background/55 px-6 backdrop-blur-xl">
      {/* Left side: Hamburger (Mobile) + Title (Desktop) */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="md:hidden rounded-2xl hover:bg-muted cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground md:text-xl tracking-tight leading-none">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right side: Wallet Info + ThemeToggle + UserDropdown */}
      <div className="flex items-center gap-3.5">
        {/* Ví tiền thưởng ảo siêu sang chảnh */}
        {currentUser && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 font-black text-xs md:text-sm shadow-md shadow-amber-500/5 select-none animate-pulse">
            <Wallet className="h-4.5 w-4.5 text-amber-500 animate-bounce shrink-0" />
            <span className="hidden sm:inline text-muted-foreground/80 font-bold">Thưởng ảo:</span>
            <span>{formatVND(currentUser.balance)}</span>
          </div>
        )}

        {/* Nút chuyển đổi Theme */}
        <ThemeToggle />

        {/* Dropdown người dùng */}
        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="relative h-10 w-10 rounded-2xl border border-border/40 p-0 hover:bg-accent cursor-pointer flex items-center justify-center overflow-hidden"
            >
              <img
                src={currentUser.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=demo'}
                alt="avatar"
                className="h-full w-full object-cover"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl border-border p-1.5 shadow-lg">
              <DropdownMenuLabel className="font-normal px-2.5 py-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold text-foreground leading-none">{currentUser.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/40" />
              
              <DropdownMenuItem
                onClick={() => router.push('/profile')}
                className="rounded-xl cursor-pointer"
              >
                <div className="flex w-full items-center gap-2 px-2.5 py-2">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Trang cá nhân</span>
                </div>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator className="bg-border/40" />
              
              <DropdownMenuItem
                onClick={logoutUser}
                className="rounded-xl text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
              >
                <div className="flex w-full items-center gap-2 px-2.5 py-2">
                  <LogOut className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
