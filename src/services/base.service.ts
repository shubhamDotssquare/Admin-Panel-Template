import type { ListQueryParams, PaginatedResponse, RequestOptions } from '@/types/api.types'
import { httpClient } from './http-client'

/**
 * CRUD scaffolding for a REST resource.
 *
 * `httpClient` already unwraps the `{ success, message, data }` envelope, so
 * these return the payload directly — do not unwrap again.
 *
 * A module creates its service by naming its resource path and payload types:
 *
 * ```ts
 * // src/modules/user-manager/services/user.service.ts
 * export const userService = createResourceService<User, CreateUserDto>('/users')
 * ```
 *
 * Non-standard endpoints are added by spreading the result:
 *
 * ```ts
 * export const userService = {
 *   ...createResourceService<User>('/users'),
 *   suspend: (id: string) => httpClient.post(`/users/${id}/suspend`),
 * }
 * ```
 */
export function createResourceService<
  TEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = TCreateDto,
  TId extends string | number = string,
>(resourcePath: string) {
  const itemPath = (id: TId): string => `${resourcePath}/${id}`

  return {
    resourcePath,

    list: (
      params?: ListQueryParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<TEntity>> =>
      httpClient.get<PaginatedResponse<TEntity>>(resourcePath, {
        ...options,
        params: { ...params, ...options?.params },
      }),

    get: (id: TId, options?: RequestOptions): Promise<TEntity> =>
      httpClient.get<TEntity>(itemPath(id), options),

    create: (payload: TCreateDto, options?: RequestOptions): Promise<TEntity> =>
      httpClient.post<TEntity>(resourcePath, payload, options),

    update: (id: TId, payload: TUpdateDto, options?: RequestOptions): Promise<TEntity> =>
      httpClient.put<TEntity>(itemPath(id), payload, options),

    patch: (
      id: TId,
      payload: Partial<TUpdateDto>,
      options?: RequestOptions,
    ): Promise<TEntity> => httpClient.patch<TEntity>(itemPath(id), payload, options),

    remove: (id: TId, options?: RequestOptions): Promise<unknown> =>
      httpClient.delete(itemPath(id), options),
  }
}

export type ResourceService<
  TEntity,
  TCreateDto = Partial<TEntity>,
  TUpdateDto = TCreateDto,
  TId extends string | number = string,
> = ReturnType<typeof createResourceService<TEntity, TCreateDto, TUpdateDto, TId>>
