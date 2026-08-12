import {
  keepPreviousData,
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'

import { createResourceService, type ResourceService } from '@/services/base.service'
import type { ListQueryParams, PaginatedResponse } from '@/types/api.types'
import { createQueryKeys } from './query-keys'

/** Everything a caller may override, minus what the factory owns. */
type QueryOverrides<TData> = Omit<UseQueryOptions<TData, Error, TData>, 'queryKey' | 'queryFn'>

type MutationOverrides<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  'mutationFn'
>

/**
 * Turns a REST resource into a typed service plus ready-made query hooks.
 *
 * This is the seam feature modules build on — one call yields the fetching,
 * caching, invalidation and pagination behaviour that would otherwise be
 * rewritten (and subtly varied) per module:
 *
 * ```ts
 * // src/modules/user-manager/services/user.queries.ts
 * export const users = createResourceQueries<User, CreateUserDto>('users', '/users')
 *
 * // in a screen
 * const { page, perPage, setPage } = usePagination()
 * const { data, isLoading } = users.useList({ page, perPage })
 * const remove = users.useRemove()
 * ```
 *
 * Anything non-standard is added by composing, not by forking: pass a custom
 * `service`, or spread `users.service` into a larger object.
 */
export function createResourceQueries<
  TEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = TCreateDto,
  TId extends string | number = string,
>(
  /** Cache namespace, e.g. `'users'`. Must be unique across the app. */
  resource: string,
  /** REST path, e.g. `'/users'`, or a pre-built service to reuse. */
  pathOrService: string | ResourceService<TEntity, TCreateDto, TUpdateDto, TId>,
) {
  const service =
    typeof pathOrService === 'string'
      ? createResourceService<TEntity, TCreateDto, TUpdateDto, TId>(pathOrService)
      : pathOrService

  const keys = createQueryKeys<TId>(resource)

  return {
    keys,
    service,

    /**
     * A page of records.
     *
     * `keepPreviousData` holds the current page on screen while the next one
     * loads, so paging through a table does not flash an empty body between
     * pages.
     */
    useList: (params?: ListQueryParams, options?: QueryOverrides<PaginatedResponse<TEntity>>) =>
      useQuery({
        queryKey: keys.list(params),
        queryFn: () => service.list(params),
        placeholderData: keepPreviousData,
        ...options,
      }),

    /** One record. Disabled automatically until an id exists. */
    useDetail: (id: TId | undefined, options?: QueryOverrides<TEntity>) =>
      useQuery({
        queryKey: keys.detail(id as TId),
        queryFn: () => service.get(id as TId),
        enabled: id !== undefined && id !== null && id !== '',
        ...options,
      }),

    useCreate: (options?: MutationOverrides<TEntity, TCreateDto>) =>
      useMutation({
        mutationFn: (payload: TCreateDto) => service.create(payload),
        // Every list is now potentially wrong; details are untouched.
        meta: { invalidates: [keys.lists()] },
        ...options,
      }),

    useUpdate: (options?: MutationOverrides<TEntity, { id: TId; payload: TUpdateDto }>) =>
      useMutation({
        mutationFn: ({ id, payload }: { id: TId; payload: TUpdateDto }) =>
          service.update(id, payload),
        meta: { invalidates: [keys.all()] },
        ...options,
      }),

    usePatch: (
      options?: MutationOverrides<TEntity, { id: TId; payload: Partial<TUpdateDto> }>,
    ) =>
      useMutation({
        mutationFn: ({ id, payload }: { id: TId; payload: Partial<TUpdateDto> }) =>
          service.patch(id, payload),
        meta: { invalidates: [keys.all()] },
        ...options,
      }),

    useRemove: (options?: MutationOverrides<unknown, TId>) =>
      useMutation({
        mutationFn: (id: TId) => service.remove(id),
        meta: { invalidates: [keys.all()] },
        ...options,
      }),
  }
}

export type ResourceQueries<
  TEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = TCreateDto,
  TId extends string | number = string,
> = ReturnType<typeof createResourceQueries<TEntity, TCreateDto, TUpdateDto, TId>>
