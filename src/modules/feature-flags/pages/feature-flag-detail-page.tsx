import { Info, Pencil, Power } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/hooks/use-confirm'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDate } from '@/utils/format'
import { notify } from '@/utils/toast'
import { featureFlags, useToggleFeatureFlag } from '../services/feature-flag.queries'

export function FeatureFlagDetailPage() {
  const { flagId } = useParams<{ flagId: string }>()
  const confirm = useConfirm()

  const { data: flag, isLoading, isError } = featureFlags.useDetail(flagId)
  const toggle = useToggleFeatureFlag()
  const canUpdate = usePermission(PERMISSIONS.featureFlagsUpdate)

  if (isError || (!isLoading && !flag)) {
    return (
      <PageContainer>
        <EmptyState
          title="Feature flag not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.featureFlags}>Back to feature flags</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const handleToggle = async (): Promise<void> => {
    if (!flag) return

    // Only confirm the destructive direction — see the list page for the
    // same reasoning.
    if (flag.enabled) {
      const ok = await confirm({
        title: `Disable ${flag.name}?`,
        description: 'This turns the associated behaviour off immediately.',
        confirmLabel: 'Disable',
        tone: 'destructive',
      })
      if (!ok) return
    }

    await toggle.mutateAsync(flag.id)
    notify.success(flag.enabled ? `${flag.name} disabled` : `${flag.name} enabled`)
  }

  return (
    <DetailPage
      title={flag?.name ?? 'Loading…'}
      subtitle={flag?.key}
      isLoading={isLoading}
      backTo={PATHS.featureFlags}
      backLabel="Back to feature flags"
      status={
        flag && (
          <Badge variant={flag.enabled ? 'default' : 'outline'}>
            {flag.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        )
      }
      meta={flag ? [{ label: 'Updated', value: formatDate(flag.updatedAt) }] : undefined}
      actions={
        flag &&
        canUpdate && (
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={route(PATHS.featureFlags, flag.id, 'edit')}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>

            <Button
              variant={flag.enabled ? 'destructive' : 'default'}
              size="sm"
              disabled={toggle.isPending}
              onClick={() => void handleToggle()}
            >
              <Power className="size-4" />
              {flag.enabled ? 'Disable' : 'Enable'}
            </Button>
          </>
        )
      }
      tabs={[
        {
          id: 'overview',
          label: 'Overview',
          icon: Info,
          content: (
            <Card>
              <CardContent>
                <DescriptionList
                  isLoading={isLoading}
                  items={[
                    { label: 'Key', value: flag?.key },
                    { label: 'Name', value: flag?.name },
                    { label: 'Description', value: flag?.description || '—' },
                    {
                      label: 'Enabled',
                      value: (
                        <Badge variant={flag?.enabled ? 'default' : 'outline'}>
                          {flag?.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      ),
                    },
                    { label: 'Created', value: flag?.createdAt ? formatDate(flag.createdAt) : '—' },
                    { label: 'Flag ID', value: flag?.id },
                  ]}
                />
              </CardContent>
            </Card>
          ),
        },
      ]}
    />
  )
}

export default FeatureFlagDetailPage
