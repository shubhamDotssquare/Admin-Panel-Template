import { useMemo } from 'react'

import { NAVIGATION } from '@/config/navigation.config'
import type { NavGroup, NavItem } from '@/types/navigation.types'
import { useAuth } from './use-auth'

/**
 * The navigation this admin may actually see.
 *
 * Entries declare the permission they need in
 * [`navigation.config.ts`](../config/navigation.config.ts); this drops the ones
 * the signed-in admin does not hold. Hiding a link is a courtesy, not a control
 * — the API refuses the request either way — but a menu full of dead ends that
 * all answer "no permission" is a bad panel.
 */
export function useNavigation(groups: NavGroup[] = NAVIGATION): NavGroup[] {
  const { can } = useAuth()

  return useMemo(() => {
    const allowed = (item: NavItem): boolean =>
      !item.permissions?.length || item.permissions.every((permission) => can(permission))

    const filterItems = (items: NavItem[]): NavItem[] =>
      items.reduce<NavItem[]>((kept, item) => {
        if (item.hidden || !allowed(item)) return kept

        if (item.children?.length) {
          const children = filterItems(item.children)

          // A parent whose children are all hidden and that has no destination
          // of its own would expand to nothing.
          if (children.length === 0 && !item.path) return kept
          kept.push({ ...item, children })
          return kept
        }

        kept.push(item)
        return kept
      }, [])

    return groups
      .map((group) => ({ ...group, items: filterItems(group.items) }))
      .filter((group) => group.items.length > 0)
    // `can` changes identity when permissions land, so the nav re-filters the
    // moment they arrive rather than staying stripped from the first render.
  }, [can, groups])
}
