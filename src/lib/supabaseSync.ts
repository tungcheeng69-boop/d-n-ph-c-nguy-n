import { SupabaseClient } from '@supabase/supabase-js';
import { User, Project, ActivityLog, Comment } from '@/store/useProjectStore';

// === HELPER MAPPERS (Snake_case <=> CamelCase) ===

function mapUserToDb(u: User) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    password: u.password || '123456',
    role: u.role,
    balance: u.balance,
    avatar: u.avatar || null,
  };
}

function mapUserFromDb(db: any): User {
  return {
    id: db.id,
    email: db.email,
    name: db.name,
    password: db.password,
    role: db.role,
    balance: Number(db.balance),
    avatar: db.avatar || undefined,
  };
}

function mapProjectToDb(p: Project) {
  return {
    id: p.id,
    name: p.name,
    images: p.images,
    survey_date: p.surveyDate || null,
    expected_start_date: p.expectedStartDate || null,
    surveyor: p.surveyor || null,
    contact_name: p.contactName || null,
    contact_phone: p.contactPhone || null,
    status: p.status,
    progress: p.progress,
    manager_ids: p.managerIds,
    start_date: p.startDate || null,
    handover_phases: p.handoverPhases,
    materials: p.materials,
    created_at: p.createdAt,
  };
}

function mapProjectFromDb(db: any): Project {
  return {
    id: db.id,
    name: db.name,
    images: Array.isArray(db.images) ? db.images : [],
    surveyDate: db.survey_date || '',
    expectedStartDate: db.expected_start_date || '',
    surveyor: db.surveyor || '',
    contactName: db.contact_name || '',
    contactPhone: db.contact_phone || '',
    status: db.status,
    progress: Number(db.progress),
    managerIds: Array.isArray(db.manager_ids) ? db.manager_ids : [],
    startDate: db.start_date || undefined,
    handoverPhases: Array.isArray(db.handover_phases) ? db.handover_phases : [],
    materials: Array.isArray(db.materials) ? db.materials : [],
    createdAt: db.created_at,
  };
}

function mapLogToDb(l: ActivityLog) {
  return {
    id: l.id,
    project_id: l.projectId,
    user_id: l.userId,
    user_name: l.userName,
    action: l.action,
    timestamp: l.timestamp,
  };
}

function mapLogFromDb(db: any): ActivityLog {
  return {
    id: db.id,
    projectId: db.project_id,
    userId: db.user_id,
    userName: db.user_name,
    action: db.action,
    timestamp: db.timestamp,
  };
}

function mapCommentToDb(c: Comment) {
  return {
    id: c.id,
    project_id: c.projectId,
    user_id: c.userId,
    user_name: c.userName,
    user_avatar: c.userAvatar || null,
    content: c.content,
    timestamp: c.timestamp,
  };
}

function mapCommentFromDb(db: any): Comment {
  return {
    id: db.id,
    projectId: db.project_id,
    userId: db.user_id,
    userName: db.user_name,
    userAvatar: db.user_avatar || undefined,
    content: db.content,
    timestamp: db.timestamp,
  };
}

// === CLOUD SYNC OPERATIONS ===

/**
 * Tải toàn bộ dữ liệu từ Supabase Cloud
 */
export async function fetchCloudData(client: SupabaseClient) {
  try {
    const [usersRes, projectsRes, logsRes, commentsRes] = await Promise.all([
      client.from('techproject_users').select('*'),
      client.from('techproject_projects').select('*'),
      client.from('techproject_activity_logs').select('*'),
      client.from('techproject_comments').select('*'),
    ]);

    if (usersRes.error) throw usersRes.error;
    if (projectsRes.error) throw projectsRes.error;
    if (logsRes.error) throw logsRes.error;
    if (commentsRes.error) throw commentsRes.error;

    return {
      users: (usersRes.data || []).map(mapUserFromDb),
      projects: (projectsRes.data || []).map(mapProjectFromDb),
      activityLogs: (logsRes.data || []).map(mapLogFromDb),
      comments: (commentsRes.data || []).map(mapCommentFromDb),
    };
  } catch (error) {
    console.error('Lỗi fetchCloudData:', error);
    throw error;
  }
}

/**
 * Đẩy toàn bộ dữ liệu local lên Cloud khi kết nối lần đầu (nếu cloud trống)
 */
export async function pushLocalDataToCloud(
  client: SupabaseClient,
  data: { users: User[]; projects: Project[]; activityLogs: ActivityLog[]; comments: Comment[] }
) {
  try {
    // 1. Kiểm tra xem đã có dữ liệu dự án trên cloud chưa
    const { count, error: countErr } = await client
      .from('techproject_projects')
      .select('*', { count: 'exact', head: true });

    if (countErr) throw countErr;

    // Nếu đã có dữ liệu trên cloud -> Không ghi đè, để nạp về máy client
    if (count && count > 0) {
      console.log('Cloud database đã có sẵn dữ liệu. Bỏ qua đồng bộ lên.');
      return false;
    }

    console.log('Đang đẩy dữ liệu mặc định lên Cloud Database trống...');

    // 2. Insert đồng loạt
    const dbUsers = data.users.map(mapUserToDb);
    const dbProjects = data.projects.map(mapProjectToDb);
    const dbLogs = data.activityLogs.map(mapLogToDb);
    const dbComments = data.comments.map(mapCommentToDb);

    if (dbUsers.length > 0) {
      const { error } = await client.from('techproject_users').insert(dbUsers);
      if (error) throw error;
    }
    if (dbProjects.length > 0) {
      const { error } = await client.from('techproject_projects').insert(dbProjects);
      if (error) throw error;
    }
    if (dbLogs.length > 0) {
      const { error } = await client.from('techproject_activity_logs').insert(dbLogs);
      if (error) throw error;
    }
    if (dbComments.length > 0) {
      const { error } = await client.from('techproject_comments').insert(dbComments);
      if (error) throw error;
    }

    console.log('Đẩy dữ liệu lên Cloud thành công!');
    return true;
  } catch (error) {
    console.error('Lỗi pushLocalDataToCloud:', error);
    throw error;
  }
}

// === MUTATION WRITERS ===

export async function dbAddUser(client: SupabaseClient, user: User) {
  const { error } = await client.from('techproject_users').insert(mapUserToDb(user));
  if (error) console.error('Lỗi dbAddUser:', error);
}

export async function dbUpdateUser(client: SupabaseClient, id: string, fields: Partial<User>) {
  const dbFields: any = {};
  if (fields.name !== undefined) dbFields.name = fields.name;
  if (fields.email !== undefined) dbFields.email = fields.email;
  if (fields.password !== undefined) dbFields.password = fields.password;
  if (fields.role !== undefined) dbFields.role = fields.role;
  if (fields.balance !== undefined) dbFields.balance = fields.balance;
  if (fields.avatar !== undefined) dbFields.avatar = fields.avatar || null;

  const { error } = await client.from('techproject_users').update(dbFields).eq('id', id);
  if (error) console.error('Lỗi dbUpdateUser:', error);
}

export async function dbDeleteUser(client: SupabaseClient, id: string) {
  const { error } = await client.from('techproject_users').delete().eq('id', id);
  if (error) console.error('Lỗi dbDeleteUser:', error);
}

export async function dbAddProject(client: SupabaseClient, project: Project) {
  const { error } = await client.from('techproject_projects').insert(mapProjectToDb(project));
  if (error) console.error('Lỗi dbAddProject:', error);
}

export async function dbUpdateProject(client: SupabaseClient, id: string, fields: Partial<Project>) {
  const dbFields: any = {};
  if (fields.name !== undefined) dbFields.name = fields.name;
  if (fields.images !== undefined) dbFields.images = fields.images;
  if (fields.surveyDate !== undefined) dbFields.survey_date = fields.surveyDate || null;
  if (fields.expectedStartDate !== undefined) dbFields.expected_start_date = fields.expectedStartDate || null;
  if (fields.surveyor !== undefined) dbFields.surveyor = fields.surveyor || null;
  if (fields.contactName !== undefined) dbFields.contact_name = fields.contactName || null;
  if (fields.contactPhone !== undefined) dbFields.contact_phone = fields.contactPhone || null;
  if (fields.status !== undefined) dbFields.status = fields.status;
  if (fields.progress !== undefined) dbFields.progress = fields.progress;
  if (fields.managerIds !== undefined) dbFields.manager_ids = fields.managerIds;
  if (fields.startDate !== undefined) dbFields.start_date = fields.startDate || null;
  if (fields.handoverPhases !== undefined) dbFields.handover_phases = fields.handoverPhases;
  if (fields.materials !== undefined) dbFields.materials = fields.materials;

  const { error } = await client.from('techproject_projects').update(dbFields).eq('id', id);
  if (error) console.error('Lỗi dbUpdateProject:', error);
}

export async function dbDeleteProject(client: SupabaseClient, id: string) {
  const { error } = await client.from('techproject_projects').delete().eq('id', id);
  if (error) console.error('Lỗi dbDeleteProject:', error);
}

export async function dbAddComment(client: SupabaseClient, comment: Comment) {
  const { error } = await client.from('techproject_comments').insert(mapCommentToDb(comment));
  if (error) console.error('Lỗi dbAddComment:', error);
}

export async function dbAddLog(client: SupabaseClient, log: ActivityLog) {
  const { error } = await client.from('techproject_activity_logs').insert(mapLogToDb(log));
  if (error) console.error('Lỗi dbAddLog:', error);
}
