'use client';

import React, { useEffect, useState } from 'react';
import { useProjectStore, UserRole } from '@/store/useProjectStore';
import { StatCard } from '@/components/custom/StatCard';
import { DashboardChart } from '@/components/custom/DashboardChart';
import {
  FolderKanban,
  ClipboardList,
  Flame,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Clock,
  Briefcase,
  Crown,
  ShieldCheck,
  ShieldAlert,
  Wrench,
  User,
  Star,
  PackageOpen,
  CheckSquare,
  FileCheck,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { projects, currentUser, users } = useProjectStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !currentUser) return null;

  // Quyết định xem user này có phải nhân sự hiện trường (chỉ xem dự án được giao) hay không
  const isFieldStaff = ['COMMANDER', 'DEPUTY_COMMANDER', 'FIELD_ENGINEER', 'STAFF'].includes(currentUser.role);

  // Lọc dự án theo quyền
  const userProjects = isFieldStaff
    ? projects.filter((p) => p.managerIds?.includes(currentUser.id))
    : projects;

  // 1. Tính toán thống kê
  const totalProjects = userProjects.length;
  const surveyProjects = userProjects.filter((p) => p.status === 'SURVEY').length;
  const ongoingProjects = userProjects.filter((p) => p.status === 'ONGOING').length;
  const completedProjects = userProjects.filter((p) => p.status === 'COMPLETED').length;

  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const CURRENT_DATE_STR = '2026-07-04';

  const getDaysRemaining = (targetDateStr: string) => {
    if (!targetDateStr) return 999;
    const targetDate = new Date(targetDateStr);
    const currentDate = new Date(CURRENT_DATE_STR);
    const diffTime = targetDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Xác định mốc deadline gần nhất (chỉ dự án SURVEY và ONGOING)
  const deadlineProjects = userProjects
    .filter((p) => p.status !== 'COMPLETED')
    .map((p) => {
      let deadlineDate = p.expectedStartDate;
      let deadlineType = 'Dự kiến triển khai';

      if (p.status === 'ONGOING' && p.handoverPhases.length > 0) {
        const pendingPhases = p.handoverPhases
          .filter((h) => h.status === 'PENDING')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (pendingPhases.length > 0) {
          deadlineDate = pendingPhases[0].date;
          deadlineType = `Bàn giao: ${pendingPhases[0].name}`;
        }
      }

      const daysRemaining = getDaysRemaining(deadlineDate);

      return {
        ...p,
        deadlineDate,
        deadlineType,
        daysRemaining,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 3);

  // Helper vai trò & badge tương ứng
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return { label: 'Quản trị viên', icon: Star, class: 'bg-accent/10 border-accent/20 text-accent' };
      case 'MANAGER':
        return { label: 'Quản lý dự án', icon: ShieldCheck, class: 'bg-primary/10 border-primary/20 text-primary' };
      case 'COMMANDER':
        return { label: 'Chỉ huy trưởng', icon: Crown, class: 'bg-amber-500/10 border-amber-500/20 text-amber-500' };
      case 'DEPUTY_COMMANDER':
        return { label: 'Chỉ huy phó', icon: ShieldAlert, class: 'bg-orange-500/10 border-orange-500/20 text-orange-500' };
      case 'FIELD_ENGINEER':
        return { label: 'Kỹ thuật hiện trường', icon: Wrench, class: 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400' };
      default:
        return { label: 'Nhân viên', icon: User, class: 'bg-blue-500/10 border-blue-500/20 text-blue-500' };
    }
  };

  const roleInfo = getRoleBadge(currentUser.role);
  const RoleIcon = roleInfo.icon;

  // Lấy danh sách phụ trợ cho Chỉ huy trưởng/phó: "Dự án do tôi chỉ huy"
  const ongoingCommanderProjects = userProjects.filter((p) => p.status === 'ONGOING');

  // Lấy danh sách phụ trợ cho Kỹ thuật hiện trường (FIELD_ENGINEER) & Nhân viên (STAFF)
  const pendingMaterials = userProjects
    .filter((p) => p.status === 'ONGOING')
    .flatMap((p) => (p.materials || []).map((m) => ({ ...m, projectName: p.name, projectId: p.id })))
    .filter((m) => !m.image); // Vật tư chưa cập nhật ảnh kiểm định

  const pendingHandovers = userProjects
    .filter((p) => p.status === 'ONGOING')
    .flatMap((p) => (p.handoverPhases || []).map((h) => ({ ...h, projectName: p.name, projectId: p.id })))
    .filter((h) => h.status === 'PENDING'); // Đợt bàn giao đang chờ nghiệm thu

  return (
    <div className="space-y-8 select-none bg-grid-subtle pb-8">
      {/* Welcome Banner - Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border border-primary/20 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl backdrop-blur-md"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">
              Xin chào, <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{currentUser.name}</span>! 👋
            </h2>
            <Badge className={`rounded-xl px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${roleInfo.class} border flex items-center gap-1 shrink-0`}>
              <RoleIcon className="w-3 h-3" />
              {roleInfo.label}
            </Badge>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground font-semibold">
            Hôm nay là ngày <span className="font-bold text-foreground">04/07/2026</span>. 
            {isFieldStaff 
              ? ' Bạn đang xem dashboard báo cáo cá nhân được thiết lập riêng cho vai trò kỹ thuật.'
              : ' Bạn đang xem dashboard báo cáo tổng thể của hệ thống.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button className="rounded-2xl cursor-pointer font-bold text-xs h-10 px-4 btn-neon-cyan">
              Xem dự án phụ trách
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Grid thẻ thống kê */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          index={0}
          title={isFieldStaff ? "Dự án phụ trách" : "Tổng số dự án"}
          value={totalProjects}
          icon={FolderKanban}
          subtext={isFieldStaff ? "Số hồ sơ được phân công" : "Tất cả hồ sơ trong hệ thống"}
          colorClass="bg-primary/10 text-primary border-primary/10"
        />
        <StatCard
          index={1}
          title="Khảo sát mới"
          value={surveyProjects}
          icon={ClipboardList}
          subtext="Chờ lập biện pháp thi công"
          colorClass="bg-amber-500/10 text-amber-500 border-amber-500/10"
        />
        <StatCard
          index={2}
          title="Đang thi công"
          value={ongoingProjects}
          icon={Flame}
          subtext="Đang triển khai các đợt bàn giao"
          colorClass="bg-blue-500/10 text-blue-500 border-blue-500/10"
        />
        <StatCard
          index={3}
          title="Ví thưởng tích lũy"
          value={formatVND(currentUser.balance)}
          icon={TrendingUp}
          subtext="Số dư ví tiền thưởng ảo của bạn"
          colorClass="bg-emerald-500/10 text-emerald-500 border-emerald-500/10"
        />
      </div>

      {/* GIAO DIỆN DÀNH RIÊNG CHO TỪNG VAI TRÒ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
        {/* CỘT TRÁI (2/3): Hiển thị phần cá nhân hóa theo vai trò hoặc Biểu đồ */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* CÁ NHÂN HÓA 1: COMMANDER & DEPUTY_COMMANDER (Dự án chỉ huy) */}
          {(currentUser.role === 'COMMANDER' || currentUser.role === 'DEPUTY_COMMANDER') && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl neon-card-glow overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/10 bg-gradient-to-r from-amber-500/5 to-transparent">
                  <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                    <Crown className="h-4.5 w-4.5 text-amber-500 shrink-0" />
                    Danh sách dự án do tôi chỉ huy thi công
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground/80 font-medium">
                    Theo dõi tiến trình thi công trực tiếp hiện trường
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {ongoingCommanderProjects.length === 0 ? (
                    <div className="py-8 text-center text-xs text-muted-foreground font-semibold italic">
                      Bạn hiện chưa được giao chỉ huy dự án thi công nào.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/10">
                      {ongoingCommanderProjects.map((p) => {
                        const completedHandovers = p.handoverPhases.filter((h) => h.status === 'COMPLETED').length;
                        const totalHandovers = p.handoverPhases.length;
                        return (
                          <div key={p.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                            <div className="min-w-0 flex-1 space-y-1">
                              <h4 className="text-xs font-bold text-foreground truncate hover:text-primary transition-colors">
                                <Link href={`/projects/${p.id}`}>{p.name}</Link>
                              </h4>
                              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                Đã hoàn thành: <span className="text-foreground font-black">{completedHandovers}/{totalHandovers} đợt nghiệm thu</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                              <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-xl text-[9px] font-black">
                                Tiến độ: {p.progress}%
                              </Badge>
                              <Link href={`/projects/${p.id}`}>
                                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl hover:bg-muted cursor-pointer shrink-0">
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* CÁ NHÂN HÓA 2: FIELD_ENGINEER (Vật tư cần kiểm tra & Đợt bàn giao chờ) */}
          {currentUser.role === 'FIELD_ENGINEER' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Box 1: Vật tư cần kiểm định */}
              <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl neon-card-glow overflow-hidden flex flex-col h-full justify-between">
                <CardHeader className="pb-3 border-b border-border/10 bg-gradient-to-r from-cyan-500/5 to-transparent">
                  <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                    <PackageOpen className="h-4.5 w-4.5 text-cyan-400 shrink-0" />
                    Vật tư chờ kiểm tra ảnh thực tế
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground/80 font-medium">
                    Nhập ảnh chụp vật tư đưa vào công trình
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 flex-1 overflow-y-auto max-h-[300px] space-y-3">
                  {pendingMaterials.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground font-semibold italic">
                      Tất cả vật tư đã được cập nhật ảnh kiểm định!
                    </div>
                  ) : (
                    pendingMaterials.map((m) => (
                      <Link href={`/projects/${m.projectId}`} key={m.id} className="block group">
                        <div className="p-3 border border-border/10 rounded-2xl bg-muted/10 hover:bg-muted/30 transition-all duration-300">
                          <p className="text-xs font-bold text-foreground group-hover:text-primary truncate">{m.name}</p>
                          <div className="flex justify-between items-center mt-2 text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                            <span className="truncate max-w-[120px]">{m.projectName}</span>
                            <span className="text-foreground shrink-0 font-black">SL: {m.quantity}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Box 2: Đợt bàn giao đang chờ */}
              <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl neon-card-glow overflow-hidden flex flex-col h-full justify-between">
                <CardHeader className="pb-3 border-b border-border/10 bg-gradient-to-r from-blue-500/5 to-transparent">
                  <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                    <CheckSquare className="h-4.5 w-4.5 text-blue-400 shrink-0" />
                    Đợt bàn giao chờ kỹ thuật kiểm soát
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground/80 font-medium">
                    Kiểm tra biện pháp, tiến độ từng đợt
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-5 flex-1 overflow-y-auto max-h-[300px] space-y-3">
                  {pendingHandovers.length === 0 ? (
                    <div className="py-12 text-center text-xs text-muted-foreground font-semibold italic">
                      Không có đợt nghiệm thu bàn giao nào đang chờ.
                    </div>
                  ) : (
                    pendingHandovers.map((h) => (
                      <Link href={`/projects/${h.projectId}`} key={h.id} className="block group">
                        <div className="p-3 border border-border/10 rounded-2xl bg-muted/10 hover:bg-muted/30 transition-all duration-300">
                          <p className="text-xs font-bold text-foreground group-hover:text-primary truncate">{h.name}</p>
                          <div className="flex justify-between items-center mt-2 text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                            <span className="truncate max-w-[120px]">{h.projectName}</span>
                            <span className="text-amber-500 shrink-0 font-black">Hạn: {h.date}</span>
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* CÁ NHÂN HÓA 3: STAFF (Nhiệm vụ được giao rút gọn) */}
          {currentUser.role === 'STAFF' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl neon-card-glow overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/10 bg-gradient-to-r from-blue-500/5 to-transparent">
                  <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                    <FileCheck className="h-4.5 w-4.5 text-blue-500 shrink-0" />
                    Các đợt thi công & nghiệm thu tôi tham gia
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground/80 font-medium">
                    Hãy tập trung hoàn thành các hạng mục bàn giao đúng tiến độ
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {pendingHandovers.length === 0 ? (
                    <div className="py-10 text-center text-xs text-muted-foreground font-semibold italic">
                      Bạn không có đợt nghiệm thu nào đang chờ giải quyết.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/10">
                      {pendingHandovers.map((h) => (
                        <div key={h.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0 gap-4">
                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="text-xs font-bold text-foreground truncate hover:text-primary transition-colors">
                              <Link href={`/projects/${h.projectId}`}>{h.name}</Link>
                            </h4>
                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider truncate">
                              Dự án: {h.projectName}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-xl text-[9px] font-black shrink-0">
                              Hạn: {h.date}
                            </Badge>
                            <Link href={`/projects/${h.projectId}`}>
                              <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold rounded-xl cursor-pointer shrink-0">
                                Xem chi tiết
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* HIỂN THỊ BIỂU ĐỒ HOẶC CÔNG VIỆC CHUNG (Chỉ ADMIN/MANAGER hoặc khi STAFF có biểu đồ nhỏ) */}
          {(!isFieldStaff || currentUser.role === 'COMMANDER') && (
            <div className="space-y-6">
              <DashboardChart
                surveyCount={surveyProjects}
                ongoingCount={ongoingProjects}
                completedCount={completedProjects}
              />
            </div>
          )}
        </div>

        {/* CẢNH BÁO DỰ ÁN GẦN DEADLINE (1/3) */}
        <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl flex flex-col h-full justify-between overflow-hidden neon-card-glow">
          <CardHeader className="pb-3 border-b border-border/10">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2 text-foreground">
                <Clock className="h-4.5 w-4.5 text-primary shrink-0" />
                Hạn chót gần nhất
              </CardTitle>
              <Badge variant="outline" className="rounded-xl border-border/20 text-[10px] font-black text-primary">
                {CURRENT_DATE_STR}
              </Badge>
            </div>
            <CardDescription className="text-[11px] text-muted-foreground/80 font-medium">
              Các mốc thi công sắp hết hạn cần ưu tiên xử lý
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 py-4 space-y-3 px-5">
            {deadlineProjects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2 h-full">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 animate-bounce" />
                <p className="text-xs font-black text-muted-foreground">Không có dự án sắp đến hạn chót!</p>
              </div>
            ) : (
              deadlineProjects.map((project) => {
                const isOverdue = project.daysRemaining < 0;
                const isDanger = project.daysRemaining <= 1;
                const isWarning = project.daysRemaining > 1 && project.daysRemaining <= 3;

                let warningStyle = 'border-border/10 bg-muted/10';
                let iconColor = 'text-muted-foreground';

                if (isOverdue || isDanger) {
                  warningStyle = 'border-destructive/30 bg-destructive/5 dark:bg-destructive/10 animate-pulse';
                  iconColor = 'text-destructive';
                } else if (isWarning) {
                  warningStyle = 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10';
                  iconColor = 'text-amber-500';
                }

                return (
                  <Link href={`/projects/${project.id}`} key={project.id} className="block group">
                    <div className={`p-3.5 border rounded-2xl transition-all duration-300 hover:bg-muted/30 cursor-pointer ${warningStyle}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <h4 className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors duration-200">
                            {project.name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                            <Calendar className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{project.deadlineType}</span>
                            <span className="shrink-0">•</span>
                            <span className="shrink-0 text-foreground font-black">{project.deadlineDate}</span>
                          </div>
                        </div>

                        {(isOverdue || isDanger || isWarning) && (
                          <div className={`p-1.5 rounded-xl bg-background border border-border/10 shrink-0 ${iconColor}`}>
                            <AlertTriangle className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/10">
                        <span className="text-[9px] font-black text-muted-foreground/75 uppercase tracking-wider">
                          Thời gian còn lại:
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-wider ${iconColor}`}>
                          {isOverdue
                            ? `Trễ hạn ${Math.abs(project.daysRemaining)} ngày`
                            : project.daysRemaining === 0
                            ? 'Khẩn cấp (Hôm nay!)'
                            : `${project.daysRemaining} ngày`}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
