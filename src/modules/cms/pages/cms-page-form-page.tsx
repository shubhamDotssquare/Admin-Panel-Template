import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { CmsPageForm } from '../components/cms-page-form'
import { cmsPages } from '../services/cms-page.queries'

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/cms/new` has no `:pageId`, `/cms/:pageId/edit`
 * does. Both render the same `CmsPageForm`, so the two paths cannot drift.
 */
export function CmsPageFormPage() {
  const { pageId } = useParams<{ pageId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(pageId)
  const { data: page, isLoading, isError } = cmsPages.useDetail(pageId)

  const create = cmsPages.useCreate()
  const update = cmsPages.useUpdate()

  const backTo = isEdit && pageId ? route(PATHS.cms, pageId) : PATHS.cms

  return (
    <FormPage
      title={isEdit ? `Edit ${page?.title ?? 'page'}` : 'Add page'}
      description={
        isEdit ? 'Update this page’s content and status.' : 'Create a new static page.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to page' : 'Back to pages'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="Page not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={PATHS.cms}>Back to pages</Link>
              </Button>
            }
          />
        )
      }
    >
      <CmsPageForm
        page={page}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && pageId) {
            await update.mutateAsync({ id: pageId, payload: values })
            notify.success('Page updated')
            navigate(route(PATHS.cms, pageId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('Page created')
          // Straight to the new record: creating one is almost always followed
          // by wanting to look at it.
          navigate(route(PATHS.cms, created.id))
        }}
      />
    </FormPage>
  )
}

export default CmsPageFormPage
