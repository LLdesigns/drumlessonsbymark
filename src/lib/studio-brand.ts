/** Sidebar / loading chrome — shared by teacher and student studio portals */
export const STUDIO_BRAND_LINE1 = 'PLAY IT PRO'
export const STUDIO_PORTAL_LABEL_TEACHER = 'studio'
export const STUDIO_PORTAL_LABEL_STUDENT = 'Console'
export const STUDIO_BRAND_FULL = 'Play It Pro Drum Studio'

export function studioPortalLabel(variant: 'teacher' | 'student'): string {
  return variant === 'teacher' ? STUDIO_PORTAL_LABEL_TEACHER : STUDIO_PORTAL_LABEL_STUDENT
}
