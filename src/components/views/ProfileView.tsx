'use client';

import React, { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/useProjectStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User, Mail, ShieldAlert, Wallet, Sparkles, Award, Gift, Edit3, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface ProfileViewProps {
  onViewChange: (view: string) => void;
}

export function ProfileView({ onViewChange }: ProfileViewProps) {
  const { currentUser, updateProfile } = useProjectStore();
  const [mounted, setMounted] = useState(false);

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [loading, setLoading] = useState(false);

  // Avatar presets cho người dùng click chọn nhanh
  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=200',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
  ];

  useEffect(() => {
    setMounted(true);
    if (currentUser) {
      setName(currentUser.name);
      setAvatar(currentUser.avatar || '');
    }
  }, [currentUser]);

  if (!mounted) return null;
  if (!currentUser) return null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập Họ và tên.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      updateProfile(name.trim(), avatar);
      setLoading(false);
      toast.success('Đã cập nhật hồ sơ cá nhân thành công.');
    }, 500);
  };

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 select-none">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Hồ sơ cá nhân</h2>
        <p className="text-xs text-muted-foreground font-medium">
          Cập nhật thông tin nhận dạng và xem số dư tiền thưởng ảo tích lũy.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Cột trái: Thẻ ví thưởng & Avatar */}
        <div className="space-y-6">
          {/* Ví Thưởng */}
          <Card className="border border-border/40 bg-gradient-to-br from-slate-900 to-slate-950 dark:from-slate-900 dark:to-slate-950 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 rounded-full bg-amber-500/10 blur-2xl" />
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ví Tiền Thưởng Áo</span>
                <Wallet className="h-5 w-5 text-amber-400" />
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-black text-amber-400 tracking-tight">
                  {formatVND(currentUser.balance)}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  <span>Tích lũy từ hoàn thành dự án</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[9px] text-slate-500 font-semibold">
                <Gift className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>Quy đổi: 1 dự án = +100,000,000 ₫</span>
              </div>
            </div>
          </Card>

          {/* Quick Avatar Preview */}
          <Card className="border border-border/40 bg-card rounded-3xl p-6 text-center shadow-sm">
            <div className="space-y-4">
              <div className="relative w-24 h-24 mx-auto rounded-3xl overflow-hidden border-2 border-primary/20 shadow-md">
                <img src={avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user'} alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm">{currentUser.name}</h4>
                <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                <Badge className="rounded-xl mt-1.5 uppercase text-[9px] font-black tracking-wider bg-primary/10 border-primary/20 text-primary">
                  {currentUser.role === 'ADMIN' ? 'Quản trị viên' : currentUser.role === 'MANAGER' ? 'Quản lý' : 'Nhân viên'}
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        {/* Cột phải: Form cập nhật thông tin */}
        <div className="md:col-span-2">
          <Card className="border border-border/40 bg-card rounded-3xl shadow-sm h-full">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-sm font-bold tracking-tight">Thông tin tài khoản</CardTitle>
              <CardDescription className="text-[10px]">Cập nhật tên hiển thị và lựa chọn ảnh đại diện phù hợp</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Email (Read-only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> Địa chỉ Email (Không thể thay đổi)
                  </label>
                  <Input value={currentUser.email} disabled className="rounded-2xl border-border bg-muted/40 h-11 text-xs" />
                </div>

                {/* Họ và Tên */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Họ và Tên của bạn
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="rounded-2xl border-border bg-muted/10 h-11 text-xs"
                  />
                </div>

                {/* Chọn Avatar mẫu */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Lựa chọn ảnh đại diện có sẵn
                  </label>
                  <div className="grid grid-cols-6 gap-3">
                    {avatarPresets.map((preset, idx) => {
                      const isSelected = avatar === preset;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setAvatar(preset)}
                          className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                            isSelected ? 'border-primary scale-105 shadow-sm' : 'border-transparent hover:border-border/60 hover:scale-102'
                          }`}
                        >
                          <img src={preset} alt={`preset ${idx}`} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center text-white">
                              <Check className="h-5 w-5 stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-3 border-t border-border/20 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="rounded-2xl h-11 px-6 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Edit3 className="h-4 w-4" />
                        Lưu thay đổi
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
