import { Construction } from 'lucide-react'
import { useLocation } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { findNavItemByPath, findNavRootByPath } from '@/config/navigation.config'
import { slugify } from '@/utils/string'
import { NotFoundPage } from './not-found-page'

/**
 * Resolves any shell path that no module has claimed yet.
 *
 * If the path is a declared navigation target, it renders as "not built yet"
 * and names the folder that will own it. Anything else is a genuine 404.
 */
export function ModulePlaceholderPage() {
  const { pathname } = useLocation()
  const navItem = findNavItemByPath(pathname)

  if (!navItem) return <NotFoundPage />

  // The folder is named after the top-level entry, so `/cms/media` points at
  // `src/modules/cms/` rather than a folder of its own.
  const moduleRoot = findNavRootByPath(pathname) ?? navItem
  const moduleFolder = `src/modules/${slugify(moduleRoot.label)}/`

  return (
    <PageContainer>
      <PageHeader
        title={navItem.label}
        description="This module has a reserved route and navigation entry, but no implementation yet."
        actions={<Badge variant="secondary">Not implemented</Badge>}
      />

      <EmptyState
        icon={Construction}
        title={`${navItem.label} is not built yet`}
        description={`Create ${moduleFolder}, export a ModuleDefinition from its index, and register it in src/modules/registry.ts. This route then resolves to the real screen with no other changes.`}
      />
    </PageContainer>
  )
}

export default ModulePlaceholderPage
