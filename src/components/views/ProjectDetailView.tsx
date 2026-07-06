'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useProjectStore, Project, HandoverPhase, Material } from '@/store/useProjectStore';
import { ConfirmationModal } from '@/components/custom/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  User,
  Phone,
  ArrowLeft,
  FileDown,
  CheckCircle,
  Plus,
  Trash2,
  Send,
  Upload,
  Clock,
  ClipboardList,
  AlertTriangle,
  Gift,
  CheckSquare,
  Square,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ProjectDetailViewProps {
  projectId: string | null;
  onViewChange: (view: string) => void;
}

export function ProjectDetailView({ projectId, onViewChange }: ProjectDetailViewProps) {

  const {
    projects,
    users,
    currentUser,
    activityLogs,
    comments,
    changeProjectStatus,
    updateProject,
    addHandoverPhase,
    toggleHandoverStatus,
    deleteHandoverPhase,
    addMaterial,
    updateMaterialImage,
    deleteMaterial,
    addComment,
  } = useProjectStore();

  const [mounted, setMounted] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  const candidateManagers = users.filter((u) => u.role !== 'ADMIN');

  const handleAssignManager = (managerIds: string[]) => {
    if (project) {
      updateProject(project.id, { managerIds });
      toast.success('Đã cập nhật danh sách người phụ trách thành công.');
    }
  };

  // States các Form Input phụ trợ
  const [newCommentContent, setNewCommentContent] = useState('');
  
  // State thêm đợt bàn giao
  const [showAddHandover, setShowAddHandover] = useState(false);
  const [handoverName, setHandoverName] = useState('');
  const [handoverDate, setHandoverDate] = useState('');

  // State thêm vật tư
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [materialName, setMaterialName] = useState('');
  const [materialQty, setMaterialQty] = useState<number>(1);
  const [quickQtys, setQuickQtys] = useState<Record<string, number>>({});

  // State Confirmation Modals
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);

  // Ref cho upload ảnh vật tư
  const materialFileInputRef = useRef<HTMLInputElement>(null);
  const [activeMaterialIdForUpload, setActiveMaterialIdForUpload] = useState<string | null>(null);

  // Load dự án theo ID
  useEffect(() => {
    setMounted(true);
    const foundProject = projects.find((p) => p.id === projectId);
    if (foundProject) {
      setProject(foundProject);
    } else {
      setProject(null);
    }
  }, [projects, projectId, currentUser]);

  if (!mounted) return null;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive animate-bounce" />
        <h3 className="text-lg font-bold text-foreground">Hồ sơ dự án không tồn tại</h3>
        <p className="text-xs text-muted-foreground">
          Dự án này đã bị xóa hoặc đường dẫn không chính xác.
        </p>
        <Button onClick={() => onViewChange('projects')} className="rounded-2xl cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Về danh sách
        </Button>
      </div>
    );
  }

  // Format tiền tệ VNĐ
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Lấy thông tin người phụ trách dự án
  const managerUsers = users.filter((u) => project.managerIds?.includes(u.id));

  // Lọc Activity Log & Comments cho dự án này
  const projectLogs = activityLogs
    .filter((l) => l.projectId === project.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const projectComments = comments
    .filter((c) => c.projectId === project.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Xử lý nghiệm thu đợt bàn giao (Chỉ dành cho Admin, Manager, Commander, Deputy)
  const handleToggleHandover = (phaseId: string, currentStatus: string) => {
    const canApprove = currentUser && ['ADMIN', 'MANAGER', 'COMMANDER', 'DEPUTY_COMMANDER'].includes(currentUser.role);
    if (!canApprove) {
      toast.error('Nghiệm thu thất bại! Chỉ Chỉ huy trưởng, Chỉ huy phó hoặc Quản lý mới được nghiệm thu đợt bàn giao.');
      return;
    }
    toggleHandoverStatus(project.id, phaseId);
  };

  // Xử lý gửi bình luận
  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentContent.trim()) return;

    addComment(project.id, newCommentContent.trim());
    toast.success('Đã gửi bình luận của bạn.');
    setNewCommentContent('');
  };

  // Xử lý thêm đợt bàn giao
  const handleCreateHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverName.trim() || !handoverDate) {
      toast.error('Vui lòng nhập tên đợt bàn giao và ngày dự kiến.');
      return;
    }

    addHandoverPhase(project.id, {
      name: handoverName.trim(),
      date: handoverDate,
    });
    toast.success('Đã thêm đợt bàn giao mới.');
    setHandoverName('');
    setHandoverDate('');
    setShowAddHandover(false);
  };

  // Xử lý thêm vật tư
  const handleCreateMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialName.trim() || materialQty <= 0) {
      toast.error('Vui lòng nhập tên vật tư và số lượng hợp lệ.');
      return;
    }

    addMaterial(project.id, {
      name: materialName.trim(),
      quantity: materialQty,
    });
    toast.success('Đã thêm vật tư kiểm tra.');
    setMaterialName('');
    setMaterialQty(1);
    setShowAddMaterial(false);
  };

  // Xử lý thêm nhanh thiết bị kiểm định từ danh sách mẫu
  const handleAddQuickMaterial = (name: string) => {
    if (!project) return;
    const qty = quickQtys[name] || 1;
    addMaterial(project.id, {
      name: name,
      quantity: qty,
    });
    toast.success(`Đã thêm nhanh ${name} (SL: ${qty}) vào danh sách.`);
  };

  // Xử lý upload ảnh cho vật tư (Giả lập URL.createObjectURL)
  const triggerUploadMaterialImage = (materialId: string) => {
    setActiveMaterialIdForUpload(materialId);
    materialFileInputRef.current?.click();
  };

  const handleMaterialImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeMaterialIdForUpload) {
      const imageUrl = URL.createObjectURL(file);
      updateMaterialImage(project.id, activeMaterialIdForUpload, imageUrl);
      toast.success('Đã cập nhật ảnh kiểm định vật tư thành công.');
      setActiveMaterialIdForUpload(null);
    }
  };

  // Nghiệm thu hoàn thành dự án
  const handleConfirmComplete = () => {
    changeProjectStatus(project.id, 'COMPLETED');
    const assignedName = managerUsers.length > 0 ? managerUsers.map((u) => u.name).join(', ') : currentUser?.name;
    toast.success('Nghiệm thu dự án thành công!', {
      duration: 7000,
      description: `Đã tự động cộng 100.000.000 VNĐ thưởng ảo cho ${assignedName}.`,
      icon: <Gift className="h-6 w-6 text-amber-500 animate-bounce" />,
    });
    setIsCompleteOpen(false);
  };

  // Tải động script html2pdf.js từ CDN để tránh lỗi bundler Next.js / React 19
  const loadHtml2pdf = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
        } else {
          reject(new Error('Không thể khởi tạo thư viện PDF.'));
        }
      };
      script.onerror = () => {
        reject(new Error('Lỗi tải script PDF từ CDN.'));
      };
      document.body.appendChild(script);
    });
  };

  // Xuất báo cáo PDF dùng html2pdf.js client-side
  const handleExportPDF = async () => {
    const element = document.getElementById('project-pdf-report');
    if (!element) return;

    toast.info('Đang khởi tạo và chuẩn bị tải tệp báo cáo PDF...');

    try {
      const html2pdf = await loadHtml2pdf();
      const opt = {
        margin: 12,
        filename: `Bao-cao-ky-thuat-${project.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      };

      // Chờ thư viện thực thi save xong
      await html2pdf().from(element).set(opt).save();
      toast.success('Đã xuất báo cáo PDF và tải xuống thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.');
      console.error(error);
    } finally {
      // DỌN DẸP DOM: Tránh việc html2canvas khóa pointer-events hoặc để lại overlay chặn click
      setTimeout(() => {
        const containers = document.querySelectorAll('.html2canvas-container');
        containers.forEach((el) => el.remove());
        
        // Đảm bảo trả lại tương tác đầy đủ cho giao diện người dùng
        document.body.style.pointerEvents = 'auto';
        document.body.style.overflow = 'auto';
      }, 500);
    }
  };

  return (
    <div className="space-y-6 select-none">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/20">
        <Button
          variant="outline"
          onClick={() => onViewChange('projects')}
          className="rounded-2xl border-border/20 h-10 text-xs font-bold cursor-pointer hover:bg-muted/30"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Về danh sách
        </Button>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Nút Xuất PDF */}
          <Button
            onClick={handleExportPDF}
            className="rounded-2xl h-10 text-xs font-bold flex-1 sm:flex-initial cursor-pointer btn-neon-cyan"
          >
            <FileDown className="h-4 w-4 mr-1.5" />
            Xuất PDF
          </Button>

          {/* Nút Nghiệm thu (Chỉ dành cho Admin / Manager và khi trạng thái chưa là COMPLETED) */}
          {currentUser && ['ADMIN', 'MANAGER'].includes(currentUser.role) && project.status !== 'COMPLETED' && (
            <Button
              onClick={() => setIsCompleteOpen(true)}
              className="rounded-2xl h-10 text-xs font-bold flex-1 sm:flex-initial cursor-pointer btn-neon-purple"
            >
              <CheckCircle className="h-4 w-4 mr-1.5" />
              Nghiệm thu hoàn thành
            </Button>
          )}
        </div>
      </div>

      {/* Cấu trúc 2 cột */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CỘT TRÁI (2/3): Chi tiết dự án, Handovers, Materials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Khung tài liệu chính để Export PDF */}
          <div id="project-pdf-report" className="space-y-6 bg-card dark:bg-card p-0 rounded-none border-0 text-foreground">
            {/* Header in PDF (Ẩn trên UI) */}
            <div className="hidden print-block border-b-2 border-primary pb-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-xl tracking-tight text-primary">TECHPROJECT JSC</h3>
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    Hệ thống quản lý thi công công trình & dự án kỹ thuật chuyên nghiệp
                  </p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-xs uppercase">BÁO CÁO KỸ THUẬT DỰ ÁN</h4>
                  <p className="text-[10px] text-muted-foreground">Mã dự án: {project.id}</p>
                </div>
              </div>
            </div>

            {/* Thông tin chung */}
            <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden neon-card-glow">
              <div className="p-6 space-y-5">
                {/* Title + Trạng thái */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={`rounded-xl px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        project.status === 'SURVEY'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                          : project.status === 'ONGOING'
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                      }`}
                    >
                      {project.status === 'SURVEY'
                        ? 'Khảo sát'
                        : project.status === 'ONGOING'
                        ? 'Đang thi công'
                        : 'Đã hoàn thành'}
                    </Badge>
                  </div>
                  <h2 className="text-lg md:text-xl font-black text-foreground leading-snug tracking-tight">
                    {project.name}
                  </h2>
                </div>

                {/* Grid Thông tin khảo sát & Khách hàng */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2 border-t border-border/20">
                  <div className="space-y-2.5">
                    {project.surveyDate && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Ngày khảo sát:</span>
                        <span className="font-semibold text-foreground">{project.surveyDate}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Thi công triển khai:</span>
                      <span className="font-semibold text-foreground">{project.expectedStartDate}</span>
                    </div>
                    {project.surveyor && (
                      <div className="flex items-center gap-2">
                        <User className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground">Người khảo sát:</span>
                        <span className="font-semibold text-foreground">{project.surveyor}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <User className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Người liên hệ KH:</span>
                      <span className="font-semibold text-foreground">{project.contactName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Số điện thoại KH:</span>
                      <span className="font-semibold text-foreground">{project.contactPhone}</span>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground font-bold">Người phụ trách:</span>
                      </div>
                      {currentUser?.role !== 'STAFF' && project.status !== 'COMPLETED' ? (
                        <div className="flex flex-wrap items-center gap-1.5 pl-6">
                          {candidateManagers.map((u) => {
                            const isAssigned = project.managerIds?.includes(u.id);
                            return (
                              <button
                                key={u.id}
                                type="button"
                                onClick={() => {
                                  const newIds = isAssigned
                                    ? project.managerIds.filter((id) => id !== u.id)
                                    : [...(project.managerIds || []), u.id];
                                  handleAssignManager(newIds);
                                }}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-bold transition-all duration-300 cursor-pointer ${
                                  isAssigned
                                    ? 'border-primary bg-primary/10 text-primary scale-[1.02]'
                                    : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/30'
                                }`}
                                title={u.name}
                              >
                                <img
                                  src={u.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user'}
                                  className="w-4 h-4 rounded-lg object-cover shrink-0"
                                />
                                <span>{u.name.split(' ').pop()}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 pl-6 flex-wrap">
                          {managerUsers.length > 0 ? (
                            managerUsers.map((u) => (
                              <div
                                key={u.id}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-xl border border-border bg-muted/20 text-[10px] font-bold text-foreground"
                              >
                                <img
                                  src={u.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user'}
                                  className="w-4 h-4 rounded-lg object-cover shrink-0"
                                />
                                <span>{u.name}</span>
                              </div>
                            ))
                          ) : (
                            <span className="font-bold text-muted-foreground text-xs italic">
                              Chưa phân công phụ trách
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nếu dự án là ONGOING/COMPLETED -> Tiến độ */}
                {project.status !== 'SURVEY' && (
                  <div className="space-y-2 pt-3 border-t border-border/20">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-muted-foreground uppercase tracking-wider">Tiến độ thi công thực tế:</span>
                      <span className="text-primary font-black">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2 rounded-lg" />
                  </div>
                )}
              </div>
            </Card>

            {/* Thư viện ảnh khảo sát */}
            <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden neon-card-glow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold tracking-tight">Thư viện hình ảnh khảo sát thực tế</CardTitle>
                <CardDescription className="text-[10px]">Tài liệu hình ảnh ghi nhận tại công trình</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                {project.images.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground font-semibold">
                    Không có hình ảnh khảo sát nào được đăng tải.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {project.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-video rounded-2xl overflow-hidden border border-border/40 group hover:border-primary transition-all duration-300"
                      >
                        <img
                          src={img}
                          alt={`khảo sát ${idx}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ĐỢT BÀN GIAO (Nếu không phải SURVEY) */}
            {project.status !== 'SURVEY' && (
              <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden neon-card-glow">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                      <CheckCircle className="h-4.5 w-4.5 text-primary" />
                      Các đợt nghiệm thu bàn giao
                    </CardTitle>
                    <CardDescription className="text-[10px]">Tiến trình nghiệm thu từng phần để giải ngân</CardDescription>
                  </div>

                  {/* Thêm đợt bàn giao - Chỉ dành cho Admin, Manager, Commander */}
                  {currentUser && ['ADMIN', 'MANAGER', 'COMMANDER'].includes(currentUser.role) && project.status !== 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddHandover(!showAddHandover)}
                      className="rounded-xl h-8 text-[11px] font-bold text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Thêm đợt
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-4">
                  {/* Form thêm đợt bàn giao */}
                  {showAddHandover && (
                    <form onSubmit={handleCreateHandover} className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tên đợt bàn giao</label>
                          <Input
                            value={handoverName}
                            onChange={(e) => setHandoverName(e.target.value)}
                            placeholder="Ví dụ: Bàn giao tủ điện điều khiển..."
                            className="h-9 text-xs rounded-xl bg-background border-border"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Ngày nghiệm thu dự kiến</label>
                          <Input
                            type="date"
                            value={handoverDate}
                            onChange={(e) => setHandoverDate(e.target.value)}
                            className="h-9 text-xs rounded-xl bg-background border-border"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setShowAddHandover(false)}
                          className="h-8 text-[10px] font-bold rounded-xl"
                        >
                          Hủy
                        </Button>
                        <Button
                          type="submit"
                          className="h-8 text-[10px] font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Thêm mới
                        </Button>
                      </div>
                    </form>
                  )}

                  {/* Danh sách đợt */}
                  {project.handoverPhases.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground font-semibold py-4">
                      Chưa thiết lập đợt nghiệm thu bàn giao nào.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {project.handoverPhases.map((phase) => {
                        const isDone = phase.status === 'COMPLETED';

                        return (
                          <div
                            key={phase.id}
                            className={`flex items-center justify-between p-3 border rounded-2xl transition-all duration-300 ${
                              isDone ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border/40 bg-muted/10'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              {/* Checkbox Toggle status (Nhân viên Staff không được toggle nếu dự án đã COMPLETED) */}
                              <button
                                type="button"
                                disabled={project.status === 'COMPLETED'}
                                onClick={() => handleToggleHandover(phase.id, phase.status)}
                                className="text-primary hover:scale-110 transition-transform duration-200 cursor-pointer disabled:opacity-50"
                              >
                                {isDone ? (
                                  <CheckSquare className="h-5 w-5 text-emerald-500" />
                                ) : (
                                  <Square className="h-5 w-5 text-muted-foreground" />
                                )}
                              </button>

                              <div className="min-w-0 space-y-0.5">
                                <p className={`text-xs font-bold truncate ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {phase.name}
                                </p>
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-semibold">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>Hạn: {phase.date}</span>
                                </div>
                              </div>
                            </div>

                            {/* Actions (Xóa đợt bàn giao - Chỉ dành cho Admin, Manager, Commander) */}
                            {currentUser && ['ADMIN', 'MANAGER', 'COMMANDER'].includes(currentUser.role) && project.status !== 'COMPLETED' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteHandoverPhase(project.id, phase.id)}
                                className="h-8 w-8 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer border border-transparent hover:border-destructive/20"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* DANH SÁCH VẬT TƯ (Nếu không phải SURVEY) */}
            {project.status !== 'SURVEY' && (
              <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden neon-card-glow">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                      <Package className="h-4.5 w-4.5 text-primary" />
                      Vật tư kiểm định công trình
                    </CardTitle>
                    <CardDescription className="text-[10px]">Quản lý và nghiệm thu vật tư đưa vào sử dụng</CardDescription>
                  </div>

                  {/* Thêm vật tư mới */}
                  {project.status !== 'COMPLETED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddMaterial(!showAddMaterial)}
                      className="rounded-xl h-8 text-[11px] font-bold text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Thêm vật tư
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-4">
                  {/* Form thêm vật tư */}
                  {showAddMaterial && (
                    <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-4">
                      {/* Form nhập thủ công */}
                      <form onSubmit={handleCreateMaterial} className="space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-left">Tên vật tư thiết bị</label>
                            <Input
                              value={materialName}
                              onChange={(e) => setMaterialName(e.target.value)}
                              placeholder="Ví dụ: Máy biến áp Schneider 3 pha..."
                              className="h-9 text-xs rounded-xl bg-background border-border"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block text-left">Số lượng</label>
                            <Input
                              type="number"
                              min="1"
                              value={materialQty}
                              onChange={(e) => setMaterialQty(Number(e.target.value))}
                              className="h-9 text-xs rounded-xl bg-background border-border"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setShowAddMaterial(false)}
                            className="h-8 text-[10px] font-bold rounded-xl cursor-pointer"
                          >
                            Hủy
                          </Button>
                          <Button
                            type="submit"
                            className="h-8 text-[10px] font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/95 cursor-pointer shadow-sm"
                          >
                            Lưu vật tư
                          </Button>
                        </div>
                      </form>

                      {/* Chọn nhanh thiết bị kiểm định mẫu */}
                      <div className="space-y-2 pt-2.5 border-t border-border/10">
                        <label className="text-[9px] font-black text-muted-foreground uppercase tracking-wider block text-left">
                          Chọn nhanh thiết bị kiểm định mẫu
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            'máy cắt pin',
                            'máy bắn vít',
                            'máy cắt dọc',
                            'máy khoan bê tông',
                            'máy laze',
                            'búa',
                            'máy cắt nhôm',
                            'pin'
                          ].map((item) => (
                            <div
                              key={item}
                              className="flex items-center gap-1.5 p-1.5 rounded-xl border border-border/5 bg-background/50 hover:bg-muted/30 transition-all duration-200"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] font-bold text-foreground capitalize truncate block text-left" title={item}>
                                  {item}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Input
                                  type="number"
                                  min="1"
                                  value={quickQtys[item] || 1}
                                  onChange={(e) => {
                                    const val = Math.max(1, Number(e.target.value));
                                    setQuickQtys((prev) => ({ ...prev, [item]: val }));
                                  }}
                                  className="w-8 h-6 text-[9px] text-center rounded-lg border-border/20 bg-background p-0 font-bold"
                                />
                                <Button
                                  type="button"
                                  onClick={() => handleAddQuickMaterial(item)}
                                  size="icon"
                                  className="h-6 w-6 rounded-lg btn-neon-cyan shrink-0 cursor-pointer"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bảng Danh sách vật tư */}
                  {project.materials.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground font-semibold py-4">
                      Chưa ghi nhận vật tư kiểm định nào.
                    </div>
                  ) : (
                    <div className="border border-border/30 rounded-2xl overflow-hidden text-xs">
                      <div className="grid grid-cols-12 bg-muted/40 font-bold p-3 border-b border-border/30 text-muted-foreground">
                        <div className="col-span-5 sm:col-span-6 uppercase tracking-wider text-[9px]">Tên vật tư</div>
                        <div className="col-span-2 text-center uppercase tracking-wider text-[9px]">S.Lượng</div>
                        <div className="col-span-3 text-center uppercase tracking-wider text-[9px]">Hình ảnh kiểm tra</div>
                        <div className="col-span-2 text-center uppercase tracking-wider text-[9px]">Thao tác</div>
                      </div>

                      <div className="divide-y divide-border/30">
                        {project.materials.map((m) => (
                          <div key={m.id} className="grid grid-cols-12 p-3 items-center hover:bg-muted/10 transition-colors">
                            <div className="col-span-5 sm:col-span-6 font-semibold text-foreground truncate pr-2">
                              {m.name}
                            </div>
                            <div className="col-span-2 text-center font-bold text-muted-foreground">{m.quantity}</div>
                            
                            {/* Upload/Preview ảnh vật tư */}
                            <div className="col-span-3 flex justify-center">
                              {m.image ? (
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-border/40 group">
                                  <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                                  {project.status !== 'COMPLETED' && (
                                    <button
                                      type="button"
                                      onClick={() => triggerUploadMaterialImage(m.id)}
                                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200 cursor-pointer rounded-xl"
                                    >
                                      <Upload className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                project.status !== 'COMPLETED' ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => triggerUploadMaterialImage(m.id)}
                                    className="h-8 px-2.5 rounded-xl border border-border bg-background hover:bg-muted text-[10px] font-bold text-muted-foreground flex items-center gap-1 cursor-pointer"
                                  >
                                    <Upload className="h-3.5 w-3.5" />
                                    <span>Tải ảnh</span>
                                  </Button>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground font-semibold italic">Không ảnh</span>
                                )
                              )}
                            </div>

                            {/* Actions (Xóa vật tư - Ẩn đối với STAFF khi dự án đã hoàn thành) */}
                            <div className="col-span-2 flex justify-center">
                              {project.status !== 'COMPLETED' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteMaterial(project.id, m.id)}
                                  className="h-8.5 w-8.5 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer border border-transparent hover:border-destructive/20"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input File upload ẩn để tải ảnh vật tư */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={materialFileInputRef}
                    className="hidden"
                    onChange={handleMaterialImageChange}
                  />
                </CardContent>
              </Card>
            )}

            {/* Chữ ký trong báo cáo in PDF (Ẩn trên UI) */}
            <div className="hidden print-block pt-12">
              <div className="grid grid-cols-2 text-center text-xs font-bold">
                <div>
                  <p className="uppercase text-[10px] text-muted-foreground tracking-wider mb-12">Người Phụ Trách Kỹ Thuật</p>
                  <p className="text-foreground font-bold">{managerUsers.length > 0 ? managerUsers.map((u) => u.name).join(', ') : '_________________________'}</p>
                </div>
                <div>
                  <p className="uppercase text-[10px] text-muted-foreground tracking-wider mb-12">Đại Diện Khách Hàng</p>
                  <p className="text-foreground font-bold">{project.contactName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (1/3): Bình luận & Lịch sử hoạt động */}
        <div className="space-y-6">
          {/* PHẦN BÌNH LUẬN */}
          <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl flex flex-col max-h-[480px] neon-card-glow overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                <Send className="h-4.5 w-4.5 text-primary rotate-45" />
                Thảo luận dự án
              </CardTitle>
              <CardDescription className="text-[10px]">Trao đổi công việc giữa các nhân sự phụ trách</CardDescription>
            </CardHeader>
            
            {/* Danh sách Comment */}
            <CardContent className="flex-1 overflow-y-auto py-4 space-y-4 px-5">
              {projectComments.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-10 font-semibold italic">
                  Chưa có trao đổi nào. Hãy là người viết bình luận đầu tiên!
                </div>
              ) : (
                projectComments.map((comm) => (
                  <div key={comm.id} className="flex gap-2.5 items-start">
                    <img
                      src={comm.userAvatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user'}
                      alt="avatar"
                      className="w-7.5 h-7.5 rounded-xl object-cover border border-border/40 mt-0.5 shrink-0 bg-background"
                    />
                    <div className="space-y-1 flex-1 bg-muted/40 p-2.5 rounded-2xl border border-border/10 min-w-0">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-black text-foreground truncate">{comm.userName}</span>
                        <span className="text-[9px] text-muted-foreground shrink-0 font-medium">
                          {formatDistanceToNow(new Date(comm.timestamp), { addSuffix: true, locale: vi })}
                        </span>
                      </div>
                      <p className="text-[11px] text-foreground leading-normal whitespace-pre-wrap break-words">
                        {comm.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>

            {/* Input gửi Comment */}
            <div className="p-4 border-t border-border/20 bg-muted/10">
              <form onSubmit={handleSendComment} className="flex gap-2">
                <Input
                  value={newCommentContent}
                  onChange={(e) => setNewCommentContent(e.target.value)}
                  placeholder="Viết phản hồi công việc..."
                  className="rounded-2xl h-10 border-border bg-background text-xs placeholder:text-muted-foreground/60 flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  className="rounded-2xl w-10 h-10 bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                </Button>
              </form>
            </div>
          </Card>

          {/* NHẬT KÝ HOẠT ĐỘNG */}
          <Card className="border border-border/10 bg-card/45 backdrop-blur-xl rounded-3xl shadow-xl flex flex-col max-h-[440px] neon-card-glow overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/20">
              <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-primary" />
                Nhật ký hoạt động (Audit log)
              </CardTitle>
              <CardDescription className="text-[10px]">Lịch sử hoạt động của hệ thống đối với hồ sơ</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto py-4 space-y-4 px-5">
              {projectLogs.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-10 font-semibold italic">
                  Chưa ghi nhận hoạt động nào.
                </div>
              ) : (
                <div className="relative border-l border-border/50 pl-3.5 ml-2 space-y-5">
                  {projectLogs.map((log) => (
                    <div key={log.id} className="relative space-y-1 text-xs">
                      {/* Dấu chấm tròn Timeline */}
                      <span className="absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background ring-4 ring-primary/10" />

                      <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
                        <span className="text-foreground font-black">{log.userName}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: vi })}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-normal font-medium pr-1.5">
                        {log.action}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal Nghiệm thu hoàn thành */}
      <ConfirmationModal
        isOpen={isCompleteOpen}
        onClose={() => setIsCompleteOpen(false)}
        onConfirm={handleConfirmComplete}
        title="Nghiệm thu hoàn thành dự án?"
        description={`Hành động này sẽ đóng hồ sơ thi công, nâng tiến độ lên 100%, chuyển dự án sang trạng thái [Đã hoàn thành] và tự động chuyển khoản thưởng nóng 100.000.000 VNĐ tiền ảo vào tài khoản ví của những người phụ trách: ${
          managerUsers.length > 0 ? managerUsers.map((u) => u.name).join(', ') : (currentUser?.name || '')
        }. Bạn có chắc chắn muốn tiến hành không?`}
        confirmText="Xác nhận hoàn thành"
      />
    </div>
  );
}
