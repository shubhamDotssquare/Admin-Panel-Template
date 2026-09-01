import { createResourceQueries } from '@/lib/create-resource-queries'
import type { CreateEmailTemplateDto, EmailTemplate, UpdateEmailTemplateDto } from '../types'

export const emailTemplates = createResourceQueries<
  EmailTemplate,
  CreateEmailTemplateDto,
  UpdateEmailTemplateDto
>('email-templates', '/email-templates')
