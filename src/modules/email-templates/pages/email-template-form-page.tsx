import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { EmailTemplateForm } from '../components/email-template-form'
import { emailTemplates } from '../services/email-template.queries'

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/email-templates/new` has no `:templateId`,
 * `/email-templates/:id/edit` does. Both render the same `EmailTemplateForm`,
 * so the two paths cannot drift.
 */
export function EmailTemplateFormPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(templateId)
  const { data: template, isLoading, isError } = emailTemplates.useDetail(templateId)

  const create = emailTemplates.useCreate()
  const update = emailTemplates.useUpdate()

  const backTo =
    isEdit && templateId ? route(PATHS.emailTemplates, templateId) : PATHS.emailTemplates

  return (
    <FormPage
      title={isEdit ? `Edit ${template ? template.name : 'template'}` : 'Add email template'}
      description={
        isEdit
          ? 'Update this template’s content and status.'
          : 'Create a template for transactional or marketing email.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to template' : 'Back to email templates'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="Template not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={PATHS.emailTemplates}>Back to email templates</Link>
              </Button>
            }
          />
        )
      }
    >
      <EmailTemplateForm
        template={template}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && templateId) {
            await update.mutateAsync({ id: templateId, payload: values })
            notify.success('Template updated')
            navigate(route(PATHS.emailTemplates, templateId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('Template created')
          // Straight to the new record: creating one is almost always followed
          // by wanting to look at it.
          navigate(route(PATHS.emailTemplates, created.id))
        }}
      />
    </FormPage>
  )
}

export default EmailTemplateFormPage
