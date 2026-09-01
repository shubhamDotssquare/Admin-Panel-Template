import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const EnquiryListPage = lazy(() => import('./pages/enquiry-list-page'))
const EnquiryDetailPage = lazy(() => import('./pages/enquiry-detail-page'))
const EnquiryFormPage = lazy(() => import('./pages/enquiry-form-page'))

/**
 * Contact/support enquiries: list, detail, create and edit.
 *
 * `new` is declared before `:enquiryId` for readability; React Router ranks
 * static segments above dynamic ones regardless, so `/enquiries/new` can never
 * be read as an enquiry whose id is "new".
 */
export const enquiryManagerModule: ModuleDefinition = {
  id: 'enquiry-manager',
  title: 'Enquiry Manager',
  basePath: PATHS.enquiryManager,
  enabled: true,
  routes: [
    { path: PATHS.enquiryManager, Component: EnquiryListPage },
    { path: route(PATHS.enquiryManager, 'new'), Component: EnquiryFormPage },
    { path: route(PATHS.enquiryManager, ':enquiryId'), Component: EnquiryDetailPage },
    { path: route(PATHS.enquiryManager, ':enquiryId', 'edit'), Component: EnquiryFormPage },
  ],
}

export default enquiryManagerModule
