import type { StatusMap } from '@/components/patterns'

/** Lifecycle of a support ticket. */
export type SupportTicketStatus = 'NEW' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

/** How urgently a ticket needs attention. */
export type SupportTicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

/**
 * `SupportTicket` from the API.
 *
 * `ticketNumber` (e.g. `"TKT-10001"`) is server-generated on create and never
 * appears on the form — it is shown read-only on the detail screen.
 */
export interface SupportTicket {
  id: string
  ticketNumber: string
  subject: string
  description?: string | null
  category: string
  priority: SupportTicketPriority
  status: SupportTicketStatus
  userId?: string | null
  userName?: string | null
  userEmail?: string | null
  assignedToId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateSupportTicketDto {
  subject: string
  category: string
  description?: string
  priority?: SupportTicketPriority
  status?: SupportTicketStatus
  userId?: string
  userName?: string
  userEmail?: string
  assignedToId?: string
}

export type UpdateSupportTicketDto = Partial<CreateSupportTicketDto>

export const SUPPORT_TICKET_STATUS: StatusMap<SupportTicketStatus> = {
  NEW: { label: 'New', tone: 'info' },
  OPEN: { label: 'Open', tone: 'warning' },
  IN_PROGRESS: { label: 'In progress', tone: 'warning' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
}

export const SUPPORT_TICKET_STATUS_OPTIONS = (
  Object.keys(SUPPORT_TICKET_STATUS) as SupportTicketStatus[]
).map((value) => ({
  label: SUPPORT_TICKET_STATUS[value].label,
  value,
}))

export const SUPPORT_TICKET_PRIORITY: StatusMap<SupportTicketPriority> = {
  LOW: { label: 'Low', tone: 'neutral' },
  MEDIUM: { label: 'Medium', tone: 'info' },
  HIGH: { label: 'High', tone: 'warning' },
  URGENT: { label: 'Urgent', tone: 'destructive' },
}

export const SUPPORT_TICKET_PRIORITY_OPTIONS = (
  Object.keys(SUPPORT_TICKET_PRIORITY) as SupportTicketPriority[]
).map((value) => ({
  label: SUPPORT_TICKET_PRIORITY[value].label,
  value,
}))

/** Lifecycle of a FAQ entry. */
export type FaqStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

/** `Faq` from the API. */
export interface Faq {
  id: string
  question: string
  answer: string
  category?: string | null
  status: FaqStatus
  order: number
  createdAt: string
  updatedAt: string
}

export interface CreateFaqDto {
  question: string
  answer: string
  category?: string
  status?: FaqStatus
  /** Integer, minimum 0. Controls display order among FAQs. */
  order?: number
}

export type UpdateFaqDto = Partial<CreateFaqDto>

export const FAQ_STATUS: StatusMap<FaqStatus> = {
  DRAFT: { label: 'Draft', tone: 'warning', description: 'Not yet visible to end users.' },
  PUBLISHED: { label: 'Published', tone: 'success' },
  ARCHIVED: { label: 'Archived', tone: 'neutral' },
}

export const FAQ_STATUS_OPTIONS = (Object.keys(FAQ_STATUS) as FaqStatus[]).map((value) => ({
  label: FAQ_STATUS[value].label,
  value,
}))
