import { useQuery } from '@tanstack/react-query'

import { createQueryKeys } from '@/lib/query-keys'
import { httpClient } from '@/services/http-client'
import type { DashboardStats } from '../types'

/**
 * `/dashboard/stats` is a computed singleton, not a collection —
 * `createResourceQueries` assumes a list/detail REST shape this endpoint does
 * not have, so this is a bare `useQuery` instead.
 */
export const dashboardStatsKeys = createQueryKeys('dashboard-stats')

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardStatsKeys.all(),
    queryFn: () => httpClient.get<DashboardStats>('/dashboard/stats'),
  })
}
