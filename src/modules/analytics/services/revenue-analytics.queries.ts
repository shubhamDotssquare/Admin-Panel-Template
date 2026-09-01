import { createResourceQueries } from '@/lib/create-resource-queries'
import type { CreateRevenueDto, RevenueSnapshot, UpdateRevenueDto } from '../types'

/**
 * `/revenue-analytics` — literal path, not `API_ENDPOINTS`: this resource has no
 * sub-actions beyond plain CRUD, so a registry entry would only be indirection.
 */
export const revenueAnalytics = createResourceQueries<
  RevenueSnapshot,
  CreateRevenueDto,
  UpdateRevenueDto
>('revenue-analytics', '/revenue-analytics')
