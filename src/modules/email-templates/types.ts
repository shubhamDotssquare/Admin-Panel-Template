import type { StatusMap } from '@/components/patterns'

/** Lifecycle of an email template record. */
export type EmailTemplateStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED'

/** `EmailTemplate` from the API. */
export interface EmailTemplate {
  id: string
  name: string
  /** Uppercase/underscore convention, e.g. `WELCOME_EMAIL`. Used to look the template up at send time. */
  key: string
  subject: string
  body?: string | null
  /** Placeholder names the template body may reference, e.g. `["name", "appName"]`. */
  variables: string[]
  status: EmailTemplateStatus
  createdAt: string
  updatedAt: string
}

export interface CreateEmailTemplateDto {
  name: string
  key: string
  subject: string
  body?: string
  variables?: string[]
  status?: EmailTemplateStatus
}

export type UpdateEmailTemplateDto = Partial<CreateEmailTemplateDto>

export const EMAIL_TEMPLATE_STATUS: StatusMap<EmailTemplateStatus> = {
  ACTIVE: { label: 'Active', tone: 'success' },
  DRAFT: { label: 'Draft', tone: 'warning', description: 'Not yet used to send mail.' },
  ARCHIVED: { label: 'Archived', tone: 'neutral' },
}

export const EMAIL_TEMPLATE_STATUS_OPTIONS = (
  Object.keys(EMAIL_TEMPLATE_STATUS) as EmailTemplateStatus[]
).map((value) => ({
  label: EMAIL_TEMPLATE_STATUS[value].label,
  value,
}))
