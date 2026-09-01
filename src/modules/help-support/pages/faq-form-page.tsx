import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { FaqForm } from '../components/faq-form'
import { faqs } from '../services/faq.queries'

/** List lives at `/help/faqs`. */
const faqListPath = route(PATHS.helpSupport, 'faqs')

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/help/faqs/new` has no `:faqId`,
 * `/help/faqs/:id/edit` does. Both render the same `FaqForm`, so the two
 * paths cannot drift.
 */
export function FaqFormPage() {
  const { faqId } = useParams<{ faqId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(faqId)
  const { data: faq, isLoading, isError } = faqs.useDetail(faqId)

  const create = faqs.useCreate()
  const update = faqs.useUpdate()

  const backTo = isEdit && faqId ? route(PATHS.helpSupport, 'faqs', faqId) : faqListPath

  return (
    <FormPage
      title={isEdit ? 'Edit FAQ' : 'New FAQ'}
      description={
        isEdit
          ? 'Update this question, its answer, and where it appears.'
          : 'Add a frequently asked question for users.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to FAQ' : 'Back to FAQs'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="FAQ not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={faqListPath}>Back to FAQs</Link>
              </Button>
            }
          />
        )
      }
    >
      <FaqForm
        faq={faq}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && faqId) {
            await update.mutateAsync({ id: faqId, payload: values })
            notify.success('FAQ updated')
            navigate(route(PATHS.helpSupport, 'faqs', faqId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('FAQ created')
          // Straight to the new record: creating one is almost always followed
          // by wanting to look at it.
          navigate(route(PATHS.helpSupport, 'faqs', created.id))
        }}
      />
    </FormPage>
  )
}

export default FaqFormPage
