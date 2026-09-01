import { createResourceQueries } from '@/lib/create-resource-queries'
import type { CreateSupportTicketDto, SupportTicket, UpdateSupportTicketDto } from '../types'

export const supportTickets = createResourceQueries<
  SupportTicket,
  CreateSupportTicketDto,
  UpdateSupportTicketDto
>('support-tickets', '/support-tickets')
