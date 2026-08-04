/** String shaping helpers used by tables, headers and avatars. */

export function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

/** `user-manager` / `user_manager` / `userManager` → `User Manager` */
export function titleCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(capitalize)
    .join(' ')
}

/** `User Manager` → `user-manager` */
export function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Up to two uppercase initials for avatar fallbacks. */
export function initials(value: string, max = 2): string {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, max)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function truncate(value: string, maxLength: number, suffix = '…'): string {
  return value.length <= maxLength ? value : value.slice(0, maxLength).trimEnd() + suffix
}
