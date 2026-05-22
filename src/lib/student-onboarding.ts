import { createUserAccount } from './admin-service'
import type { SkillLevel } from '../types/studio'

export interface AddStudioStudentInput {
  teacherId: string
  createdBy: string
  email: string
  firstName: string
  lastName: string
  age?: number
  skillLevel?: SkillLevel
  goals?: string
  favoriteMusic?: string
}

export interface AddStudioStudentResult {
  userId: string
  temporaryPassword: string
  studentName: string
}

/**
 * Creates a student account, links them to the teacher, and optionally seeds studio profile fields.
 * Requires the `create-user` edge function to be deployed.
 */
export async function addStudioStudent(input: AddStudioStudentInput): Promise<AddStudioStudentResult> {
  const studioProfile =
    input.age || input.skillLevel || input.goals || input.favoriteMusic
      ? {
          age: input.age ?? null,
          skill_level: input.skillLevel ?? null,
          goals: input.goals?.trim() || null,
          favorite_music: input.favoriteMusic?.trim() || null,
        }
      : undefined

  const { userId, temporaryPassword } = await createUserAccount({
    email: input.email.trim().toLowerCase(),
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    role: 'student',
    createdBy: input.createdBy,
    teacherId: input.teacherId,
    studioProfile,
  })

  return {
    userId,
    temporaryPassword,
    studentName: `${input.firstName.trim()} ${input.lastName.trim()}`.trim(),
  }
}
