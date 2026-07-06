'use client';

import React, { useState, useEffect } from 'react';
import { useProjectStore, Project, ProjectStatus } from '@/store/useProjectStore';
import { ProjectFormModal } from '@/components/custom/ProjectFormModal';
import { ConfirmationModal } from '@/components/custom/ConfirmationModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FolderPlus,
  Search,
  SlidersHorizontal,
  Calendar,
  User,
  ArrowUpDown,
  Trash2,
  Edit2,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const { projects, currentUser, deleteProject, users } = useProjectStore();
  
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<ProjectStatus>('SURVEY');
  
  // States Tìm kiếm, Lọc, Sắp xếp
  const [searchTerm, setSearchTerm] = useState('');
  const [filterManager, setFilterManager] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // newest, progress, name
  const [filterMyProjects, setFilterMyProjects] = useState(false);

  // Modals States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | undefined>(undefined);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [projectIdToDelete, setProjectIdToDelete] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleOpenCreate = () => {
    setProjectToEdit(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (project: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToEdit(project);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectIdToDelete(id);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (projectIdToDelete) {
      deleteProject(projectIdToDelete);
      toast.success('Đã xóa hồ sơ dự án thành công.');
      setProjectIdToDelete(null);
    }
  };

  // Mốc thời gian hệ thống: 2026-07-04
  const CURRENT_DATE_STR = '2026-07-04';
  const getDaysRemaining = (targetDateStr: string) => {
    if (!targetDateStr) return 999;
    const targetDate = new Date(targetDateStr);
    const currentDate = new Date(CURRENT_DATE_STR);
    const diffTime = targetDate.getTime() - currentDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isFieldStaff = currentUser && ['COMMANDER', 'DEPUTY_COMMANDER', 'FIELD_ENGINEER', 'STAFF'].includes(currentUser.role);

  // Lọc và Sắp xếp danh sách dự án
  const filteredProjects = projects
    // 0. Phân quyền lọc: Nhân viên kỹ thuật chỉ thấy dự án được giao cho mình
    .filter((p) => {
      if (isFieldStaff) {
        return p.managerIds?.includes(currentUser?.id || '');
      }
      if (filterMyProjects && currentUser) {
        return p.managerIds?.includes(currentUser.id);
      }
      return true;
    })
    // 1. Lọc theo Tab (trạng thái)
    .filter((p) => p.status === activeTab)
    // 2. Tìm kiếm theo tên
    .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    // 3. Lọc theo Người phụ trách
    .filter((p) => {
      if (filterManager === 'ALL') return true;
      if (filterManager === 'UNASSIGNED') return !p.managerIds || p.managerIds.length === 0;
      return p.managerIds?.includes(filterManager);
    })
    // 4. Sắp xếp
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'progress') {
        return b.progress - a.progress;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  return (
    <div className="space-y-6 select-none">
      {/* Header trang danh sách */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">Hồ sơ dự án</h2>
          <p className="text-xs text-muted-foreground font-medium">
            Quản lý toàn bộ tiến trình dự án kỹ thuật từ khảo sát đến hoàn thành.
          </p>
        </div>

        {/* Nút Tạo dự án mới - Chỉ dành cho Admin và Manager */}
        {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') && (
          <Button
            onClick={handleOpenCreate}
            className="rounded-2xl h-11 text-xs font-bold btn-neon-cyan cursor-pointer flex items-center gap-1.5"
          >
            <FolderPlus className="h-4.5 w-4.5" />
            Tạo dự án mới
          </Button>
        )}
      </div>

      {/* Bộ lọc Tìm kiếm & Sắp xếp */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-3xl bg-muted/40 border border-border/20">
        {/* Tìm kiếm */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm dự án..."
            className="pl-9 h-11 bg-background border-border rounded-2xl text-xs placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Lọc người phụ trách */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline" />
          <Select value={filterManager} onValueChange={(val) => { if (val) setFilterManager(val); }}>
            <SelectTrigger className="h-11 bg-background border-border rounded-2xl text-xs cursor-pointer">
              <SelectValue placeholder="Người phụ trách" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border bg-card">
              <SelectItem value="ALL" className="rounded-xl text-xs cursor-pointer focus:bg-primary/20">
                Tất cả phụ trách
              </SelectItem>
              <SelectItem value="UNASSIGNED" className="rounded-xl text-xs cursor-pointer focus:bg-primary/20">
                Chưa phân công
              </SelectItem>
              {users
                .filter((u) => u.role !== 'ADMIN')
                .map((u) => (
                  <SelectItem key={u.id} value={u.id} className="rounded-xl text-xs cursor-pointer focus:bg-primary/20">
                    {u.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sắp xếp */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0 hidden sm:inline" />
          <Select value={sortBy} onValueChange={(val) => { if (val) setSortBy(val); }}>
            <SelectTrigger className="h-11 bg-background border-border rounded-2xl text-xs cursor-pointer">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-border bg-card">
              <SelectItem value="newest" className="rounded-xl text-xs cursor-pointer focus:bg-primary/20">
                Ngày tạo (Mới nhất)
              </SelectItem>
              <SelectItem value="progress" className="rounded-xl text-xs cursor-pointer focus:bg-primary/20">
                Tiến độ thi công
              </SelectItem>
              <SelectItem value="name" className="rounded-xl text-xs cursor-pointer focus:bg-primary/20">
                Tên dự án (A-Z)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lọc Dự án của tôi (Chỉ dành cho Admin / Manager) */}
        {!isFieldStaff && (
          <div className="flex items-center justify-between px-3.5 bg-background border border-border rounded-2xl h-11">
            <span className="text-[10px] font-black text-muted-foreground/75 uppercase tracking-wider">
              Dự án của tôi
            </span>
            <button
              onClick={() => setFilterMyProjects(!filterMyProjects)}
              className={cn(
                "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                filterMyProjects ? "bg-primary" : "bg-muted"
              )}
            >
              <span
                className={cn(
                  "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-background shadow transition duration-200 ease-in-out",
                  filterMyProjects ? "translate-x-4.5" : "translate-x-0"
                )}
              />
            </button>
          </div>
        )}
      </div>

      {/* Tabs Phân loại trạng thái */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as ProjectStatus)}
        className="w-full space-y-6"
      >
        <TabsList className="bg-muted/40 border border-border/20 rounded-2xl p-1 gap-1.5 h-12 w-full max-w-[500px]">
          <TabsTrigger
            value="SURVEY"
            className="rounded-xl text-xs font-bold cursor-pointer transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1"
          >
            Dự án khảo sát ({projects.filter((p) => p.status === 'SURVEY').length})
          </TabsTrigger>
          <TabsTrigger
            value="ONGOING"
            className="rounded-xl text-xs font-bold cursor-pointer transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1"
          >
            Đang thi công ({projects.filter((p) => p.status === 'ONGOING').length})
          </TabsTrigger>
          <TabsTrigger
            value="COMPLETED"
            className="rounded-xl text-xs font-bold cursor-pointer transition-all duration-300 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex-1"
          >
            Đã bàn giao ({projects.filter((p) => p.status === 'COMPLETED').length})
          </TabsTrigger>
        </TabsList>

        {/* Khung danh sách */}
        <TabsContent value={activeTab} className="focus-visible:outline-none">
          <AnimatePresence mode="popLayout">
            {filteredProjects.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-border/40 bg-card/60"
              >
                <AlertTriangle className="h-10 w-10 text-muted-foreground mb-3" />
                <h3 className="text-sm font-bold text-foreground">Không tìm thấy dự án</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Không có dự án nào khớp với bộ lọc tìm kiếm hiện tại của bạn.
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProjects.map((project, idx) => {
                  // Xác định người phụ trách
                  const managerUsers = users.filter((u) => project.managerIds?.includes(u.id));

                  // Tính toán deadline warning
                  let isNearDeadline = false;
                  let daysRemaining = 999;
                  if (project.status !== 'COMPLETED') {
                    let dl = project.expectedStartDate;
                    if (project.status === 'ONGOING' && project.handoverPhases.length > 0) {
                      const pend = project.handoverPhases
                        .filter((h) => h.status === 'PENDING')
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      if (pend.length > 0) dl = pend[0].date;
                    }
                    daysRemaining = getDaysRemaining(dl);
                    isNearDeadline = daysRemaining <= 3;
                  }

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, delay: idx * 0.05 }}
                    >
                      <Link href={`/projects/${project.id}`} className="block group">
                        <Card
                          className={`rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] bg-card/45 backdrop-blur-xl flex flex-col justify-between overflow-hidden h-full cursor-pointer neon-card-glow ${
                            isNearDeadline
                              ? daysRemaining <= 1
                                ? 'border-destructive/30 bg-destructive/5 dark:bg-destructive/10'
                                : 'border-amber-500/30 bg-amber-500/5 dark:bg-amber-500/10'
                              : 'border-border/10'
                          }`}
                        >
                          <CardContent className="p-0 flex flex-col h-full">
                            {/* Dự án thumbnail ảnh */}
                            <div className="relative w-full h-44 bg-muted overflow-hidden">
                              <img
                                src={
                                  project.images.length > 0
                                    ? project.images[0]
                                    : 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=800'
                                }
                                alt="thumbnail"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />

                              {/* Badge Trạng thái */}
                              <div className="absolute top-4 left-4">
                                <Badge
                                  className={`rounded-xl border shadow-sm px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
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
                                    : 'Đã bàn giao'}
                                </Badge>
                              </div>

                              {/* Nhãn cảnh báo deadline nhấp nháy */}
                              {isNearDeadline && (
                                <div className="absolute top-4 right-4">
                                  <Badge
                                    className={`rounded-xl px-2.5 py-1 border text-[10px] font-black flex items-center gap-1 uppercase tracking-wider animate-pulse ${
                                      daysRemaining <= 1
                                        ? 'bg-destructive text-destructive-foreground border-destructive'
                                        : 'bg-amber-500 text-slate-900 border-amber-500'
                                    }`}
                                  >
                                    <AlertTriangle className="h-3 w-3" />
                                    {daysRemaining < 0
                                      ? 'Quá hạn'
                                      : daysRemaining === 0
                                      ? 'Hạn Hôm Nay'
                                      : `Hạn còn ${daysRemaining} ngày`}
                                  </Badge>
                                </div>
                              )}
                            </div>

                            {/* Nội dung text */}
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-2">
                                <h3 className="font-bold text-sm md:text-base text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors duration-200">
                                  {project.name}
                                </h3>

                                <div className="text-[11px] text-muted-foreground font-semibold pt-1">
                                  {project.surveyDate ? (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span>Khảo sát: {project.surveyDate}</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 truncate">
                                        <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                        <span>Triển khai: {project.expectedStartDate}</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                                      <span>Thi công triển khai: {project.expectedStartDate}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Phân công + Tiến độ vòng tròn SVG + Actions */}
                              <div className="flex items-center justify-between pt-3.5 border-t border-border/10 gap-3">
                                {/* Thông tin nhân sự phụ trách (Avatar Stack) */}
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  {managerUsers.length > 0 ? (
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <div className="flex -space-x-2 overflow-hidden shrink-0">
                                        {managerUsers.slice(0, 3).map((u) => (
                                          <img
                                            key={u.id}
                                            src={u.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user'}
                                            alt={u.name}
                                            title={u.name}
                                            className="inline-block w-7 h-7 rounded-xl ring-2 ring-background object-cover shrink-0"
                                          />
                                        ))}
                                        {managerUsers.length > 3 && (
                                          <div className="flex items-center justify-center w-7 h-7 rounded-xl ring-2 ring-background bg-muted text-[8px] font-black text-muted-foreground shrink-0">
                                            +{managerUsers.length - 3}
                                          </div>
                                        )}
                                      </div>
                                      <span className="text-[10px] font-bold text-foreground truncate leading-none">
                                        {managerUsers.map((u) => u.name.split(' ').pop()).join(', ')}
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                                      <User className="h-4 w-4" />
                                      <span className="text-[10px] font-bold italic">Chưa giao việc</span>
                                    </div>
                                  )}
                                </div>

                                {/* Tiến độ vòng tròn (Circular Progress SVG) */}
                                {project.status === 'ONGOING' && (
                                  <div className="relative flex items-center justify-center w-11 h-11 shrink-0 bg-background/30 rounded-full border border-border/5">
                                    <svg className="w-full h-full transform -rotate-90">
                                      <circle
                                        cx="22"
                                        cy="22"
                                        r="16"
                                        className="text-muted/15"
                                        strokeWidth="3"
                                        stroke="currentColor"
                                        fill="transparent"
                                      />
                                      <circle
                                        cx="22"
                                        cy="22"
                                        r="16"
                                        className="text-primary transition-all duration-500"
                                        strokeWidth="3"
                                        strokeDasharray={100.53} // 2 * Math.PI * 16
                                        strokeDashoffset={100.53 - (project.progress / 100) * 100.53}
                                        strokeLinecap="round"
                                        stroke="currentColor"
                                        fill="transparent"
                                      />
                                    </svg>
                                    <span className="absolute text-[8px] font-black text-foreground">{project.progress}%</span>
                                  </div>
                                )}

                                {/* Nút thao tác (Sửa/Xóa) - Chỉ dành cho Admin và Manager */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER') ? (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-border/30 cursor-pointer shrink-0"
                                        onClick={(e) => handleOpenEdit(project, e)}
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive border border-transparent hover:border-destructive/20 cursor-pointer shrink-0"
                                        onClick={(e) => handleOpenDelete(project.id, e)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </>
                                  ) : (
                                    <div className="text-[9px] text-primary font-black uppercase tracking-wider flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 shrink-0">
                                      Chi tiết <ChevronRight className="h-3.5 w-3.5" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </TabsContent>
      </Tabs>

      {/* Form modal tạo mới/sửa dự án */}
      <ProjectFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        projectToEdit={projectToEdit}
      />

      {/* Modal xác nhận xóa */}
      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xóa hồ sơ dự án?"
        description="Hành động này sẽ xóa vĩnh viễn toàn bộ hồ sơ dự án kỹ thuật, danh sách vật tư, đợt bàn giao, nhật ký hoạt động và bình luận liên quan. Bạn có chắc chắn muốn xóa không?"
        confirmText="Xóa vĩnh viễn"
        variant="destructive"
      />
    </div>
  );
}
