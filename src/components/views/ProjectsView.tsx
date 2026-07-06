'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectStore, Project, ProjectStatus } from '@/store/useProjectStore';
import { ConfirmationModal } from '@/components/custom/ConfirmationModal';
import { ProjectFormModal } from '@/components/custom/ProjectFormModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  FolderKanban,
  Search,
  Plus,
  Calendar,
  User,
  ClipboardList,
  Edit2,
  Trash2,
  Filter,
  CheckCircle,
  Briefcase,
  AlertTriangle,
  Gift,
  ChevronRight
} from 'lucide-react';

interface ProjectsViewProps {
  onViewChange: (view: string) => void;
  onSelectProject: (id: string) => void;
}

export function ProjectsView({ onViewChange, onSelectProject }: ProjectsViewProps) {
  const { projects, users, currentUser, deleteProject, changeProjectStatus, setView } = useProjectStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [onlyMyProjects, setOnlyMyProjects] = useState(false);

  // States cho Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  if (!currentUser) return null;

  // Lọc danh sách dự án
  const filteredProjects = projects.filter((project) => {
    // Tìm kiếm tên hoặc số điện thoại KH
    const matchSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.contactName.toLowerCase().includes(searchTerm.toLowerCase());

    // Lọc theo trạng thái
    const matchStatus = statusFilter === 'ALL' || project.status === statusFilter;

    // Lọc dự án tôi phụ trách (Cho MANAGER, COMMANDER, DEPUTY, FIELD_ENGINEER, STAFF)
    const matchAssigned = !onlyMyProjects || project.managerIds?.includes(currentUser.id);

    return matchSearch && matchStatus && matchAssigned;
  });

  const handleOpenEdit = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteProjectId(id);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (deleteProjectId) {
      deleteProject(deleteProjectId);
      toast.success('Đã xóa dự án kỹ thuật thành công.');
      setIsDeleteOpen(false);
      setDeleteProjectId(null);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'SURVEY':
        return { label: 'Khảo sát', class: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' };
      case 'ONGOING':
        return { label: 'Đang thi công', class: 'bg-primary/10 text-primary border border-primary/20' };
      default:
        return { label: 'Đã bàn giao', class: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' };
    }
  };

  return (
    <div className="space-y-6 select-none pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border/10">
        <div className="space-y-1">
          <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-primary shrink-0" />
            HỒ SƠ DỰ ÁN KỸ THUẬT
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Danh sách khảo sát thực tế, thi công, vật tư kiểm định và nghiệm thu bàn giao
          </p>
        </div>
        {(currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') && (
          <Button
            onClick={() => setIsAddOpen(true)}
            className="rounded-2xl cursor-pointer font-bold text-xs h-10 px-4 btn-neon-cyan shrink-0"
          >
            <Plus className="h-4.5 w-4.5 mr-1" />
            Tạo dự án mới
          </Button>
        )}
      </div>

      {/* Bộ lọc dự án (Filters) */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-card/30 border border-border/10 p-4.5 rounded-3xl backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          {/* Thanh tìm kiếm */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Tìm kiếm dự án, người liên hệ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10.5 bg-slate-950/20 border-border/10 text-xs rounded-2xl focus-visible:ring-primary w-full"
            />
          </div>

          {/* Lọc Trạng thái */}
          <div className="flex gap-1 bg-slate-950/20 border border-border/10 rounded-2xl p-1 shrink-0">
            {[
              { value: 'ALL', label: 'Tất cả' },
              { value: 'SURVEY', label: 'Khảo sát' },
              { value: 'ONGOING', label: 'Thi công' },
              { value: 'COMPLETED', label: 'Hoàn thành' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                  statusFilter === tab.value
                    ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lọc dự án tôi phụ trách (Cho MANAGER, COMMANDER, DEPUTY_COMMANDER, FIELD_ENGINEER, STAFF) */}
        {currentUser.role !== 'ADMIN' && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/20 border border-border/10 rounded-2xl shrink-0 cursor-pointer select-none" onClick={() => setOnlyMyProjects(!onlyMyProjects)}>
            <input
              type="checkbox"
              id="my-projects-chk"
              checked={onlyMyProjects}
              onChange={() => {}} // Handle click on container instead
              className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="my-projects-chk" className="text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-foreground cursor-pointer">
              Dự án do tôi phụ trách
            </label>
          </div>
        )}
      </div>

      {/* Grid Danh sách dự án */}
      <AnimatePresence mode="popLayout">
        {filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border/20 rounded-3xl bg-card/10"
          >
            <FolderKanban className="h-10 w-10 text-muted-foreground/30 animate-pulse mb-3" />
            <h4 className="text-sm font-bold text-foreground">Không tìm thấy dự án kỹ thuật nào</h4>
            <p className="text-[10px] text-muted-foreground/80 font-medium mt-1">
              Thử thay đổi bộ lọc tìm kiếm hoặc tạo một dự án mới
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProjects.map((project, idx) => {
              const badge = getStatusBadge(project.status);
              const managerUsers = users.filter((u) => project.managerIds?.includes(u.id));

              // Tính toán hạn chót gần kề
              const now = new Date('2026-07-04');
              const pendingPhases = project.handoverPhases?.filter((h) => h.status === 'PENDING') || [];
              let nearestDeadlineStr = '';
              if (pendingPhases.length > 0) {
                const sortedPhases = [...pendingPhases].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                nearestDeadlineStr = sortedPhases[0].date;
              }

              const dDate = nearestDeadlineStr ? new Date(nearestDeadlineStr) : null;
              const sDate = project.expectedStartDate ? new Date(project.expectedStartDate) : null;
              let daysRemaining = 999;
              if (project.status === 'ONGOING' && dDate) {
                daysRemaining = Math.ceil((dDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              } else if (project.status === 'SURVEY' && sDate) {
                daysRemaining = Math.ceil((sDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              }
              const isNearDeadline = daysRemaining <= 3 && project.status !== 'COMPLETED';

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                >
                  <div onClick={() => onSelectProject(project.id)} className="block group cursor-pointer">
                    <Card
                      className={`rounded-3xl border transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] bg-card/45 backdrop-blur-xl flex flex-col justify-between overflow-hidden h-full neon-card-glow ${
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

                          {/* Trạng thái badge đè lên ảnh */}
                          <Badge className={`absolute top-4 left-4 rounded-xl px-2.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${badge.class} border shadow-lg backdrop-blur-md`}>
                            {badge.label}
                          </Badge>

                          {/* Cảnh báo deadline nguy cấp */}
                          {isNearDeadline && (
                            <Badge className="absolute top-4 right-4 rounded-xl px-2 py-0.5 text-[8px] font-black uppercase tracking-wider bg-destructive text-destructive-foreground border border-destructive/20 shadow-lg animate-pulse">
                              <AlertTriangle className="w-3 h-3 mr-1 shrink-0" />
                              Còn {daysRemaining === 0 ? 'Hôm nay' : `${daysRemaining} ngày`}
                            </Badge>
                          )}
                        </div>

                        {/* Thông tin mô tả chính */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors duration-200 line-clamp-2 leading-snug">
                              {project.name}
                            </h3>
                            <div className="flex flex-col gap-2 pt-1">
                              {project.status === 'SURVEY' && project.surveyDate && (
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                  <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                  <span>Ngày khảo sát: {project.surveyDate}</span>
                                </div>
                              )}
                              {project.expectedStartDate && (
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                  <Briefcase className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                  <span>Khởi công dự kiến: {project.expectedStartDate}</span>
                                </div>
                              )}
                              {project.status !== 'SURVEY' && project.startDate && (
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                  <span>Khởi công thực tế: {project.startDate}</span>
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
                                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      {/* Modals Form */}
      <ProjectFormModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
      />

      {selectedProject && (
        <ProjectFormModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedProject(null);
          }}
          projectToEdit={selectedProject}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setDeleteProjectId(null);
        }}
        onConfirm={handleDelete}
        title="Xóa hồ sơ dự án kỹ thuật?"
        description="Lưu ý: Hành động này là vĩnh viễn và không thể khôi phục lại. Toàn bộ nhật ký thi công, danh sách vật tư và bình luận sẽ bị xóa hoàn toàn khỏi cơ sở dữ liệu."
      />
    </div>
  );
}
