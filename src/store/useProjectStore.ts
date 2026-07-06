import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Định nghĩa types
export type UserRole = 'ADMIN' | 'MANAGER' | 'COMMANDER' | 'DEPUTY_COMMANDER' | 'FIELD_ENGINEER' | 'STAFF';

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // Mật khẩu người dùng
  role: UserRole;
  balance: number; // Tiền thưởng ảo (VNĐ)
  avatar?: string;
}

export type ProjectStatus = 'SURVEY' | 'ONGOING' | 'COMPLETED';

export interface HandoverPhase {
  id: string;
  name: string;
  date: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  image?: string; // URL preview ảnh vật tư
}

export interface Project {
  id: string;
  name: string;
  images: string[]; // Danh sách URL preview ảnh khảo sát
  surveyDate: string;
  expectedStartDate: string;
  surveyor: string;
  contactName: string;
  contactPhone: string;
  status: ProjectStatus;
  progress: number; // 0 - 100
  managerIds: string[]; // Danh sách ID những người phụ trách (Staff / Manager)
  startDate?: string;
  handoverPhases: HandoverPhase[];
  materials: Material[];
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
}

export interface Comment {
  id: string;
  projectId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: string;
}

interface ProjectState {
  users: User[];
  currentUser: User | null;
  projects: Project[];
  activityLogs: ActivityLog[];
  comments: Comment[];
  isHydrated: boolean;
  currentView: string;
  activeProjectId: string | null;
  setView: (view: string, projectId?: string | null) => void;

  // Actions Auth
  registerUser: (email: string, name: string, role: UserRole, password?: string) => { success: boolean; message: string };
  loginUser: (email: string, password?: string) => { success: boolean; message: string };
  logoutUser: () => void;
  updateProfile: (name: string, avatar: string) => void;
  
  // Actions User Management (Admin)
  updateUser: (userId: string, updatedFields: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  resetUserPassword: (userId: string, newPassword: string) => void;
  
  // Actions Projects
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'handoverPhases' | 'materials' | 'progress'>) => void;
  updateProject: (id: string, updatedFields: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  changeProjectStatus: (id: string, status: ProjectStatus) => void;
  
  // Actions Sub-Entities (Materials / Handovers)
  addMaterial: (projectId: string, material: Omit<Material, 'id'>) => void;
  updateMaterialImage: (projectId: string, materialId: string, image: string) => void;
  deleteMaterial: (projectId: string, materialId: string) => void;
  addHandoverPhase: (projectId: string, phase: Omit<HandoverPhase, 'id' | 'status'>) => void;
  toggleHandoverStatus: (projectId: string, phaseId: string) => void;
  deleteHandoverPhase: (projectId: string, phaseId: string) => void;
  
  // Actions Comments & Logs
  addComment: (projectId: string, content: string) => void;
  addLog: (projectId: string, action: string) => void;
  setHydrated: () => void;
}

// Khởi tạo fake users ban đầu
const FAKE_USERS: User[] = [
  {
    id: 'u-admin',
    email: 'admin@tech.com',
    name: 'Nguyễn Văn Admin',
    password: '123456',
    role: 'ADMIN',
    balance: 150000000,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'u-manager',
    email: 'manager@tech.com',
    name: 'Trần Thị Quản Lý',
    password: '123456',
    role: 'MANAGER',
    balance: 120000000,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'u-commander',
    email: 'commander@tech.com',
    name: 'Nguyễn Văn Chỉ Huy',
    password: '123456',
    role: 'COMMANDER',
    balance: 100000000,
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'u-deputy',
    email: 'deputy@tech.com',
    name: 'Trần Văn Phó Chỉ Huy',
    password: '123456',
    role: 'DEPUTY_COMMANDER',
    balance: 100000000,
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'u-engineer',
    email: 'engineer@tech.com',
    name: 'Lê Văn Kỹ Thuật',
    password: '123456',
    role: 'FIELD_ENGINEER',
    balance: 100000000,
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'u-staff-a',
    email: 'employee@tech.com',
    name: 'Lê Văn Nhân Viên',
    password: '123456',
    role: 'STAFF',
    balance: 100000000,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
];

// Khởi tạo projects mẫu ban đầu
const FAKE_PROJECTS: Project[] = [
  {
    id: 'p-1',
    name: 'Khảo sát lắp đặt Pin Năng lượng Mặt trời - Tòa nhà Landmark 81',
    images: [
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=800',
    ],
    surveyDate: '2026-07-01',
    expectedStartDate: '2026-07-15',
    surveyor: 'Trần Thị Quản Lý',
    contactName: 'Mr. John Doe',
    contactPhone: '0901234567',
    status: 'SURVEY',
    progress: 0,
    managerIds: [],
    handoverPhases: [],
    materials: [],
    createdAt: '2026-07-01T08:00:00Z',
  },
  {
    id: 'p-2',
    name: 'Thi công Hệ thống Điều hòa Trung tâm Chiller - Nhà máy Intel Quận 9',
    images: [
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=800',
    ],
    surveyDate: '2026-06-15',
    expectedStartDate: '2026-06-25',
    surveyor: 'Nguyễn Văn Admin',
    contactName: 'Mrs. Nguyễn Thị Lan',
    contactPhone: '0988777666',
    status: 'ONGOING',
    progress: 45,
    managerIds: ['u-commander', 'u-deputy', 'u-engineer', 'u-staff-a'],
    startDate: '2026-06-26',
    handoverPhases: [
      { id: 'h-1', name: 'Bàn giao mặt bằng & Lắp đặt đường ống dẫn gas', date: '2026-07-10', status: 'COMPLETED' },
      { id: 'h-2', name: 'Lắp đặt dàn lạnh FCU & đấu nối tủ điện điều khiển', date: '2026-07-20', status: 'PENDING' },
      { id: 'h-3', name: 'Nghiệm thu chạy thử & Chuyển giao công nghệ', date: '2026-08-05', status: 'PENDING' },
    ],
    materials: [
      { id: 'm-1', name: 'Máy nén lạnh Daikin Chiller', quantity: 2, image: 'https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&q=80&w=200' },
      { id: 'm-2', name: 'Ống đồng bảo ôn phi 22', quantity: 150, image: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=200' },
      { id: 'm-3', name: 'Dây cáp điện Cadivi 3x6', quantity: 300 },
    ],
    createdAt: '2026-06-15T09:00:00Z',
  },
  {
    id: 'p-3',
    name: 'Nâng cấp Hệ thống Camera Giám sát AI - Tòa nhà Bitexco',
    images: [
      'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&q=80&w=800',
    ],
    surveyDate: '2026-05-10',
    expectedStartDate: '2026-05-20',
    surveyor: 'Lê Văn Nhân Viên A',
    contactName: 'Mr. David Beckham',
    contactPhone: '0911223344',
    status: 'COMPLETED',
    progress: 100,
    managerIds: ['u-commander', 'u-staff-a'],
    startDate: '2026-05-20',
    handoverPhases: [
      { id: 'h-4', name: 'Bàn giao thiết bị phần cứng & đi cáp mạng', date: '2026-05-25', status: 'COMPLETED' },
      { id: 'h-5', name: 'Cấu hình Server ghi hình AI & Cài đặt phần mềm giám sát', date: '2026-05-30', status: 'COMPLETED' },
    ],
    materials: [
      { id: 'm-4', name: 'Camera Dome IP 8MP Hikvision', quantity: 48 },
      { id: 'm-5', name: 'Server lưu trữ NAS Synology 8 bay', quantity: 2 },
    ],
    createdAt: '2026-05-10T10:00:00Z',
  },
];

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      users: FAKE_USERS,
      currentUser: null,
      projects: FAKE_PROJECTS,
      activityLogs: [
        {
          id: 'log-1',
          projectId: 'p-1',
          userId: 'u-manager',
          userName: 'Trần Thị Quản Lý',
          action: 'Đã hoàn thành khảo sát thực tế và lưu hồ sơ khảo sát.',
          timestamp: '2026-07-01T09:30:00Z',
        },
        {
          id: 'log-2',
          projectId: 'p-2',
          userId: 'u-admin',
          userName: 'Nguyễn Văn Admin',
          action: 'Đã khởi tạo dự án thi công và giao cho Lê Văn Nhân Viên A phụ trách.',
          timestamp: '2026-06-25T11:00:00Z',
        },
        {
          id: 'log-3',
          projectId: 'p-2',
          userId: 'u-staff-a',
          userName: 'Lê Văn Nhân Viên A',
          action: 'Đã hoàn thành đợt bàn giao số 1: Bàn giao mặt bằng & Lắp đặt đường ống gas.',
          timestamp: '2026-07-02T15:20:00Z',
        },
      ],
      comments: [
        {
          id: 'c-1',
          projectId: 'p-2',
          userId: 'u-manager',
          userName: 'Trần Thị Quản Lý',
          content: 'Dự án này cần kiểm tra kỹ phần chống thấm khi đi đường ống xuyên tường nhà máy nhé.',
          timestamp: '2026-06-27T08:30:00Z',
        },
        {
          id: 'c-2',
          projectId: 'p-2',
          userId: 'u-staff-a',
          userName: 'Lê Văn Nhân Viên A',
          content: 'Đã lưu ý và xử lý chống thấm bằng keo chuyên dụng Sika, đã chụp ảnh lưu trữ trong vật tư.',
          timestamp: '2026-06-27T10:15:00Z',
        },
      ],
      isHydrated: false,
      currentView: 'dashboard',
      activeProjectId: null,
      setView: (view, projectId = null) => set({ currentView: view, activeProjectId: projectId }),

      // Actions Auth
      registerUser: (email, name, role, password) => {
        const users = get().users;
        if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
          return { success: false, message: 'Email này đã tồn tại trên hệ thống.' };
        }
        const newUser: User = {
          id: 'u-' + Math.random().toString(36).substr(2, 9),
          email,
          name,
          password: password || '123456',
          role,
          balance: 100000000, // Tặng 100.000.000 VNĐ ảo khi đăng ký
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
        };

        set({ users: [...users, newUser], currentUser: newUser });
        return { success: true, message: 'Đăng ký tài khoản thành công.' };
      },

      loginUser: (email, password) => {
        const users = get().users;
        const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
          return { success: false, message: 'Tài khoản không tồn tại.' };
        }
        if (user.password && password && user.password !== password) {
          return { success: false, message: 'Mật khẩu không chính xác.' };
        }
        set({ currentUser: user });
        return { success: true, message: 'Đăng nhập thành công.' };
      },

      logoutUser: () => set({ currentUser: null }),

      updateProfile: (name, avatar) => {
        const { currentUser, users } = get();
        if (!currentUser) return;

        const updatedUser = { ...currentUser, name, avatar };
        const updatedUsers = users.map((u) => (u.id === currentUser.id ? updatedUser : u));
        
        set({
          currentUser: updatedUser,
          users: updatedUsers,
        });
      },

      updateUser: (userId, updatedFields) => {
        const { users, currentUser } = get();
        const updatedUsers = users.map((u) => (u.id === userId ? { ...u, ...updatedFields } : u));
        const updatedCurrentUser = currentUser?.id === userId ? { ...currentUser, ...updatedFields } : currentUser;
        set({
          users: updatedUsers,
          currentUser: updatedCurrentUser,
        });
      },

      deleteUser: (userId) => {
        const { users, currentUser } = get();
        if (currentUser?.id === userId) return; // Không được tự xóa chính mình
        set({
          users: users.filter((u) => u.id !== userId),
        });
      },

      resetUserPassword: (userId, newPassword) => {
        const { users } = get();
        set({
          users: users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u)),
        });
      },

      // Actions Projects
      addProject: (projectData) => {
        const currentUser = get().currentUser;
        const newProject: Project = {
          ...projectData,
          managerIds: projectData.managerIds || [],
          id: 'p-' + Math.random().toString(36).substr(2, 9),
          progress: projectData.status === 'COMPLETED' ? 100 : 0,
          handoverPhases: [],
          materials: [],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          projects: [newProject, ...state.projects],
        }));

        get().addLog(
          newProject.id,
          `Đã tạo dự án mới ở trạng thái [${
            projectData.status === 'SURVEY'
              ? 'Khảo sát'
              : projectData.status === 'ONGOING'
              ? 'Đang thực hiện'
              : 'Đã hoàn thành'
          }]`
        );
      },

      updateProject: (id, updatedFields) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === id) {
              const updated = { ...p, ...updatedFields };
              // Nếu status thay đổi sang completed, hoặc progress = 100
              if (updatedFields.status === 'COMPLETED') {
                updated.progress = 100;
              }
              return updated;
            }
            return p;
          }),
        }));

        const fieldKeys = Object.keys(updatedFields).join(', ');
        get().addLog(id, `Đã cập nhật thông tin dự án (Trường cập nhật: ${fieldKeys})`);
      },

      deleteProject: (id) => {
        const project = get().projects.find((p) => p.id === id);
        if (!project) return;

        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          activityLogs: state.activityLogs.filter((l) => l.projectId !== id),
          comments: state.comments.filter((c) => c.projectId !== id),
        }));
      },

      changeProjectStatus: (id, status) => {
        const { projects, users, currentUser } = get();
        const project = projects.find((p) => p.id === id);
        if (!project) return;

        const prevStatus = project.status;
        if (prevStatus === status) return;

        let bonusMsg = '';
        let updatedUsers = [...users];

        // Nếu chuyển sang COMPLETED, cộng 100,000,000 VNĐ cho những người phụ trách (managerIds)
        if (status === 'COMPLETED') {
          const managers = project.managerIds.length > 0 ? project.managerIds : (currentUser ? [currentUser.id] : []);
          if (managers.length > 0) {
            updatedUsers = users.map((u) => {
              if (managers.includes(u.id)) {
                const newBalance = u.balance + 100000000;
                bonusMsg += ` (+100.000.000 VNĐ thưởng ảo cộng vào ví của ${u.name})`;
                return { ...u, balance: newBalance };
              }
              return u;
            });
          }
        }

        const statusTexts = {
          SURVEY: 'Khảo sát (Mới)',
          ONGOING: 'Đang thực hiện',
          COMPLETED: 'Đã hoàn thành',
        };

        const updatedProjects = projects.map((p) => {
          if (p.id === id) {
            return {
              ...p,
              status,
              progress: status === 'COMPLETED' ? 100 : p.progress,
              startDate: status === 'ONGOING' && !p.startDate ? new Date().toISOString().split('T')[0] : p.startDate,
            };
          }
          return p;
        });

        // Tìm kiếm xem current user có nằm trong danh sách user cập nhật không để đồng bộ
        const updatedCurrentUser = currentUser
          ? updatedUsers.find((u) => u.id === currentUser.id) || currentUser
          : null;

        set({
          projects: updatedProjects,
          users: updatedUsers,
          currentUser: updatedCurrentUser,
        });

        get().addLog(
          id,
          `Đã chuyển trạng thái từ [${statusTexts[prevStatus]}] sang [${statusTexts[status]}]${bonusMsg}.`
        );
      },

      // Actions Materials
      addMaterial: (projectId, materialData) => {
        let isUpdated = false;
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              const nameLower = materialData.name.trim().toLowerCase();
              const existingMaterial = p.materials.find(
                (m) => m.name.trim().toLowerCase() === nameLower
              );

              if (existingMaterial) {
                isUpdated = true;
                return {
                  ...p,
                  materials: p.materials.map((m) =>
                    m.id === existingMaterial.id
                      ? { ...m, quantity: m.quantity + materialData.quantity }
                      : m
                  ),
                };
              }

              const newMaterial: Material = {
                ...materialData,
                id: 'm-' + Math.random().toString(36).substr(2, 9),
              };
              return {
                ...p,
                materials: [...p.materials, newMaterial],
              };
            }
            return p;
          }),
        }));

        const actionText = isUpdated ? 'Đã cập nhật dồn số lượng' : 'Đã thêm mới';
        get().addLog(projectId, `${actionText} vật tư: ${materialData.name} (Số lượng: ${materialData.quantity})`);
      },

      updateMaterialImage: (projectId, materialId, image) => {
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                materials: p.materials.map((m) => (m.id === materialId ? { ...m, image } : m)),
              };
            }
            return p;
          }),
        }));

        const project = get().projects.find((p) => p.id === projectId);
        const material = project?.materials.find((m) => m.id === materialId);
        if (material) {
          get().addLog(projectId, `Đã cập nhật ảnh kiểm tra cho vật tư: ${material.name}`);
        }
      },

      deleteMaterial: (projectId, materialId) => {
        const project = get().projects.find((p) => p.id === projectId);
        const material = project?.materials.find((m) => m.id === materialId);
        if (!material) return;

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                materials: p.materials.filter((m) => m.id !== materialId),
              };
            }
            return p;
          }),
        }));

        get().addLog(projectId, `Đã xóa vật tư: ${material.name}`);
      },

      // Actions Handovers
      addHandoverPhase: (projectId, phaseData) => {
        const newPhase: HandoverPhase = {
          ...phaseData,
          id: 'h-' + Math.random().toString(36).substr(2, 9),
          status: 'PENDING',
        };

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                handoverPhases: [...p.handoverPhases, newPhase],
              };
            }
            return p;
          }),
        }));

        get().addLog(projectId, `Đã thêm đợt bàn giao mới: ${phaseData.name} (Ngày dự kiến: ${phaseData.date})`);
      },

      toggleHandoverStatus: (projectId, phaseId) => {
        let phaseName = '';
        let newStatus: 'PENDING' | 'COMPLETED' = 'PENDING';

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              const updatedPhases = p.handoverPhases.map((h) => {
                if (h.id === phaseId) {
                  phaseName = h.name;
                  newStatus = h.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
                  return { ...h, status: newStatus };
                }
                return h;
              });

              // Tự động tính lại tiến độ dựa trên tỷ lệ các đợt bàn giao hoàn thành
              const completedCount = updatedPhases.filter((h) => h.status === 'COMPLETED').length;
              const totalCount = updatedPhases.length;
              const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : p.progress;

              return {
                ...p,
                handoverPhases: updatedPhases,
                progress: p.status === 'COMPLETED' ? 100 : progress,
              };
            }
            return p;
          }),
        }));

        get().addLog(
          projectId,
          `Đã chuyển trạng thái đợt bàn giao "${phaseName}" thành [${
            String(newStatus) === 'COMPLETED' ? 'Hoàn thành' : 'Đang chờ'
          }] (Tự động cập nhật tiến độ dự án)`
        );
      },

      deleteHandoverPhase: (projectId, phaseId) => {
        const project = get().projects.find((p) => p.id === projectId);
        const phase = project?.handoverPhases.find((h) => h.id === phaseId);
        if (!phase) return;

        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              const updatedPhases = p.handoverPhases.filter((h) => h.id !== phaseId);
              const completedCount = updatedPhases.filter((h) => h.status === 'COMPLETED').length;
              const totalCount = updatedPhases.length;
              const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

              return {
                ...p,
                handoverPhases: updatedPhases,
                progress: p.status === 'COMPLETED' ? 100 : progress,
              };
            }
            return p;
          }),
        }));

        get().addLog(projectId, `Đã xóa đợt bàn giao: ${phase.name}`);
      },

      // Actions Comments & Logs
      addComment: (projectId, content) => {
        const currentUser = get().currentUser;
        if (!currentUser) return;

        const newComment: Comment = {
          id: 'c-' + Math.random().toString(36).substr(2, 9),
          projectId,
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          content,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          comments: [...state.comments, newComment],
        }));

        get().addLog(projectId, `Đã bình luận: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`);
      },

      addLog: (projectId, action) => {
        const currentUser = get().currentUser;
        const newLog: ActivityLog = {
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          projectId,
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'Hệ thống',
          action,
          timestamp: new Date().toISOString(),
        };

        set((state) => ({
          activityLogs: [newLog, ...state.activityLogs],
        }));
      },

      setHydrated: () => set({ isHydrated: true }),
    }),
    {
      name: 'techproject-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      },
    }
  )
);
