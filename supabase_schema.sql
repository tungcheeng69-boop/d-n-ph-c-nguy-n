-- SCRIPT TẠO BẢNG SUPABASE CHO TECHPROJECT
-- Hướng dẫn: Copy toàn bộ nội dung script này, truy cập vào trang quản trị Supabase -> SQL Editor -> Chọn "New Query" -> Paste nội dung này vào rồi bấm "Run".

-- 1. Xóa các bảng cũ nếu tồn tại (để reset sạch)
DROP TABLE IF EXISTS techproject_comments;
DROP TABLE IF EXISTS techproject_activity_logs;
DROP TABLE IF EXISTS techproject_projects;
DROP TABLE IF EXISTS techproject_users;

-- 2. Bảng Nhân sự (Users)
CREATE TABLE techproject_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT,
  role TEXT NOT NULL,
  balance NUMERIC DEFAULT 0,
  avatar TEXT
);

-- 3. Bảng Hồ sơ dự án (Projects)
CREATE TABLE techproject_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  survey_date TEXT,
  expected_start_date TEXT,
  surveyor TEXT,
  contact_name TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL,
  progress NUMERIC DEFAULT 0,
  manager_ids JSONB DEFAULT '[]'::jsonb,
  start_date TEXT,
  handover_phases JSONB DEFAULT '[]'::jsonb,
  materials JSONB DEFAULT '[]'::jsonb,
  created_at TEXT NOT NULL
);

-- 4. Bảng Lịch sử hoạt động (Activity Logs)
CREATE TABLE techproject_activity_logs (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES techproject_projects(id) ON DELETE CASCADE,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- 5. Bảng Bình luận (Comments)
CREATE TABLE techproject_comments (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES techproject_projects(id) ON DELETE CASCADE,
  user_id TEXT,
  user_name TEXT,
  user_avatar TEXT,
  content TEXT NOT NULL,
  timestamp TEXT NOT NULL
);

-- 6. Bật tính năng Realtime cho các bảng (để các máy sync thời gian thực)
alter publication supabase_realtime add table techproject_users;
alter publication supabase_realtime add table techproject_projects;
alter publication supabase_realtime add table techproject_activity_logs;
alter publication supabase_realtime add table techproject_comments;
