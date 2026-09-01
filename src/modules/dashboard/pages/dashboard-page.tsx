import {
  AlertTriangle,
  Banknote,
  CalendarPlus,
  CheckCircle2,
  Inbox,
  LifeBuoy,
  Radio,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { StatCard, type StatCardProps } from '@/components/patterns'
import { Skeleton } from '@/components/ui/skeleton'
import { appConfig } from '@/config/app.config'
import { PATHS } from '@/router/paths'
import { resolveAuthError } from '@/services/auth-error'
import { formatCurrency, formatNumber } from '@/utils/format'
import { useDashboardStats } from '../services/dashboard.queries'

/** A signed percentage, e.g. `12.4` → "+12.4%". `null`/`undefined` renders no trend at all. */
function growthTrend(value: number | null | undefined): StatCardProps['trend'] {
  if (value === null || value === undefined) return undefined

  return {
    value: `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
    direction: value >= 0 ? 'up' : 'down',
  }
}

/** Only worth a caption once there is an actual trend to explain. */
function growthHint(value: number | null | undefined): string | undefined {
  return value === null || value === undefined ? undefined : 'vs. last month'
}

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-heading-4">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
    </section>
  )
}

function StatSectionSkeleton({ title, count }: { title: string; count: number }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-heading-4">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: count }, (_, index) => (
          <Skeleton key={index} className="h-28 rounded-lg" />
        ))}
      </div>
    </section>
  )
}

/**
 * Landing screen for the shell: a snapshot of `/dashboard/stats`.
 *
 * Plain numeric stat cards, deliberately — there is no chart library in this
 * project and none is added here. Fields are grouped the way an admin actually
 * reads them (users, revenue, activity) rather than in API response order.
 */
export function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardStats()

  let body: React.ReactNode
  if (isError) {
    body = (
      <EmptyState
        icon={AlertTriangle}
        title="Could not load dashboard stats"
        description={resolveAuthError(error).message}
      />
    )
  } else if (isLoading || !data) {
    body = (
      <>
        <StatSectionSkeleton title="Users" count={4} />
        <StatSectionSkeleton title="Revenue" count={2} />
        <StatSectionSkeleton title="Activity" count={4} />
      </>
    )
  } else {
    body = (
      <>
        <StatSection title="Users">
          <StatCard
            label="Total users"
            value={formatNumber(data.totalUsers)}
            icon={Users}
            to={PATHS.userManager}
          />
          <StatCard
            label="Active users"
            value={formatNumber(data.activeUsers)}
            icon={UserCheck}
            to={PATHS.userManager}
          />
          <StatCard
            label="New today"
            value={formatNumber(data.newUsersToday)}
            icon={UserPlus}
            to={PATHS.userManager}
          />
          <StatCard
            label="New this month"
            value={formatNumber(data.newUsersThisMonth)}
            icon={CalendarPlus}
            trend={growthTrend(data.userGrowth)}
            hint={growthHint(data.userGrowth)}
            to={PATHS.userManager}
          />
        </StatSection>

        <StatSection title="Revenue">
          <StatCard
            label="Total revenue"
            value={formatCurrency(data.totalRevenue)}
            icon={Banknote}
            to={PATHS.analytics}
          />
          <StatCard
            label="Monthly revenue"
            value={formatCurrency(data.monthlyRevenue)}
            icon={TrendingUp}
            trend={growthTrend(data.revenueGrowth)}
            hint={growthHint(data.revenueGrowth)}
            to={PATHS.analytics}
          />
        </StatSection>

        <StatSection title="Activity">
          <StatCard
            label="Active sessions"
            value={formatNumber(data.activeSessions)}
            icon={Radio}
            to={PATHS.activityFeed}
          />
          <StatCard
            label="Open enquiries"
            value={formatNumber(data.openEnquiries)}
            icon={Inbox}
            to={PATHS.enquiryManager}
          />
          <StatCard
            label="Open tickets"
            value={formatNumber(data.openTickets)}
            icon={LifeBuoy}
            to={PATHS.helpSupport}
          />
          <StatCard
            label="Resolved tickets"
            value={formatNumber(data.resolvedTickets)}
            icon={CheckCircle2}
            to={PATHS.helpSupport}
          />
        </StatSection>
      </>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`An overview of ${appConfig.name} — users, revenue and open work.`}
      />

      {body}
    </PageContainer>
  )
}

export default DashboardPage
