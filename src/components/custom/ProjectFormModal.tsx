'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjectStore, Project, ProjectStatus } from '@/store/useProjectStore';
import { ImagePlus, X, Calendar, User, Phone, Briefcase, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectToEdit?: Project; // Nếu có -> Chế độ Edit, nếu không -> Chế độ Create
}

export function ProjectFormModal({ isOpen, onClose, projectToEdit }: ProjectFormModalProps) {
  const { addProject, updateProject, users, currentUser } = useProjectStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States của Form
  const [name, setName] = useState('');
  const [surveyDate, setSurveyDate] = useState('');
  const [expectedStartDate, setExpectedStartDate] = useState('');
  const [surveyor, setSurveyor] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('SURVEY');
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Danh sách nhân sự có thể làm Manager phụ trách dự án (Tất cả trừ Admin)
  const candidateManagers = users.filter((u) => u.role !== 'ADMIN');

  const roleLabels: Record<string, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Quản lý',
    COMMANDER: 'Chỉ huy trưởng',
    DEPUTY_COMMANDER: 'Chỉ huy phó',
    FIELD_ENGINEER: 'Kỹ thuật hiện trường',
    STAFF: 'Nhân viên'
  };

  // Load thông tin khi Edit
  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setSurveyDate(projectToEdit.surveyDate);
      setExpectedStartDate(projectToEdit.expectedStartDate);
      setSurveyor(projectToEdit.surveyor);
      setContactName(projectToEdit.contactName);
      setContactPhone(projectToEdit.contactPhone);
      setStatus(projectToEdit.status);
      setManagerIds(projectToEdit.managerIds || []);
      setImages(projectToEdit.images || []);
    } else {
      // Mặc định tạo mới
      setName('');
      setSurveyDate(new Date().toISOString().split('T')[0]); // Mặc định ngày hôm nay
      setExpectedStartDate('');
      setSurveyor(currentUser?.name || '');
      setContactName('');
      setContactPhone('');
      setStatus('SURVEY');
      setManagerIds([]);
      setImages([]);
    }
  }, [projectToEdit, isOpen, currentUser]);

  // Xử lý upload ảnh ảo (createObjectURL)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageUrl = URL.createObjectURL(file);
      newImages.push(imageUrl);
    }

    setImages((prev) => [...prev, ...newImages]);
    toast.success(`Đã tải lên ${files.length} ảnh xem trước thành công.`);
  };

  const removeImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Vui lòng nhập Tên dự án.');
      return;
    }

    const isOngoingOrCompleted = status === 'ONGOING' || status === 'COMPLETED';
    const isReachedExpectedStart = expectedStartDate && new Date(expectedStartDate) <= new Date('2026-07-04');
    const shouldSkipSurvey = isOngoingOrCompleted || isReachedExpectedStart;

    if (!shouldSkipSurvey && !surveyDate) {
      toast.error('Vui lòng chọn Ngày khảo sát.');
      return;
    }
    if (!expectedStartDate) {
      toast.error('Vui lòng chọn Ngày dự tính triển khai.');
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      toast.error('Vui lòng nhập Thông tin người liên hệ.');
      return;
    }
    if (status !== 'SURVEY' && managerIds.length === 0) {
      toast.error('Dự án thi công/hoàn thành bắt buộc phải có ít nhất một Người phụ trách.');
      return;
    }

    setLoading(true);

    const projectData = {
      name,
      images,
      surveyDate: shouldSkipSurvey ? '' : surveyDate,
      expectedStartDate,
      surveyor: shouldSkipSurvey ? '' : surveyor,
      contactName,
      contactPhone,
      status,
      managerIds: status !== 'SURVEY' ? managerIds : [],
      startDate: status !== 'SURVEY' ? (projectToEdit?.startDate || new Date().toISOString().split('T')[0]) : undefined,
    };

    setTimeout(() => {
      if (projectToEdit) {
        // Cập nhật
        updateProject(projectToEdit.id, projectData);
        toast.success('Đã cập nhật dự án thành công.');
      } else {
        // Thêm mới
        addProject(projectData);
        toast.success(shouldSkipSurvey ? 'Đã tạo hồ sơ thi công mới thành công.' : 'Đã tạo dự án khảo sát mới thành công.');
      }
      setLoading(false);
      onClose();
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-3xl max-w-2xl border border-border/40 select-none bg-card p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-bold tracking-tight">
            {projectToEdit ? 'Chỉnh sửa thông tin dự án' : 'Tạo hồ sơ khảo sát dự án mới'}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Điền các thông số kỹ thuật và hồ sơ thông tin khách hàng bên dưới.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Tên dự án */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Tên dự án kỹ thuật *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Thi công pin mặt trời áp mái tòa nhà A..."
              className="rounded-2xl border-border bg-muted/20 h-11 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ngày dự kiến triển khai */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Ngày dự tính triển khai *
              </label>
              <Input
                type="date"
                value={expectedStartDate}
                onChange={(e) => setExpectedStartDate(e.target.value)}
                className="rounded-2xl border-border bg-muted/20 h-11 text-xs cursor-pointer"
              />
            </div>

            {/* Trạng thái dự án */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" /> Trạng thái
              </label>
              <Select
                value={status}
                onValueChange={(val) => {
                  if (val) {
                    setStatus(val as ProjectStatus);
                    if (val === 'SURVEY') setManagerIds([]);
                  }
                }}
              >
                <SelectTrigger className="rounded-2xl border-border bg-muted/20 h-11 text-xs cursor-pointer">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl bg-card border-border">
                  <SelectItem value="SURVEY" className="rounded-xl text-xs cursor-pointer focus:bg-primary/20">
                    Khảo sát (Dự án mới)
                  </SelectItem>
                  <SelectItem value="ONGOING" className="rounded-xl text-xs cursor-pointer focus:bg-primary/20">
                    Đang thi công (Đang thực hiện)
                  </SelectItem>
                  <SelectItem value="COMPLETED" className="rounded-xl text-xs cursor-pointer focus:bg-primary/20">
                    Đã bàn giao (Đã hoàn thành)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ngày khảo sát (Ẩn nếu đang thi công hoặc đến ngày thi công) */}
            {!(status === 'ONGOING' || status === 'COMPLETED' || (expectedStartDate && new Date(expectedStartDate) <= new Date('2026-07-04'))) && (
              <div className="space-y-1.5 animate-in fade-in duration-300">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Ngày khảo sát *
                </label>
                <Input
                  type="date"
                  value={surveyDate}
                  onChange={(e) => setSurveyDate(e.target.value)}
                  className="rounded-2xl border-border bg-muted/20 h-11 text-xs cursor-pointer"
                />
              </div>
            )}

            {/* Người khảo sát (Ẩn nếu đang thi công hoặc đến ngày thi công) */}
            {!(status === 'ONGOING' || status === 'COMPLETED' || (expectedStartDate && new Date(expectedStartDate) <= new Date('2026-07-04'))) && (
              <div className="space-y-1.5 animate-in fade-in duration-300">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Người khảo sát
                </label>
                <Input
                  value={surveyor}
                  onChange={(e) => setSurveyor(e.target.value)}
                  placeholder="Họ và tên..."
                  className="rounded-2xl border-border bg-muted/20 h-11 text-xs"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Người liên hệ + SĐT */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Người liên hệ khách hàng *
              </label>
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Ví dụ: Nguyễn Văn Khách..."
                className="rounded-2xl border-border bg-muted/20 h-11 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> Số điện thoại *
              </label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="Số điện thoại liên lạc..."
                className="rounded-2xl border-border bg-muted/20 h-11 text-xs"
              />
            </div>
          </div>

          {/* Chọn người phụ trách (nếu trạng thái là ONGOING hoặc COMPLETED) */}
          {status !== 'SURVEY' && (
              <div className="grid grid-cols-2 gap-2 mt-1">
                {candidateManagers.map((cand) => {
                  const isChecked = managerIds.includes(cand.id);
                  return (
                    <button
                      key={cand.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setManagerIds((prev) => prev.filter((id) => id !== cand.id));
                        } else {
                          setManagerIds((prev) => [...prev, cand.id]);
                        }
                      }}
                      className={`flex items-center gap-2.5 p-2.5 border rounded-2xl text-left transition-all duration-300 cursor-pointer ${
                        isChecked
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border bg-muted/10 text-muted-foreground hover:bg-muted/20'
                      }`}
                    >
                      <img
                        src={cand.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user'}
                        alt={cand.name}
                        className="w-7 h-7 rounded-xl object-cover shrink-0 border border-border/40"
                      />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold truncate leading-none mb-1">{cand.name}</p>
                        <p className="text-[9px] opacity-75 font-semibold">{roleLabels[cand.role] || cand.role}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
          )}

          {/* Upload ảnh dự án (Khảo sát) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
              Hình ảnh khảo sát dự án
            </label>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl border-border border-dashed h-16 w-32 flex flex-col gap-1 items-center justify-center bg-muted/10 hover:bg-muted/20 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground font-semibold">Tải ảnh lên</span>
              </Button>
              <input
                type="file"
                multiple
                accept="image/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Grid Preview ảnh */}
              <div className="flex-1 flex gap-2.5 overflow-x-auto pb-1 max-w-[480px]">
                {images.map((imgUrl, index) => (
                  <div key={index} className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-border/40 group">
                    <img src={imgUrl} alt="preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-white hover:bg-destructive opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border/20 grid grid-cols-2 gap-2 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-2xl border-border h-11 text-xs font-semibold cursor-pointer"
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-2xl h-11 text-xs font-semibold cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  {projectToEdit ? 'Cập nhật dự án' : 'Khởi tạo dự án'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
