import { API_ENDPOINTS } from '@/constants/api-endpoints'
import type { ListQueryParams, PaginatedResponse } from '@/types/api.types'
import type {
  CreateRoleDto,
  EffectivePermissions,
  Permission,
  Resource,
  RoleDetail,
  RoleSummary,
  UpdateRoleDto,
} from '@/types/rbac.types'
import { httpClient } from './http-client'

/**
 * Roles, permissions and resources.
 *
 * Lives in `services/` rather than a module because permissions are
 * cross-cutting: the auth context loads them on boot and the nav and every
 * screen read them, so no single feature module can own this.
 */
export const rbacService = {
  /**
   * The signed-in admin's own roles and flattened permissions.
   *
   * Needs no permission of its own — any signed-in admin may ask what they can
   * do, which is what makes it safe to call during boot.
   */
  myPermissions: () => httpClient.get<EffectivePermissions>(API_ENDPOINTS.rbac.myPermissions),

  // ── Roles ─────────────────────────────────────────────────────────
  listRoles: (params?: ListQueryParams): Promise<PaginatedResponse<RoleSummary>> =>
    httpClient.list<RoleSummary>(API_ENDPOINTS.rbac.roles, { params }),

  /** Returns directly-attached permissions; inherited ones are not included. */
  getRole: (id: string) => httpClient.get<RoleDetail>(API_ENDPOINTS.rbac.role(id)),

  createRole: (payload: CreateRoleDto) =>
    httpClient.post<RoleSummary>(API_ENDPOINTS.rbac.roles, payload),

  updateRole: (id: string, payload: UpdateRoleDto) =>
    httpClient.patch<RoleSummary>(API_ENDPOINTS.rbac.role(id), payload),

  /** 403 `SYSTEM_ROLE_PROTECTED` for the seeded roles — offer deactivate instead. */
  deleteRole: (id: string) => httpClient.delete<null>(API_ENDPOINTS.rbac.role(id)),

  attachPermission: (roleId: string, permissionId: string) =>
    httpClient.post<null>(API_ENDPOINTS.rbac.rolePermissions(roleId), { permissionId }),

  detachPermission: (roleId: string, permissionId: string) =>
    httpClient.delete<null>(API_ENDPOINTS.rbac.rolePermission(roleId, permissionId)),

  // ── Reference data (seeded server-side, read-only) ────────────────
  listPermissions: (params?: ListQueryParams): Promise<PaginatedResponse<Permission>> =>
    httpClient.list<Permission>(API_ENDPOINTS.rbac.permissions, { params }),

  listResources: (params?: ListQueryParams): Promise<PaginatedResponse<Resource>> =>
    httpClient.list<Resource>(API_ENDPOINTS.rbac.resources, { params }),

  // ── Role assignment ───────────────────────────────────────────────
  adminRoles: (adminId: string) =>
    httpClient.get<EffectivePermissions>(API_ENDPOINTS.rbac.adminRoles(adminId)),

  /** Idempotent — assigning a role the admin already holds is not an error. */
  assignRole: (adminId: string, roleId: string) =>
    httpClient.post<null>(API_ENDPOINTS.rbac.adminRoles(adminId), { roleId }),

  revokeRole: (adminId: string, roleId: string) =>
    httpClient.delete<null>(API_ENDPOINTS.rbac.adminRole(adminId, roleId)),
}

export type RbacService = typeof rbacService
