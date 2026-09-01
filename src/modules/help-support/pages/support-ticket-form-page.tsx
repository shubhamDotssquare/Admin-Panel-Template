import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { SupportTicketForm } from '../components/support-ticket-form'
import { supportTickets } from '../services/support-ticket.queries'

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/help/new` has no `:ticketId`, `/help/:id/edit`
 * does. Both render the same `SupportTicketForm`, so the two paths cannot
 * drift.
 */
export function SupportTicketFormPage() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(ticketId)
  const { data: ticket, isLoading, isError } = supportTickets.useDetail(ticketId)

  const create = supportTickets.useCreate()
  const update = supportTickets.useUpdate()

  const backTo = isEdit && ticketId ? route(PATHS.helpSupport, ticketId) : PATHS.helpSupport

  return (
    <FormPage
      title={isEdit ? `Edit ${ticket ? ticket.ticketNumber : 'ticket'}` : 'New ticket'}
      description={
        isEdit
          ? 'Update this ticket’s details and status.'
          : 'Log an issue or request on behalf of a user.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to ticket' : 'Back to tickets'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="Ticket not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={PATHS.helpSupport}>Back to tickets</Link>
              </Button>
            }
          />
        )
      }
    >
      <SupportTicketForm
        ticket={ticket}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && ticketId) {
            await update.mutateAsync({ id: ticketId, payload: values })
            notify.success('Ticket updated')
            navigate(route(PATHS.helpSupport, ticketId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('Ticket created')
          // Straight to the new record: creating one is almost always followed
          // by wanting to look at it.
          navigate(route(PATHS.helpSupport, created.id))
        }}
      />
    </FormPage>
  )
}

export default SupportTicketFormPage
