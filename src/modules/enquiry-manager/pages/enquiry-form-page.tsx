import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { EnquiryForm } from '../components/enquiry-form'
import { enquiries } from '../services/enquiry.queries'

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/enquiries/new` has no `:enquiryId`,
 * `/enquiries/:id/edit` does. Both render the same `EnquiryForm`, so the two
 * paths cannot drift.
 */
export function EnquiryFormPage() {
  const { enquiryId } = useParams<{ enquiryId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(enquiryId)
  const { data: enquiry, isLoading, isError } = enquiries.useDetail(enquiryId)

  const create = enquiries.useCreate()
  const update = enquiries.useUpdate()

  const backTo =
    isEdit && enquiryId ? route(PATHS.enquiryManager, enquiryId) : PATHS.enquiryManager

  return (
    <FormPage
      title={isEdit ? `Edit ${enquiry ? enquiry.subject : 'enquiry'}` : 'New enquiry'}
      description={
        isEdit
          ? 'Update the details of this enquiry.'
          : 'Log a new contact or support submission.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to enquiry' : 'Back to enquiries'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="Enquiry not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={PATHS.enquiryManager}>Back to enquiries</Link>
              </Button>
            }
          />
        )
      }
    >
      <EnquiryForm
        enquiry={enquiry}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && enquiryId) {
            await update.mutateAsync({ id: enquiryId, payload: values })
            notify.success('Enquiry updated')
            navigate(route(PATHS.enquiryManager, enquiryId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('Enquiry created')
          // Straight to the new record: creating one is almost always followed
          // by wanting to look at it.
          navigate(route(PATHS.enquiryManager, created.id))
        }}
      />
    </FormPage>
  )
}

export default EnquiryFormPage
