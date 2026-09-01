/**
 * `GET /dashboard/stats` — a computed snapshot assembled on read, not a stored
 * record. There is no detail, create, update or delete counterpart.
 */
export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  newUsersToday: number
  newUsersThisMonth: number
  totalRevenue: number
  monthlyRevenue: number
  /** Percent change vs. the prior period. `null` when there is nothing to compare against yet. */
  revenueGrowth?: number | null
  /** Percent change vs. the prior period. `null` when there is nothing to compare against yet. */
  userGrowth?: number | null
  activeSessions: number
  openEnquiries: number
  openTickets: number
  resolvedTickets: number
}
