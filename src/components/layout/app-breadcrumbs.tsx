import { Fragment } from 'react'
import { Link, useLocation } from 'react-router'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { appConfig } from '@/config/app.config'
import { NAVIGATION, flattenNavigation } from '@/config/navigation.config'
import type { BreadcrumbItem as Crumb, NavGroup, NavItem } from '@/types/navigation.types'
import { titleCase } from '@/utils/string'

/**
 * Derive the trail from the URL, using nav labels where one matches and a
 * title-cased segment otherwise (so `/users/42/edit` still reads sensibly).
 */
function buildCrumbs(pathname: string, groups: NavGroup[]): Crumb[] {
  const labelByPath = new Map<string, string>(
    flattenNavigation(groups)
      .filter((item): item is NavItem & { path: string } => Boolean(item.path))
      .map((item) => [item.path, item.label]),
  )

  const segments = pathname.split('/').filter(Boolean)

  return segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`
    const isLast = index === segments.length - 1

    return {
      label: labelByPath.get(path) ?? titleCase(decodeURIComponent(segment)),
      // The current page is not a link.
      path: isLast ? undefined : path,
    }
  })
}

/** Breadcrumb trail for the header; renders nothing at the shell root. */
export function AppBreadcrumbs({ groups = NAVIGATION }: { groups?: NavGroup[] }) {
  const { pathname } = useLocation()
  const crumbs = buildCrumbs(pathname, groups)

  if (!appConfig.layout.showBreadcrumbs || crumbs.length === 0) return null

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={`${crumb.label}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.path ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.path}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
