// Course type
export interface Course {
  id: string
  title: string
  description?: string | null
  teacher_id: string
  status: 'draft' | 'published' | 'archived'
  thumbnail_url?: string | null
  created_at: string
  updated_at: string
  // Joined data
  teacher?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
  lesson_count?: number
  enrolled_students_count?: number
}

// Course lesson type
export interface CourseLesson {
  id: string
  course_id: string
  title: string
  description?: string | null
  video_url?: string | null
  video_storage_path?: string | null
  order_index: number
  duration_seconds?: number | null
  created_at: string
  updated_at: string
  // Joined data
  course?: Course
  completed?: boolean // For student views
}

// Student course enrollment type
export interface StudentCourseEnrollment {
  id: string
  student_id: string
  course_id: string
  enrolled_at: string
  status: 'active' | 'completed' | 'dropped'
  progress_percentage: number
  last_accessed_at?: string | null
  completed_at?: string | null
  // Joined data
  course?: Course
  student?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

// Lesson completion type
export interface LessonCompletion {
  id: string
  student_id: string
  lesson_id: string
  completed_at: string
  watch_time_seconds: number
  // Joined data
  lesson?: CourseLesson
}

// Assignment type
export interface Assignment {
  id: string
  title: string
  description?: string | null
  teacher_id: string
  course_id?: string | null
  lesson_id?: string | null
  due_date?: string | null
  created_at: string
  updated_at: string
  // Joined data
  teacher?: {
    id: string
    first_name: string
    last_name: string
  }
  course?: Course
  lesson?: CourseLesson
  student_count?: number
}

// Student assignment type (junction table)
export interface StudentAssignment {
  id: string
  assignment_id: string
  student_id: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  submitted_at?: string | null
  completed_at?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  // Joined data
  assignment?: Assignment
  student?: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

