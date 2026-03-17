-- ══════════════════════════════════════════════
-- EduMatrix Online — Supabase Schema
-- Run this in Supabase → SQL Editor → New Query
-- ══════════════════════════════════════════════

-- Schools table (multi-school support)
CREATE TABLE IF NOT EXISTS schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  session TEXT DEFAULT '2025-26',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','teacher','student','parent')),
  contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, username)
);

-- Classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sections TEXT DEFAULT 'A',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, name)
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  roll_no TEXT NOT NULL,
  name TEXT NOT NULL,
  father_name TEXT,
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  contact TEXT,
  parent_contact TEXT,
  dob TEXT,
  status TEXT DEFAULT 'Active',
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, roll_no)
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('Present','Absent','Late')),
  note TEXT,
  marked_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, student_id, date)
);

-- Fees table
CREATE TABLE IF NOT EXISTS fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  amount_due NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  paid_date DATE,
  payment_method TEXT DEFAULT 'Cash',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, student_id, month)
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT DEFAULT 'General',
  audience TEXT DEFAULT 'Everyone',
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Papers table
CREATE TABLE IF NOT EXISTS papers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  class TEXT NOT NULL,
  subject TEXT NOT NULL,
  paper_code TEXT,
  exam_date DATE,
  start_time TEXT,
  duration TEXT,
  hall TEXT,
  total_marks INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Results table
CREATE TABLE IF NOT EXISTS results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  paper_id UUID REFERENCES papers(id) ON DELETE CASCADE,
  marks_obtained NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, student_id, paper_id)
);

-- SMS logs table
CREATE TABLE IF NOT EXISTS sms_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════════
-- Seed default school + admin
-- ══════════════════════════════════════════════
INSERT INTO schools (id, name, address, session)
VALUES ('00000000-0000-0000-0000-000000000001', 'EduMatrix School', 'Faisalabad, Pakistan', '2025-26')
ON CONFLICT DO NOTHING;

INSERT INTO users (school_id, name, username, password, role)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Principal', 'admin', 'admin123', 'admin'),
  ('00000000-0000-0000-0000-000000000001', 'Ms. Sana Butt', 'teacher', 'teach123', 'teacher')
ON CONFLICT DO NOTHING;

INSERT INTO classes (school_id, name, sections)
VALUES
  ('00000000-0000-0000-0000-000000000001', '6',  'A,B'),
  ('00000000-0000-0000-0000-000000000001', '7',  'A,B'),
  ('00000000-0000-0000-0000-000000000001', '8',  'A,B'),
  ('00000000-0000-0000-0000-000000000001', '9',  'A,B'),
  ('00000000-0000-0000-0000-000000000001', '10', 'A,B')
ON CONFLICT DO NOTHING;

INSERT INTO students (school_id, roll_no, name, father_name, class, section, contact, parent_contact)
VALUES
  ('00000000-0000-0000-0000-000000000001','1001','Ahmed Ali','Muhammad Ali','9','A','0300-1234567','0300-1234567'),
  ('00000000-0000-0000-0000-000000000001','1002','Fatima Noor','Noor Hassan','9','A','0312-9876543','0312-9876543'),
  ('00000000-0000-0000-0000-000000000001','1003','Bilal Raza','Raza Ahmed','9','B','0321-5554433','0321-5554433'),
  ('00000000-0000-0000-0000-000000000001','1004','Zara Khan','Imran Khan','10','A','0333-7778899','0333-7778899'),
  ('00000000-0000-0000-0000-000000000001','1005','Hamza Tariq','Tariq Mehmood','10','A','0346-2223344','0346-2223344'),
  ('00000000-0000-0000-0000-000000000001','1006','Ayesha Malik','Saleem Malik','10','B','0311-6667788','0311-6667788')
ON CONFLICT DO NOTHING;
