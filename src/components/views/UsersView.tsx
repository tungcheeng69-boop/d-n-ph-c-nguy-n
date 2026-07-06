'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore, User, UserRole } from '@/store/useProjectStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmationModal } from '@/components/custom/ConfirmationModal';
import { 
  Users, 
  UserCog, 
  KeyRound, 
  Trash2, 
  ShieldAlert, 
  Check, 
  X, 
  AlertTriangle, 
  UserPlus 
} from 'lucide-react';
import { toast } from 'sonner';

interface UsersViewProps {
  onViewChange: (view: string) => void;
}

export function UsersView({ onViewChange }: UsersViewProps) {
  const { users, currentUser, updateUser, deleteUser, resetUserPassword, registerUser } = useProjectStore();

  const [mounted, setMounted] = useState(false);
  
  // States cho Modal Reset Password
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  // States cho Modal Xóa User
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // States cho Modal Tạo Mới User
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('STAFF');
  const [newPass, setNewPass] = useState('123456');

  // Khóa route cho Admin
  useEffect(() => {
    setMounted(true);
    if (currentUser && currentUser.role !== 'ADMIN') {
      onViewChange('dashboard');
      toast.error('Bạn không có quyền truy cập trang quản lý nhân sự.');
    }
  }, [currentUser]);

  if (!mounted || !currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Format tiền thưởng ảo
  const formatVND = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Sửa nhanh vai trò xoay vòng qua 6 vai trò
  const handleRoleChange = (userId: string, currentRole: UserRole) => {
    const nextRoleMap: Record<UserRole, UserRole> = {
      ADMIN: 'MANAGER',
      MANAGER: 'COMMANDER',
      COMMANDER: 'DEPUTY_COMMANDER',
      DEPUTY_COMMANDER: 'FIELD_ENGINEER',
      FIELD_ENGINEER: 'STAFF',
      STAFF: 'ADMIN'
    };

    // Admin không được tự hạ quyền của mình nếu là tài khoản duy nhất
    if (userId === currentUser.id) {
      toast.error('Bạn không thể tự đổi vai trò của tài khoản Quản trị viên đang đăng nhập.');
      return;
    }

    const targetRole = nextRoleMap[currentRole];
    const getRoleName = (role: UserRole) => {
      switch (role) {
        case 'ADMIN': return 'Quản trị viên';
        case 'MANAGER': return 'Quản lý dự án';
        case 'COMMANDER': return 'Chỉ huy trưởng';
        case 'DEPUTY_COMMANDER': return 'Chỉ huy phó';
        case 'FIELD_ENGINEER': return 'Kỹ thuật hiện trường';
        default: return 'Nhân viên';
      }
    };

    updateUser(userId, { role: targetRole });
    toast.success(`Đã cập nhật vai trò người dùng sang ${getRoleName(targetRole)}.`);
  };

  // Reset mật khẩu
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 4) {
      toast.error('Mật khẩu mới phải từ 4 ký tự trở lên.');
      return;
    }
    if (resettingUser) {
      resetUserPassword(resettingUser.id, newPassword.trim());
      toast.success(`Đã đặt lại mật khẩu cho ${resettingUser.name} thành công.`);
      setResettingUser(null);
      setNewPassword('');
    }
  };

  // Xóa tài khoản
  const handleConfirmDelete = () => {
    if (deletingUser) {
      if (deletingUser.id === currentUser.id) {
        toast.error('Bạn không thể xóa tài khoản Admin chính đang đăng nhập.');
        return;
      }
      deleteUser(deletingUser.id);
      toast.success(`Đã xóa tài khoản ${deletingUser.name} thành công khỏi hệ thống.`);
      setDeletingUser(null);
    }
  };

  // Tạo tài khoản mới
  const handleAddUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newName.trim() || !newPass.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin tài khoản.');
      return;
    }
    const res = registerUser(newEmail.trim(), newName.trim(), newRole, newPass.trim());
    if (res.success) {
      toast.success(`Tạo tài khoản thành công! Tự động cộng thưởng 100M VNĐ vào ví của ${newName}.`);
      setShowAddModal(false);
      setNewEmail('');
      setNewName('');
      setNewRole('STAFF');
      setNewPass('123456');
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="space-y-6 select-none bg-grid-subtle pb-10">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-accent" />
            <span>Quản lý thành viên hệ thống</span>
          </h2>
          <p className="text-xs text-muted-foreground font-medium">
            Quản trị viên có toàn quyền kiểm soát vai trò, đặt lại mật khẩu và cấp phép nhân sự.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          className="rounded-2xl h-11 text-xs font-bold btn-neon-purple cursor-pointer flex items-center gap-1.5"
        >
          <UserPlus className="h-4.5 w-4.5" />
          Thêm thành viên mới
        </Button>
      </div>

      {/* Danh sách người dùng - Glassmorphic Card */}
      <Card className="border border-border/10 bg-card/40 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/10">
          <CardTitle className="text-sm font-black uppercase tracking-wider text-muted-foreground">
            Danh sách nhân sự ({users.length})
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground/80 font-medium">
            Click vào Badge vai trò để chuyển đổi quyền hạn nhanh.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/15 border-b border-border/10 text-muted-foreground/75 font-black uppercase tracking-wider">
                  <th className="p-4 pl-6">Thành viên</th>
                  <th className="p-4">Email đăng nhập</th>
                  <th className="p-4">Vai trò</th>
                  <th className="p-4 text-right">Số dư ví thưởng</th>
                  <th className="p-4 text-center pr-6">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/10 transition-colors duration-200">
                    <td className="p-4 pl-6 flex items-center gap-3">
                      <img
                        src={u.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=user'}
                        alt={u.name}
                        className="w-9 h-9 rounded-xl object-cover bg-background border border-border/15 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-foreground leading-none mb-1 flex items-center gap-1.5">
                          {u.name}
                          {u.id === currentUser.id && (
                            <Badge className="bg-primary/20 text-primary border-0 rounded px-1.5 py-0 text-[8px] font-black uppercase tracking-wider">
                              Bạn
                            </Badge>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">ID: {u.id}</p>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground font-semibold">
                      {u.email}
                    </td>
                    <td className="p-4">
                      {(() => {
                        const getRoleBadgeStyle = (role: UserRole) => {
                          switch (role) {
                            case 'ADMIN':
                              return 'bg-accent/15 border-accent/20 text-accent';
                            case 'MANAGER':
                              return 'bg-primary/10 border-primary/20 text-primary';
                            case 'COMMANDER':
                              return 'bg-amber-500/10 border-amber-500/20 text-amber-500';
                            case 'DEPUTY_COMMANDER':
                              return 'bg-orange-500/10 border-orange-500/20 text-orange-500';
                            case 'FIELD_ENGINEER':
                              return 'bg-cyan-400/10 border-cyan-400/20 text-cyan-400';
                            default:
                              return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
                          }
                        };
                        const getRoleLabel = (role: UserRole) => {
                          switch (role) {
                            case 'ADMIN': return 'Quản trị viên';
                            case 'MANAGER': return 'Quản lý';
                            case 'COMMANDER': return 'Chỉ huy trưởng';
                            case 'DEPUTY_COMMANDER': return 'Chỉ huy phó';
                            case 'FIELD_ENGINEER': return 'Kỹ thuật HT';
                            default: return 'Nhân viên';
                          }
                        };
                        return (
                          <button
                            onClick={() => handleRoleChange(u.id, u.role)}
                            disabled={u.id === currentUser.id}
                            className={`rounded-xl border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider cursor-pointer disabled:cursor-not-allowed transition-all duration-300 ${getRoleBadgeStyle(u.role)}`}
                            title={u.id === currentUser.id ? 'Không thể thay đổi quyền hạn của chính bạn' : 'Click để chuyển vai trò nhanh'}
                          >
                            {getRoleLabel(u.role)}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-right font-black text-amber-500">
                      {formatVND(u.balance)}
                    </td>
                    <td className="p-4 text-center pr-6">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Nút Reset Password */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setResettingUser(u)}
                          className="h-8 w-8 rounded-xl hover:bg-muted border border-transparent hover:border-border/10 cursor-pointer text-muted-foreground hover:text-foreground"
                          title="Đặt lại mật khẩu"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        
                        {/* Nút Xóa (Ẩn nếu xóa chính mình) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingUser(u)}
                          disabled={u.id === currentUser.id}
                          className="h-8 w-8 rounded-xl hover:bg-destructive/10 border border-transparent hover:border-destructive/20 cursor-pointer text-muted-foreground hover:text-destructive disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Xóa tài khoản"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Đặt lại Mật khẩu */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setResettingUser(null)} />
          <Card className="relative w-full max-w-md border border-border/10 bg-card/65 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 overflow-hidden">
            <CardHeader className="p-0 pb-4 border-b border-border/10">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-accent" />
                Reset Mật Khẩu
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-semibold">
                Đặt mật khẩu đăng nhập mới cho tài khoản {resettingUser.name}.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mật khẩu mới *</label>
                <Input
                  type="password"
                  placeholder="Nhập tối thiểu 4 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl border-border/40 h-10 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-accent"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-border/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setResettingUser(null)}
                  className="rounded-xl h-10 text-xs font-bold hover:bg-muted/40 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl h-10 text-xs font-bold btn-neon-purple cursor-pointer"
                >
                  Xác nhận đặt lại
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal Thêm Người Dùng Mới */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <Card className="relative w-full max-w-md border border-border/10 bg-card/65 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 overflow-hidden">
            <CardHeader className="p-0 pb-4 border-b border-border/10">
              <CardTitle className="text-base font-black text-foreground flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                Cấp tài khoản mới
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground font-semibold">
                Khởi tạo thành viên mới và tặng ngay 100M VNĐ ảo vào tài khoản ví thưởng.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleAddUserSubmit} className="space-y-4 pt-4 text-xs font-semibold">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Họ và tên *</label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn Hải"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="rounded-xl border-border/40 h-10 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Email đăng nhập *</label>
                <Input
                  type="email"
                  placeholder="Ví dụ: hainv@tech.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="rounded-xl border-border/40 h-10 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Mật khẩu khởi tạo *</label>
                  <Input
                    type="password"
                    placeholder="Mặc định: 123456"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="rounded-xl border-border/40 h-10 text-xs focus-visible:ring-primary"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Vai trò quyền hạn *</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full rounded-xl border border-border/40 bg-background h-10 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="STAFF">Nhân viên</option>
                    <option value="COMMANDER">Chỉ huy trưởng</option>
                    <option value="DEPUTY_COMMANDER">Chỉ huy phó</option>
                    <option value="FIELD_ENGINEER">Kỹ thuật hiện trường</option>
                    <option value="MANAGER">Quản lý dự án</option>
                    <option value="ADMIN">Quản trị viên (Admin)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/10">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl h-10 text-xs font-bold hover:bg-muted/40 cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl h-10 text-xs font-bold btn-neon-cyan cursor-pointer"
                >
                  Tạo tài khoản
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Confirmation Modal Xóa User */}
      <ConfirmationModal
        isOpen={deletingUser !== null}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        title="Xóa tài khoản nhân sự?"
        description={`Hành động này sẽ xóa vĩnh viễn tài khoản của ${deletingUser?.name} khỏi hệ thống TECHPROJECT. Nhân viên này sẽ không thể đăng nhập được nữa. Bạn có chắc chắn muốn tiếp tục không?`}
        confirmText="Xác nhận xóa tài khoản"
      />
    </div>
  );
}
