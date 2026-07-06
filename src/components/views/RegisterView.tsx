'use client';

import React, { useState } from 'react';
import { useProjectStore, UserRole } from '@/store/useProjectStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { UserPlus, Mail, User, ArrowLeft, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function RegisterView() {
  const { registerUser, setView } = useProjectStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('STAFF');
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error('Vui lòng điền đầy đủ Tên và Email.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = registerUser(email, name, role);
      setLoading(false);
      if (res.success) {
        toast.success(res.message);
        toast.success('Hệ thống đã tự động tặng bạn 100.000.000 VNĐ thưởng ảo vào ví!', {
          duration: 6000,
          icon: <Gift className="h-5 w-5 text-amber-500 animate-bounce" />,
        });
        setView('dashboard');
      } else {
        toast.error(res.message);
      }
    }, 600);
  };

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
            <CardTitle className="text-2xl font-black tracking-tight text-white">TẠO TÀI KHOẢN MỚI</CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Tự động tặng 100M VNĐ ví thưởng ảo khi đăng ký
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Nhập Tên */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Họ và Tên
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-11 h-12 bg-slate-950/50 border-slate-800 text-white placeholder-slate-500 focus-visible:ring-primary rounded-2xl transition-all duration-300"
                  />
                </div>
              </div>

              {/* Nhập Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Địa chỉ Email
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

              {/* Lựa chọn vai trò */}
              <div className="space-y-2">
                <label htmlFor="role" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Vai trò chức vụ
                </label>
                <div className="relative">
                  <Select value={role} onValueChange={(val) => { if (val) setRole(val as UserRole); }}>
                    <SelectTrigger
                      id="role"
                      className="h-12 bg-slate-950/50 border-slate-800 text-white focus:ring-primary rounded-2xl transition-all duration-300 cursor-pointer"
                    >
                      <SelectValue placeholder="Chọn vai trò" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-800 rounded-2xl">
                      <SelectItem value="STAFF" className="rounded-xl focus:bg-primary/20 text-white cursor-pointer">
                        Nhân viên kỹ thuật (Staff)
                      </SelectItem>
                      <SelectItem value="FIELD_ENGINEER" className="rounded-xl focus:bg-primary/20 text-white cursor-pointer">
                        Kỹ thuật hiện trường (Field Engineer)
                      </SelectItem>
                      <SelectItem value="DEPUTY_COMMANDER" className="rounded-xl focus:bg-primary/20 text-white cursor-pointer">
                        Chỉ huy phó (Deputy Commander)
                      </SelectItem>
                      <SelectItem value="COMMANDER" className="rounded-xl focus:bg-primary/20 text-white cursor-pointer">
                        Chỉ huy trưởng (Commander)
                      </SelectItem>
                      <SelectItem value="MANAGER" className="rounded-xl focus:bg-primary/20 text-white cursor-pointer">
                        Quản lý dự án (Manager)
                      </SelectItem>
                      <SelectItem value="ADMIN" className="rounded-xl focus:bg-primary/20 text-white cursor-pointer">
                        Quản trị viên (Admin)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Đăng ký ngay
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center pt-2 pb-2">
            <p className="text-sm text-slate-400">
              Đã có tài khoản?{' '}
              <button onClick={() => setView('login')} className="text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer bg-transparent border-0 p-0">
                <ArrowLeft className="h-3 w-3" /> Quay lại Đăng nhập
              </button>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
