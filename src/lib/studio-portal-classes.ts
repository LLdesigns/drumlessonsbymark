/** Classes for dropdowns portaled to document.body (must include .studio-app for CSS variables). */
export function studioFloatingRootClass(portal: 'student' | 'studio'): string {
  const variant = portal === 'student' ? ' studio-app--student' : ''
  return `studio-app${variant} studio-floating-panel-root`
}
