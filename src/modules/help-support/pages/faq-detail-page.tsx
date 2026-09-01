import { Info, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage, StatusBadge } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/hooks/use-confirm'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDate } from '@/utils/format'
import { notify } from '@/utils/toast'
import { faqs } from '../services/faq.queries'
import { FAQ_STATUS } from '../types'

/** List lives at `/help/faqs`. */
const faqListPath = route(PATHS.helpSupport, 'faqs')

export function FaqDetailPage() {
  const { faqId } = useParams<{ faqId: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const { data: faq, isLoading, isError } = faqs.useDetail(faqId)
  const remove = faqs.useRemove()
  const canUpdate = usePermission(PERMISSIONS.faqsUpdate)
  const canDelete = usePermission(PERMISSIONS.faqsDelete)

  if (isError || (!isLoading && !faq)) {
    return (
      <PageContainer>
        <EmptyState
          title="FAQ not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={faqListPath}>Back to FAQs</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const title = faq ? faq.question : 'Loading…'

  const handleDelete = async (): Promise<void> => {
    if (!faq) return

    const ok = await confirm({
      title: 'Delete this FAQ?',
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!ok) return

    await remove.mutateAsync(faq.id)
    notify.success('FAQ deleted')
    navigate(faqListPath)
  }

  return (
    <DetailPage
      title={title}
      subtitle={faq?.category ?? undefined}
      isLoading={isLoading}
      backTo={faqListPath}
      backLabel="Back to FAQs"
      status={faq && <StatusBadge status={faq.status} map={FAQ_STATUS} />}
      meta={
        faq
          ? [
              { label: 'Order', value: faq.order },
              { label: 'Updated', value: faq.updatedAt ? formatDate(faq.updatedAt) : '—' },
            ]
          : undefined
      }
      actions={
        faq && (
          <>
            {canUpdate && (
              <Button asChild variant="outline" size="sm">
                <Link to={route(PATHS.helpSupport, 'faqs', faq.id, 'edit')}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
            )}

            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                disabled={remove.isPending}
                onClick={() => void handleDelete()}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
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
                    { label: 'Question', value: faq?.question },
                    { label: 'Answer', value: faq?.answer },
                    { label: 'Category', value: faq?.category || '—' },
                    {
                      label: 'Status',
                      value: faq && <StatusBadge status={faq.status} map={FAQ_STATUS} />,
                    },
                    { label: 'Order', value: faq?.order },
                    {
                      label: 'Created',
                      value: faq?.createdAt ? formatDate(faq.createdAt) : '—',
                    },
                    {
                      label: 'Updated',
                      value: faq?.updatedAt ? formatDate(faq.updatedAt) : '—',
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

export default FaqDetailPage
