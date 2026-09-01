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
import { supportTickets } from '../services/support-ticket.queries'
import { SUPPORT_TICKET_PRIORITY, SUPPORT_TICKET_STATUS } from '../types'

export function SupportTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const { data: ticket, isLoading, isError } = supportTickets.useDetail(ticketId)
  const remove = supportTickets.useRemove()
  const canUpdate = usePermission(PERMISSIONS.supportTicketsUpdate)
  const canDelete = usePermission(PERMISSIONS.supportTicketsDelete)

  if (isError || (!isLoading && !ticket)) {
    return (
      <PageContainer>
        <EmptyState
          title="Ticket not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.helpSupport}>Back to tickets</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const title = ticket ? ticket.subject : 'Loading…'

  const handleDelete = async (): Promise<void> => {
    if (!ticket) return

    const ok = await confirm({
      title: `Delete ${ticket.ticketNumber}?`,
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!ok) return

    await remove.mutateAsync(ticket.id)
    notify.success(`${ticket.ticketNumber} deleted`)
    navigate(PATHS.helpSupport)
  }

  return (
    <DetailPage
      title={title}
      subtitle={ticket?.ticketNumber}
      isLoading={isLoading}
      backTo={PATHS.helpSupport}
      backLabel="Back to tickets"
      status={ticket && <StatusBadge status={ticket.status} map={SUPPORT_TICKET_STATUS} />}
      meta={
        ticket
          ? [
              { label: 'Priority', value: SUPPORT_TICKET_PRIORITY[ticket.priority]?.label },
              { label: 'Category', value: ticket.category },
              {
                label: 'Created',
                value: ticket.createdAt ? formatDate(ticket.createdAt) : '—',
              },
            ]
          : undefined
      }
      actions={
        ticket && (
          <>
            {canUpdate && (
              <Button asChild variant="outline" size="sm">
                <Link to={route(PATHS.helpSupport, ticket.id, 'edit')}>
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
                    { label: 'Ticket number', value: ticket?.ticketNumber },
                    { label: 'Subject', value: ticket?.subject },
                    { label: 'Description', value: ticket?.description || '—' },
                    { label: 'Category', value: ticket?.category },
                    {
                      label: 'Priority',
                      value: ticket && (
                        <StatusBadge status={ticket.priority} map={SUPPORT_TICKET_PRIORITY} />
                      ),
                    },
                    {
                      label: 'Status',
                      value: ticket && (
                        <StatusBadge status={ticket.status} map={SUPPORT_TICKET_STATUS} />
                      ),
                    },
                    { label: 'User name', value: ticket?.userName || '—' },
                    { label: 'User email', value: ticket?.userEmail || '—' },
                    { label: 'User ID', value: ticket?.userId || '—' },
                    { label: 'Assigned to (ID)', value: ticket?.assignedToId || '—' },
                    {
                      label: 'Created',
                      value: ticket?.createdAt ? formatDate(ticket.createdAt) : '—',
                    },
                    {
                      label: 'Updated',
                      value: ticket?.updatedAt ? formatDate(ticket.updatedAt) : '—',
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

export default SupportTicketDetailPage
