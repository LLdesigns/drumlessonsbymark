// User role enum - matches existing database enum
export type UserRole = 'admin' | 'teacher' | 'student' | 'author' | 'employee'

// User profile type matching existing database schema (profiles table)
export interface UserProfile {
  user_id: string  // Primary key in profiles table
  handle?: string | null
  display_name?: string | null
  avatar_url?: string | null
  bio?: string | null
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  must_change_password?: boolean
  created_by?: string | null
  active?: boolean
  created_at: string
  updated_at: string
  // Role is stored separately in user_roles table
  role?: UserRole
}

// User role entry from user_roles table
export interface UserRoleEntry {
  user_id: string
  role: UserRole
  granted_by: string | null
  granted_at: string
}

// Teacher type
export interface Teacher {
  user_id: string  // Primary key references profiles(user_id)
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  // Joined profile data
  profile?: UserProfile
}

// Student relationship via teacher_students junction table
// No separate students table needed - use teacher_students
export interface TeacherStudentRelation {
  teacher_id: string
  student_id: string
  created_at: string
}

// Extended user profile with role-specific data
export interface ExtendedUserProfile extends UserProfile {
  teacher?: Teacher
  studentRelations?: TeacherStudentRelation[]
}

