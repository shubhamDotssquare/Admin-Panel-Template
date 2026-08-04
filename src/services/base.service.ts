import type {
  ApiResponse,
  ListQueryParams,
  PaginatedResponse,
  RequestOptions,
} from '@/types/api.types'
import { httpClient } from './http-client'

/**
 * CRUD scaffolding for a REST resource.
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

    list: async (
      params?: ListQueryParams,
      options?: RequestOptions,
    ): Promise<PaginatedResponse<TEntity>> => {
      const response = await httpClient.get<ApiResponse<PaginatedResponse<TEntity>>>(
        resourcePath,
        { ...options, params: { ...params, ...options?.params } },
      )
      return response.data
    },

    get: async (id: TId, options?: RequestOptions): Promise<TEntity> => {
      const response = await httpClient.get<ApiResponse<TEntity>>(itemPath(id), options)
      return response.data
    },

    create: async (payload: TCreateDto, options?: RequestOptions): Promise<TEntity> => {
      const response = await httpClient.post<ApiResponse<TEntity>>(
        resourcePath,
        payload,
        options,
      )
      return response.data
    },

    update: async (
      id: TId,
      payload: TUpdateDto,
      options?: RequestOptions,
    ): Promise<TEntity> => {
      const response = await httpClient.put<ApiResponse<TEntity>>(
        itemPath(id),
        payload,
        options,
      )
      return response.data
    },

    patch: async (
      id: TId,
      payload: Partial<TUpdateDto>,
      options?: RequestOptions,
    ): Promise<TEntity> => {
      const response = await httpClient.patch<ApiResponse<TEntity>>(
        itemPath(id),
        payload,
        options,
      )
      return response.data
    },

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
