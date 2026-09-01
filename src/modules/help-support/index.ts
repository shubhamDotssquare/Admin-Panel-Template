import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const SupportTicketListPage = lazy(() => import('./pages/support-ticket-list-page'))
const SupportTicketDetailPage = lazy(() => import('./pages/support-ticket-detail-page'))
const SupportTicketFormPage = lazy(() => import('./pages/support-ticket-form-page'))
const FaqListPage = lazy(() => import('./pages/faq-list-page'))
const FaqDetailPage = lazy(() => import('./pages/faq-detail-page'))
const FaqFormPage = lazy(() => import('./pages/faq-form-page'))

/**
 * Two resources sharing one base path: support tickets and FAQs.
 *
 * Static segments (`new`, `faqs`, `faqs/new`) are declared before the dynamic
 * `:ticketId` segment for readability; React Router ranks static segments
 * above dynamic ones regardless, so none of them can be read as a ticket
 * whose id is "new" or "faqs".
 */
export const helpSupportModule: ModuleDefinition = {
  id: 'help-support',
  title: 'Help & Support',
  basePath: PATHS.helpSupport,
  enabled: true,
  routes: [
    { path: PATHS.helpSupport, Component: SupportTicketListPage },
    { path: route(PATHS.helpSupport, 'new'), Component: SupportTicketFormPage },
    { path: route(PATHS.helpSupport, 'faqs'), Component: FaqListPage },
    { path: route(PATHS.helpSupport, 'faqs', 'new'), Component: FaqFormPage },
    { path: route(PATHS.helpSupport, 'faqs', ':faqId'), Component: FaqDetailPage },
    { path: route(PATHS.helpSupport, 'faqs', ':faqId', 'edit'), Component: FaqFormPage },
    { path: route(PATHS.helpSupport, ':ticketId'), Component: SupportTicketDetailPage },
    { path: route(PATHS.helpSupport, ':ticketId', 'edit'), Component: SupportTicketFormPage },
  ],
}

export default helpSupportModule
