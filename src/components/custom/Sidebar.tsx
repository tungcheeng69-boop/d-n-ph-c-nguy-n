'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useProjectStore } from '@/store/useProjectStore';
import { useSidebar } from './SidebarContext';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, FolderKanban, User, LogOut, X, ShieldAlert, Users, Crown, ShieldCheck, Wrench, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { UserRole } from '@/store/useProjectStore';

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, logoutUser } = useProjectStore();
  const { isOpen, setIsOpen } = useSidebar();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Quản lý Dự án', href: '/projects', icon: FolderKanban },
    { name: 'Trang cá nhân', href: '/profile', icon: User },
  ];

  if (currentUser?.role === 'ADMIN') {
    navItems.push({ name: 'Quản lý nhân sự', href: '/users', icon: Users });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full glass-panel bg-gradient-to-b from-card/65 via-background/40 to-background/70 border-r border-border/10 text-card-foreground p-6 select-none shadow-2xl backdrop-blur-2xl">
      {/* Logo */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform duration-300">
            T
          </div>
          <span className="font-black text-xl tracking-tight bg-gradient-to-r from-primary via-cyan-400 to-accent bg-clip-text text-transparent">
            TECHPROJECT
          </span>
        </Link>
        {/* Nút đóng Sidebar trên mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden rounded-2xl cursor-pointer hover:bg-muted/40"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* User Info Quick View */}
      {currentUser && (() => {
        const getRoleBadgeDetails = (role: UserRole) => {
          switch (role) {
            case 'ADMIN':
              return { label: 'Quản trị viên', icon: Star, colorClass: 'text-accent border-accent/20 bg-accent/10' };
            case 'MANAGER':
              return { label: 'Quản lý dự án', icon: ShieldCheck, colorClass: 'text-primary border-primary/20 bg-primary/10' };
            case 'COMMANDER':
              return { label: 'Chỉ huy trưởng', icon: Crown, colorClass: 'text-amber-500 border-amber-500/20 bg-amber-500/10' };
            case 'DEPUTY_COMMANDER':
              return { label: 'Chỉ huy phó', icon: ShieldAlert, colorClass: 'text-orange-500 border-orange-500/20 bg-orange-500/10' };
            case 'FIELD_ENGINEER':
              return { label: 'Kỹ thuật hiện trường', icon: Wrench, colorClass: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10' };
            default:
              return { label: 'Nhân viên', icon: User, colorClass: 'text-blue-400 border-blue-400/20 bg-blue-400/10' };
          }
        };

        const badge = getRoleBadgeDetails(currentUser.role);
        const RoleIcon = badge.icon;

        return (
          <div className="flex items-center gap-3 p-3.5 rounded-3xl bg-muted/20 border border-border/10 mb-6 backdrop-blur-md">
            <img
              src={currentUser.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=demo'}
              alt="avatar"
              className="w-11 h-11 rounded-2xl object-cover bg-background border border-border/10 shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate leading-none mb-2 text-foreground">{currentUser.name}</p>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[9px] font-black uppercase tracking-wider ${badge.colorClass}`}>
                <RoleIcon className="h-3 w-3 shrink-0 animate-pulse" />
                <span>{badge.label}</span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Navigation Links */}
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={cn(
                "flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-xs font-bold transition-all duration-300 border border-transparent cursor-pointer group",
                isActive
                  ? currentUser?.role === 'ADMIN'
                    ? "bg-accent text-accent-foreground shadow-lg shadow-accent/15 border-accent/20 scale-[1.02]"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/15 border-primary/20 scale-[1.02]"
                  : "text-muted-foreground hover:bg-muted/30 hover:text-foreground hover:border-border/10"
              )}
            >
              <Icon className={cn("h-4.5 w-4.5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:translate-x-0.5")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout button */}
      <div className="pt-4 border-t border-border/10">
        <Button
          variant="ghost"
          onClick={() => {
            setIsOpen(false);
            logoutUser();
          }}
          className="w-full flex items-center justify-start gap-3.5 px-4.5 py-3 rounded-2xl text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive transition-all duration-300 border border-transparent hover:border-destructive/20 cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar cố định trên Desktop */}
      <aside className="hidden md:block w-72 h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Sidebar trượt trên Mobile */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-50 md:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
