import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { StatCard, type StatCardProps } from './stat-card'
import { cn } from '@/utils/cn'

export interface ListPageProps {
  title: string
  description?: string
  /** Primary buttons for the header, e.g. "Add user". */
  actions?: React.ReactNode
  /** Summary row above the table. Omit for a plain list. */
  stats?: StatCardProps[]
  /** Shows skeletons in every card while the counts load. */
  isLoadingStats?: boolean
  /** Filters or tabs that belong above the table but outside its toolbar. */
  toolbar?: React.ReactNode
  /** The table. */
  children: React.ReactNode
  fullWidth?: boolean
  className?: string
}

/**
 * The standard shape of a list screen: heading, summary cards, table.
 *
 * Every list page in the panel opens this way, so the layout — spacing, the
 * responsive stat grid, where actions sit — is decided once here instead of
 * being re-approximated per module.
 *
 * ```tsx
 * <ListPage title="Users" description="Manage accounts and access."
 *           actions={<Button size="sm">Add user</Button>}
 *           stats={[{ label: 'Total', value: '1,204', icon: Users }]}>
 *   <CrudTable schema={schema} table={table} rows={rows} />
 * </ListPage>
 * ```
 */
export function ListPage({
  title,
  description,
  actions,
  stats,
  isLoadingStats = false,
  toolbar,
  children,
  fullWidth,
  className,
}: ListPageProps) {
  return (
    <PageContainer fullWidth={fullWidth} className={className}>
      <PageHeader title={title} description={description} actions={actions} />

      {stats && stats.length > 0 && (
        <div
          className={cn(
            'grid gap-4',
            // Column count follows the number of cards, so three stats do not
            // leave a hole in a four-column grid.
            stats.length <= 2 && 'sm:grid-cols-2',
            stats.length === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
            stats.length >= 4 && 'sm:grid-cols-2 xl:grid-cols-4',
          )}
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} isLoading={stat.isLoading ?? isLoadingStats} />
          ))}
        </div>
      )}

      {toolbar}
      {children}
    </PageContainer>
  )
}
