import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { FeatureFlagForm } from '../components/feature-flag-form'
import { featureFlags } from '../services/feature-flag.queries'

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/feature-flags/new` has no `:flagId`,
 * `/feature-flags/:id/edit` does. Both render the same `FeatureFlagForm`, so
 * the two paths cannot drift.
 */
export function FeatureFlagFormPage() {
  const { flagId } = useParams<{ flagId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(flagId)
  const { data: flag, isLoading, isError } = featureFlags.useDetail(flagId)

  const create = featureFlags.useCreate()
  const update = featureFlags.useUpdate()

  const backTo = isEdit && flagId ? route(PATHS.featureFlags, flagId) : PATHS.featureFlags

  return (
    <FormPage
      title={isEdit ? `Edit ${flag?.name ?? 'feature flag'}` : 'Add feature flag'}
      description={
        isEdit
          ? 'Update this flag’s details.'
          : 'Create a flag to gate behaviour without a deploy.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to flag' : 'Back to feature flags'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="Feature flag not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={PATHS.featureFlags}>Back to feature flags</Link>
              </Button>
            }
          />
        )
      }
    >
      <FeatureFlagForm
        featureFlag={flag}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && flagId) {
            await update.mutateAsync({ id: flagId, payload: values })
            notify.success('Feature flag updated')
            navigate(route(PATHS.featureFlags, flagId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('Feature flag created')
          navigate(route(PATHS.featureFlags, created.id))
        }}
      />
    </FormPage>
  )
}

export default FeatureFlagFormPage
