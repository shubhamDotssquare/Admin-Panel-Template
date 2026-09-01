import type { StatusMap } from '@/components/patterns'

/** How urgently an enquiry needs a response. */
export type EnquiryPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

/** Where an enquiry sits in its handling lifecycle. */
export type EnquiryStatus = 'NEW' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

/**
 * `Enquiry` from the API.
 *
 * A contact/support submission — someone reaching out, not an account. There
 * is no password or session here, only a message that an admin triages and
 * resolves.
 */
export interface Enquiry {
  id: string
  name: string
  email: string
  phone?: string | null
  subject: string
  category: string
  priority: EnquiryPriority
  status: EnquiryStatus
  source?: string | null
  notes?: string | null
  assignedToId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateEnquiryDto {
  name: string
  email: string
  subject: string
  category: string
  phone?: string
  priority?: EnquiryPriority
  status?: EnquiryStatus
  source?: string
  notes?: string
  assignedToId?: string
}

export type UpdateEnquiryDto = Partial<CreateEnquiryDto>

export const ENQUIRY_PRIORITY: StatusMap<EnquiryPriority> = {
  LOW: { label: 'Low', tone: 'neutral' },
  MEDIUM: { label: 'Medium', tone: 'info' },
  HIGH: { label: 'High', tone: 'warning' },
  URGENT: { label: 'Urgent', tone: 'destructive' },
}

export const ENQUIRY_PRIORITY_OPTIONS = (
  Object.keys(ENQUIRY_PRIORITY) as EnquiryPriority[]
).map((value) => ({
  label: ENQUIRY_PRIORITY[value].label,
  value,
}))

export const ENQUIRY_STATUS: StatusMap<EnquiryStatus> = {
  NEW: { label: 'New', tone: 'info' },
  OPEN: { label: 'Open', tone: 'warning' },
  IN_PROGRESS: { label: 'In progress', tone: 'warning' },
  RESOLVED: { label: 'Resolved', tone: 'success' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
}

export const ENQUIRY_STATUS_OPTIONS = (Object.keys(ENQUIRY_STATUS) as EnquiryStatus[]).map(
  (value) => ({
    label: ENQUIRY_STATUS[value].label,
    value,
  }),
)
