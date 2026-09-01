import { Info, Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage, StatusBadge } from '@/components/patterns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDate } from '@/utils/format'
import { emailTemplates } from '../services/email-template.queries'
import { EMAIL_TEMPLATE_STATUS } from '../types'

export function EmailTemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>()

  const { data: template, isLoading, isError } = emailTemplates.useDetail(templateId)
  const canUpdate = usePermission(PERMISSIONS.emailTemplatesUpdate)

  if (isError || (!isLoading && !template)) {
    return (
      <PageContainer>
        <EmptyState
          title="Template not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.emailTemplates}>Back to email templates</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const name = template ? template.name : 'Loading…'
  const variables = template?.variables ?? []

  return (
    <DetailPage
      title={name}
      subtitle={template?.subject}
      isLoading={isLoading}
      backTo={PATHS.emailTemplates}
      backLabel="Back to email templates"
      status={template && <StatusBadge status={template.status} map={EMAIL_TEMPLATE_STATUS} />}
      meta={
        template
          ? [
              { label: 'Key', value: <span className="font-mono">{template.key}</span> },
              { label: 'Created', value: template.createdAt ? formatDate(template.createdAt) : '—' },
              { label: 'Updated', value: template.updatedAt ? formatDate(template.updatedAt) : '—' },
            ]
          : undefined
      }
      actions={
        template &&
        canUpdate && (
          <Button asChild variant="outline" size="sm">
            <Link to={route(PATHS.emailTemplates, template.id, 'edit')}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
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
                    { label: 'Name', value: template?.name },
                    { label: 'Key', value: template && <span className="font-mono">{template.key}</span> },
                    { label: 'Subject', value: template?.subject },
                    {
                      label: 'Status',
                      value: template && (
                        <StatusBadge status={template.status} map={EMAIL_TEMPLATE_STATUS} />
                      ),
                    },
                    {
                      label: 'Variables',
                      full: true,
                      value:
                        variables.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {variables.map((variable) => (
                              <Badge key={variable} variant="secondary">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        ) : undefined,
                    },
                    {
                      label: 'Body',
                      full: true,
                      value: template?.body ? (
                        <pre className="max-h-96 overflow-auto rounded-md border bg-muted/40 p-3 text-caption whitespace-pre-wrap">
                          {template.body}
                        </pre>
                      ) : undefined,
                    },
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

export default EmailTemplateDetailPage
