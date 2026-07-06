import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createDynamicSupabaseClient } from '@/lib/supabase';
import {
  fetchCloudData,
  pushLocalDataToCloud,
  dbAddUser,
  dbUpdateUser,
  dbDeleteUser,
  dbAddProject,
  dbUpdateProject,
  dbDeleteProject,
  dbAddComment,
  dbAddLog
} from '@/lib/supabaseSync';

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

  // Supabase Cloud DB Config
  supabaseUrl: string;
  supabaseKey: string;
  isCloudConnected: boolean;
  setCloudConfig: (url: string, key: string) => Promise<{ success: boolean; message: string }>;
  disconnectCloud: () => void;
  fetchCloudData: () => Promise<void>;

  // Instant Cloud Sync Config (jsonblob.com)
  instantSyncCode: string;
  isInstantSyncConnected: boolean;
  createInstantSync: () => Promise<{ success: boolean; syncCode?: string; message: string }>;
  connectInstantSync: (code: string) => Promise<{ success: boolean; message: string }>;
  disconnectInstantSync: () => void;
  fetchInstantSyncData: () => Promise<void>;

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
    balance: 80000000,
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'u-engineer',
    email: 'engineer@tech.com',
    name: 'Lê Văn Kỹ Thuật',
    password: '123456',
    role: 'FIELD_ENGINEER',
    balance: 50000000,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'u-staff-a',
    email: 'staff@tech.com',
    name: 'Lê Văn Nhân Viên',
    password: '123456',
    role: 'STAFF',
    balance: 30000000,
    avatar: 'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=200',
  },
];

// Khởi tạo fake projects ban đầu
const FAKE_PROJECTS: Project[] = [
  {
    id: 'p-1',
    name: 'Khảo sát lắp đặt thiết bị đo áp suất hệ thống chiller trung tâm nhà máy SamSung Thái Nguyên',
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800',
    ],
    surveyDate: '2026-07-02',
    expectedStartDate: '2026-07-15',
    surveyor: 'Lê Văn Kỹ Thuật',
    contactName: 'Mr. Park (GĐ Kỹ thuật)',
    contactPhone: '0981.234.567',
    status: 'SURVEY',
    progress: 0,
    managerIds: ['u-engineer', 'u-manager'],
    handoverPhases: [],
    materials: [],
    createdAt: '2026-07-01T08:00:00Z',
  },
  {
    id: 'p-2',
    name: 'Thi công cải tạo đường ống cấp nước khí nén và bảo dưỡng van điều áp xưởng cơ khí số 3 - Honda Vĩnh Phúc',
    images: [
      'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&q=80&w=800',
    ],
    surveyDate: '2026-06-20',
    expectedStartDate: '2026-06-25',
    surveyor: 'Nguyễn Văn Chỉ Huy',
    contactName: 'Nguyễn Văn Bình (Trưởng xưởng)',
    contactPhone: '0912.987.654',
    status: 'ONGOING',
    progress: 40,
    managerIds: ['u-commander', 'u-deputy', 'u-staff-a'],
    startDate: '2026-06-26',
    handoverPhases: [
      {
        id: 'h-1',
        name: 'Đợt 1: Bàn giao mặt bằng & Lắp đặt đường ống gas chính',
        date: '2026-07-02',
        status: 'COMPLETED',
      },
      {
        id: 'h-2',
        name: 'Đợt 2: Đấu nối hệ thống van điều áp cơ khí khí nén',
        date: '2026-07-10',
        status: 'PENDING',
      },
      {
        id: 'h-3',
        name: 'Đợt 3: Kiểm thử áp suất liên tục & Bàn giao toàn xưởng',
        date: '2026-07-20',
        status: 'PENDING',
      },
    ],
    materials: [
      {
        id: 'm-1',
        name: 'Van điều áp áp lực cao khí nén SMC 2.0 bar',
        quantity: 5,
        image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&q=80&w=200',
      },
      {
        id: 'm-2',
        name: 'Ống đồng chịu nhiệt bọc bảo ôn đường kính phi 22',
        quantity: 120,
      },
      {
        id: 'm-3',
        name: 'Keo chuyên dụng chống thấm Sika Sealant 111',
        quantity: 15,
        image: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&q=80&w=200',
      },
    ],
    createdAt: '2026-06-20T10:00:00Z',
  },
  {
    id: 'p-3',
    name: 'Bảo trì sửa chữa hệ thống tủ điện điều khiển PLC dây chuyền đóng gói tự động nhà máy sữa Vinamilk Bình Dương',
    images: [
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800',
    ],
    surveyDate: '2026-05-10',
    expectedStartDate: '2026-05-12',
    surveyor: 'Trần Thị Quản Lý',
    contactName: 'Phạm Thị Lan (GĐ Sản xuất)',
    contactPhone: '0979.888.999',
    status: 'COMPLETED',
    progress: 100,
    managerIds: ['u-manager', 'u-deputy'],
    startDate: '2026-05-12',
    handoverPhases: [
      {
        id: 'h-comp-1',
        name: 'Nghiệm thu đấu nối tủ điện điều khiển PLC Vinamilk',
        date: '2026-05-25',
        status: 'COMPLETED',
      },
    ],
    materials: [
      {
        id: 'm-comp-1',
        name: 'Module CPU PLC Siemens S7-1200',
        quantity: 2,
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=200',
      },
    ],
    createdAt: '2026-05-10T10:00:00Z',
  },
];

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => {
      // Helper lấy dynamic Supabase client
      const getClient = () => {
        const { supabaseUrl, supabaseKey, isCloudConnected } = get();
        if (!isCloudConnected || !supabaseUrl || !supabaseKey) return null;
        return createDynamicSupabaseClient(supabaseUrl, supabaseKey);
      };

      // Helper tự động push dữ liệu lên jsonblob.com (Instant Cloud Sync - Hỗ trợ CORS 100% & Không giới hạn kích thước key)
      const triggerInstantSyncPush = async () => {
        const { isInstantSyncConnected, instantSyncCode, users, projects, activityLogs, comments } = get();
        if (!isInstantSyncConnected || !instantSyncCode) return;
        try {
          await fetch(`https://jsonblob.com/api/jsonBlob/${instantSyncCode}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              users,
              projects,
              activityLogs,
              comments
            })
          });
        } catch (error) {
          console.error('Lỗi triggerInstantSyncPush:', error);
        }
      };

      // Gọi đồng bộ cloud thích hợp sau khi thay đổi dữ liệu
      const handleSyncPush = async () => {
        const client = getClient();
        if (client) {
          // Ghi lên Supabase nếu đang kết nối
        }
        await triggerInstantSyncPush();
      };

      return {
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

        // Supabase Cloud DB Config State
        supabaseUrl: '',
        supabaseKey: '',
        isCloudConnected: false,

        setCloudConfig: async (url, key) => {
          const client = createDynamicSupabaseClient(url, key);
          if (!client) {
            return { success: false, message: 'URL hoặc API Key của Supabase không hợp lệ.' };
          }
          try {
            // Test query đơn giản xem kết nối thành công không
            const { error } = await client.from('techproject_users').select('*', { count: 'exact', head: true });
            if (error) throw error;

            // Ngắt kết nối Instant Sync trước khi sang Supabase
            set({
              supabaseUrl: url,
              supabaseKey: key,
              isCloudConnected: true,
              instantSyncCode: '',
              isInstantSyncConnected: false
            });

            const currentData = {
              users: get().users,
              projects: get().projects,
              activityLogs: get().activityLogs,
              comments: get().comments,
            };

            const pushed = await pushLocalDataToCloud(client, currentData);
            if (!pushed) {
              await get().fetchCloudData();
            }

            return { success: true, message: 'Kết nối Cloud Database thành công!' };
          } catch (error: any) {
            console.error(error);
            return { success: false, message: `Lỗi kết nối database: ${error.message || 'Vui lòng kiểm tra lại cấu hình bảng.'}` };
          }
        },

        disconnectCloud: () => {
          set({
            supabaseUrl: '',
            supabaseKey: '',
            isCloudConnected: false,
            users: FAKE_USERS,
            projects: FAKE_PROJECTS,
            currentUser: null,
          });
        },

        fetchCloudData: async () => {
          const client = getClient();
          if (!client) return;
          try {
            const cloudData = await fetchCloudData(client);
            set({
              users: cloudData.users,
              projects: cloudData.projects,
              activityLogs: cloudData.activityLogs,
              comments: cloudData.comments,
            });
            const { currentUser, users } = get();
            if (currentUser) {
              const matchedUser = users.find((u) => u.id === currentUser.id);
              if (matchedUser) {
                set({ currentUser: matchedUser });
              } else {
                set({ currentUser: null });
              }
            }
          } catch (error) {
            console.error('Lỗi fetchCloudData:', error);
          }
        },

        // Instant Cloud Sync (jsonblob.com) Implementation (CORS 100% Ok & Cho phép lưu trữ lớn)
        instantSyncCode: '',
        isInstantSyncConnected: false,

        createInstantSync: async () => {
          try {
            const currentData = {
              users: get().users,
              projects: get().projects,
              activityLogs: get().activityLogs,
              comments: get().comments,
            };

            // Gọi API jsonblob.com để tạo mới một JSON blob lưu trữ đám mây
            const response = await fetch('https://jsonblob.com/api/jsonBlob', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(currentData),
            });

            if (!response.ok) {
              throw new Error('Máy chủ đám mây từ chối khởi tạo. Vui lòng thử lại sau.');
            }

            // Lấy ID từ Header Location trả về của server
            const location = response.headers.get('Location') || response.headers.get('location');
            if (!location) {
              throw new Error('Không nhận được địa chỉ dữ liệu từ máy chủ đám mây.');
            }

            const code = location.substring(location.lastIndexOf('/') + 1);

            // Ngắt kết nối Supabase khi bật Instant Sync
            set({
              instantSyncCode: code,
              isInstantSyncConnected: true,
              supabaseUrl: '',
              supabaseKey: '',
              isCloudConnected: false
            });

            return { success: true, syncCode: code, message: 'Đã tạo mã đồng bộ thành công!' };
          } catch (error: any) {
            console.error(error);
            return { success: false, message: error.message || 'Lỗi khởi tạo Instant Sync.' };
          }
        },

        connectInstantSync: async (code) => {
          try {
            const response = await fetch(`https://jsonblob.com/api/jsonBlob/${code}`, {
              headers: {
                'Accept': 'application/json'
              }
            });
            if (!response.ok) {
              throw new Error('Mã đồng bộ không tồn tại hoặc đã hết hạn.');
            }

            const data = await response.json();
            if (!data.users || !data.projects) {
              throw new Error('Dữ liệu đồng bộ không đúng định dạng.');
            }

            // Kết nối thành công -> Lưu code và ghi đè dữ liệu local
            set({
              instantSyncCode: code,
              isInstantSyncConnected: true,
              supabaseUrl: '',
              supabaseKey: '',
              isCloudConnected: false,
              users: data.users,
              projects: data.projects,
              activityLogs: data.activityLogs || [],
              comments: data.comments || []
            });

            return { success: true, message: 'Đồng bộ dữ liệu thành công!' };
          } catch (error: any) {
            console.error(error);
            return { success: false, message: error.message || 'Lỗi kết nối Instant Sync.' };
          }
        },

        disconnectInstantSync: () => {
          set({
            instantSyncCode: '',
            isInstantSyncConnected: false,
            users: FAKE_USERS,
            projects: FAKE_PROJECTS,
            currentUser: null
          });
        },

        fetchInstantSyncData: async () => {
          const { isInstantSyncConnected, instantSyncCode } = get();
          if (!isInstantSyncConnected || !instantSyncCode) return;
          try {
            const response = await fetch(`https://jsonblob.com/api/jsonBlob/${instantSyncCode}`, {
              headers: {
                'Accept': 'application/json'
              }
            });
            if (!response.ok) return;
            const data = await response.json();
            if (data.users && data.projects) {
              set({
                users: data.users,
                projects: data.projects,
                activityLogs: data.activityLogs || [],
                comments: data.comments || []
              });
              // Sync currentUser
              const { currentUser, users } = get();
              if (currentUser) {
                const matched = users.find((u) => u.id === currentUser.id);
                if (matched) set({ currentUser: matched });
                else set({ currentUser: null });
              }
            }
          } catch (error) {
            console.error('Lỗi fetchInstantSyncData:', error);
          }
        },

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

          const client = getClient();
          if (client) {
            dbAddUser(client, newUser);
          }
          handleSyncPush();

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

          const client = getClient();
          if (client) {
            dbUpdateUser(client, currentUser.id, { name, avatar });
          }
          handleSyncPush();
        },

        updateUser: (userId, updatedFields) => {
          const { users, currentUser } = get();
          const updatedUsers = users.map((u) => (u.id === userId ? { ...u, ...updatedFields } : u));
          const updatedCurrentUser = currentUser?.id === userId ? { ...currentUser, ...updatedFields } : currentUser;
          
          set({
            users: updatedUsers,
            currentUser: updatedCurrentUser,
          });

          const client = getClient();
          if (client) {
            dbUpdateUser(client, userId, updatedFields);
          }
          handleSyncPush();
        },

        deleteUser: (userId) => {
          const { users, currentUser } = get();
          if (currentUser?.id === userId) return; // Không được tự xóa chính mình
          
          set({
            users: users.filter((u) => u.id !== userId),
          });

          const client = getClient();
          if (client) {
            dbDeleteUser(client, userId);
          }
          handleSyncPush();
        },

        resetUserPassword: (userId, newPassword) => {
          const { users } = get();
          
          set({
            users: users.map((u) => (u.id === userId ? { ...u, password: newPassword } : u)),
          });

          const client = getClient();
          if (client) {
            dbUpdateUser(client, userId, { password: newPassword });
          }
          handleSyncPush();
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

          const client = getClient();
          if (client) {
            dbAddProject(client, newProject);
          }

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
          handleSyncPush();
        },

        updateProject: (id, updatedFields) => {
          set((state) => ({
            projects: state.projects.map((p) => {
              if (p.id === id) {
                const updated = { ...p, ...updatedFields };
                if (updatedFields.status === 'COMPLETED') {
                  updated.progress = 100;
                }
                return updated;
              }
              return p;
            }),
          }));

          const client = getClient();
          if (client) {
            const updatedProj = get().projects.find((p) => p.id === id);
            if (updatedProj) {
              dbUpdateProject(client, id, updatedProj);
            }
          }

          const fieldKeys = Object.keys(updatedFields).join(', ');
          get().addLog(id, `Đã cập nhật thông tin dự án (Trường cập nhật: ${fieldKeys})`);
          handleSyncPush();
        },

        deleteProject: (id) => {
          const project = get().projects.find((p) => p.id === id);
          if (!project) return;

          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
            activityLogs: state.activityLogs.filter((l) => l.projectId !== id),
            comments: state.comments.filter((c) => c.projectId !== id),
          }));

          const client = getClient();
          if (client) {
            dbDeleteProject(client, id);
          }
          handleSyncPush();
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

          const updatedCurrentUser = currentUser
            ? updatedUsers.find((u) => u.id === currentUser.id) || currentUser
            : null;

          set({
            projects: updatedProjects,
            users: updatedUsers,
            currentUser: updatedCurrentUser,
          });

          const client = getClient();
          if (client) {
            const updatedProj = updatedProjects.find((p) => p.id === id);
            if (updatedProj) {
              dbUpdateProject(client, id, updatedProj);
            }
            const managers = project.managerIds.length > 0 ? project.managerIds : (currentUser ? [currentUser.id] : []);
            managers.forEach((mId) => {
              const u = updatedUsers.find((user) => user.id === mId);
              if (u) {
                dbUpdateUser(client, mId, { balance: u.balance });
              }
            });
          }

          get().addLog(
            id,
            `Đã chuyển trạng thái từ [${statusTexts[prevStatus]}] sang [${statusTexts[status]}]${bonusMsg}.`
          );
          handleSyncPush();
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

          const client = getClient();
          if (client) {
            const updatedProj = get().projects.find((p) => p.id === projectId);
            if (updatedProj) {
              dbUpdateProject(client, projectId, { materials: updatedProj.materials });
            }
          }

          const actionText = isUpdated ? 'Đã cập nhật dồn số lượng' : 'Đã thêm mới';
          get().addLog(projectId, `${actionText} vật tư: ${materialData.name} (Số lượng: ${materialData.quantity})`);
          handleSyncPush();
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

          const client = getClient();
          if (client) {
            const updatedProj = get().projects.find((p) => p.id === projectId);
            if (updatedProj) {
              dbUpdateProject(client, projectId, { materials: updatedProj.materials });
            }
          }

          const project = get().projects.find((p) => p.id === projectId);
          const material = project?.materials.find((m) => m.id === materialId);
          if (material) {
            get().addLog(projectId, `Đã cập nhật ảnh kiểm tra cho vật tư: ${material.name}`);
          }
          handleSyncPush();
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

          const client = getClient();
          if (client) {
            const updatedProj = get().projects.find((p) => p.id === projectId);
            if (updatedProj) {
              dbUpdateProject(client, projectId, { materials: updatedProj.materials });
            }
          }

          get().addLog(projectId, `Đã xóa vật tư: ${material.name}`);
          handleSyncPush();
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

          const client = getClient();
          if (client) {
            const updatedProj = get().projects.find((p) => p.id === projectId);
            if (updatedProj) {
              dbUpdateProject(client, projectId, { handoverPhases: updatedProj.handoverPhases });
            }
          }

          get().addLog(projectId, `Đã thêm đợt bàn giao mới: ${phaseData.name} (Ngày dự kiến: ${phaseData.date})`);
          handleSyncPush();
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

          const client = getClient();
          if (client) {
            const updatedProj = get().projects.find((p) => p.id === projectId);
            if (updatedProj) {
              dbUpdateProject(client, projectId, {
                handoverPhases: updatedProj.handoverPhases,
                progress: updatedProj.progress
              });
            }
          }

          get().addLog(
            projectId,
            `Đã chuyển trạng thái đợt bàn giao "${phaseName}" thành [${
              String(newStatus) === 'COMPLETED' ? 'Hoàn thành' : 'Đang chờ'
            }] (Tự động cập nhật tiến độ dự án)`
          );
          handleSyncPush();
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

          const client = getClient();
          if (client) {
            const updatedProj = get().projects.find((p) => p.id === projectId);
            if (updatedProj) {
              dbUpdateProject(client, projectId, {
                handoverPhases: updatedProj.handoverPhases,
                progress: updatedProj.progress
              });
            }
          }

          get().addLog(projectId, `Đã xóa đợt bàn giao: ${phase.name}`);
          handleSyncPush();
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

          const client = getClient();
          if (client) {
            dbAddComment(client, newComment);
          }

          get().addLog(projectId, `Đã bình luận: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`);
          handleSyncPush();
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

          const client = getClient();
          if (client) {
            dbAddLog(client, newLog);
          }
          handleSyncPush();
        },

        setHydrated: () => set({ isHydrated: true }),
      };
    },
    {
      name: 'techproject-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state.setHydrated();
      },
    }
  )
);
