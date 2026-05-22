import { createUserAccount } from './admin-service'

export interface AddStudioTeacherInput {
  createdBy: string
  email: string
  firstName: string
  lastName: string
}

export interface AddStudioTeacherResult {
  userId: string
  temporaryPassword: string
  teacherName: string
}

/** Admin-only: creates a teacher account for Mark's studio (studio login tab). */
export async function addStudioTeacher(input: AddStudioTeacherInput): Promise<AddStudioTeacherResult> {
  const { userId, temporaryPassword } = await createUserAccount({
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    role: 'teacher',
    createdBy: input.createdBy,
  })

  return {
    userId,
    temporaryPassword,
    teacherName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
  }
}
