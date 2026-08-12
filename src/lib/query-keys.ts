import type { ListQueryParams } from '@/types/api.types'

/**
 * Query keys, built to a fixed shape so invalidation stays predictable.
 *
 * The shape is hierarchical — `[resource]` → `[resource, 'list']` →
 * `[resource, 'list', params]` — because TanStack matches keys by prefix. That
 * gives three useful blast radii for free:
 *
 * ```ts
 * invalidateQueries({ queryKey: userKeys.all() })      // everything user-shaped
 * invalidateQueries({ queryKey: userKeys.lists() })    // every list, any filter
 * invalidateQueries({ queryKey: userKeys.detail(id) }) // one record
 * ```
 *
 * Hand-written string keys drift and quietly stop matching; a factory per
 * resource cannot.
 */
export function createQueryKeys<TId extends string | number = string>(resource: string) {
  return {
    /** Everything belonging to this resource. */
    all: () => [resource] as const,
    /** Every list, regardless of filters. */
    lists: () => [resource, 'list'] as const,
    /** One specific list query. */
    list: (params?: ListQueryParams) => [resource, 'list', params ?? {}] as const,
    /** Every detail query. */
    details: () => [resource, 'detail'] as const,
    /** One record. */
    detail: (id: TId) => [resource, 'detail', id] as const,
  }
}

export type QueryKeyFactory<TId extends string | number = string> = ReturnType<
  typeof createQueryKeys<TId>
>

/** Keys for the framework's own auth data, used by the account screens. */
export const authKeys = {
  all: () => ['auth'] as const,
  me: () => ['auth', 'me'] as const,
  sessions: () => ['auth', 'sessions'] as const,
}
