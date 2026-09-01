import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const EmailTemplateListPage = lazy(() => import('./pages/email-template-list-page'))
const EmailTemplateDetailPage = lazy(() => import('./pages/email-template-detail-page'))
const EmailTemplateFormPage = lazy(() => import('./pages/email-template-form-page'))

/**
 * Email templates: list, detail, create, edit.
 *
 * `new` is declared before `:templateId` for readability; React Router ranks
 * static segments above dynamic ones regardless, so `/email-templates/new`
 * can never be read as a template whose id is "new".
 */
export const emailTemplatesModule: ModuleDefinition = {
  id: 'email-templates',
  title: 'Email Templates',
  basePath: PATHS.emailTemplates,
  enabled: true,
  routes: [
    { path: PATHS.emailTemplates, Component: EmailTemplateListPage },
    { path: route(PATHS.emailTemplates, 'new'), Component: EmailTemplateFormPage },
    { path: route(PATHS.emailTemplates, ':templateId'), Component: EmailTemplateDetailPage },
    { path: route(PATHS.emailTemplates, ':templateId', 'edit'), Component: EmailTemplateFormPage },
  ],
}

export default emailTemplatesModule
