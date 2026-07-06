'use client';

import React, { useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { LogIn, Mail, ShieldAlert, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export function LoginView() {
  const { loginUser, setView } = useProjectStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Vui lòng nhập Email của bạn.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = loginUser(email);
      setLoading(false);
      if (res.success) {
        toast.success(res.message);
        setView('dashboard');
      } else {
        toast.error(res.message);
      }
    }, 600);
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setLoading(true);
    setTimeout(() => {
      const res = loginUser(demoEmail);
      setLoading(false);
      if (res.success) {
        toast.success(`Đăng nhập nhanh thành công: ${demoEmail}`);
        setView('dashboard');
      } else {
        toast.error(res.message);
      }
    }, 400);
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@tech.com', color: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20' },
    { label: 'Quản lý', email: 'manager@tech.com', color: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20' },
    { label: 'Chỉ huy trưởng', email: 'commander@tech.com', color: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20' },
    { label: 'Chỉ huy phó', email: 'deputy@tech.com', color: 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 border-indigo-500/20' },
    { label: 'Kỹ thuật', email: 'engineer@tech.com', color: 'bg-cyan-500/10 text-cyan-500 hover:bg-cyan-500/20 border-cyan-500/20' },
    { label: 'Nhân viên', email: 'employee@tech.com', color: 'bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 border-slate-500/20' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-slate-800 bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl p-4 overflow-hidden relative border">
          {/* Viền sáng bóng bẩy phía trên */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl shadow-lg shadow-primary/20 mb-3">
              T
            </div>
            <CardTitle className="text-2xl font-black tracking-tight text-white">ĐĂNG NHẬP HỆ THỐNG</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Nhập tài khoản để truy cập TECHPROJECT
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2.5">
                <label htmlFor="email" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Email Đăng Nhập
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-primary rounded-2xl transition-all duration-300"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    Đăng nhập
                  </>
                )}
              </Button>
            </form>

            {/* Dòng chữ ngăn cách */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-500 font-bold tracking-wider">Hoặc tài khoản Demo</span>
              </div>
            </div>

            {/* Danh sách tài khoản demo đăng nhập nhanh */}
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleQuickLogin(account.email)}
                  disabled={loading}
                  className={`flex flex-col items-start p-3 border rounded-2xl text-left transition-all duration-300 disabled:opacity-50 cursor-pointer ${account.color}`}
                >
                  <span className="text-xs font-black">{account.label}</span>
                  <span className="text-[10px] opacity-70 mt-1 truncate w-full">{account.email}</span>
                </button>
              ))}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center pt-2 pb-2 gap-2">
            <p className="text-sm text-slate-400">
              Chưa có tài khoản?{' '}
              <button onClick={() => setView('register')} className="text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0">
                Đăng ký ngay <ArrowRight className="h-3 w-3" />
              </button>
            </p>
            <div className="flex items-center gap-1.5 mt-2 bg-slate-950/40 p-2.5 rounded-2xl border border-slate-800/60 max-w-xs text-center">
              <ShieldAlert className="h-4 w-4 text-primary shrink-0" />
              <p className="text-[10px] text-slate-500 font-medium">
                Demo bypass mật khẩu. Chỉ cần nhập đúng Email hoặc bấm Đăng nhập nhanh.
              </p>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
