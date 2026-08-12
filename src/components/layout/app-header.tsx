import { Menu } from 'lucide-react'

import { AppBreadcrumbs } from '@/components/layout/app-breadcrumbs'
import { AppSearch, type SearchItem } from '@/components/layout/app-search'
import {
  NotificationMenu,
  type NotificationMenuProps,
} from '@/components/layout/notification-menu'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { UserMenu, type UserMenuUser } from '@/components/layout/user-menu'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { appConfig } from '@/config/app.config'
import { useLayout } from '@/hooks/use-layout'
import { cn } from '@/utils/cn'

export interface AppHeaderProps {
  user?: UserMenuUser
  onSignOut?: () => void
  /** Extra controls injected between the trail and the utility cluster. */
  actions?: React.ReactNode
  /** Records a module wants reachable from the palette, on top of the routes. */
  searchItems?: SearchItem[]
  /** Everything the notification panel needs; omit to render an empty panel. */
  notifications?: NotificationMenuProps
}

/**
 * Sticky top bar: nav trigger, breadcrumb trail, and the utility cluster
 * (search, notifications, theme, account).
 *
 * Search and notifications can be switched off per project from
 * `appConfig.layout`.
 */
export function AppHeader({
  user,
  onSignOut,
  actions,
  searchItems,
  notifications,
}: AppHeaderProps) {
  const { toggleSidebar, isMobile } = useLayout()
  const { showSearch, showNotifications } = appConfig.layout

  return (
    <header
      className={cn(
        'border-border bg-background/85 supports-[backdrop-filter]:bg-background/70',
        'sticky top-0 z-20 flex h-header shrink-0 items-center gap-2',
        'border-b px-4 backdrop-blur-sm',
      )}
    >
      {isMobile && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </Button>
          <Separator orientation="vertical" className="mr-1 !h-5" />
        </>
      )}

      <AppBreadcrumbs />

      <div className="ml-auto flex items-center gap-1">
        {actions}

        {showSearch && <AppSearch extraItems={searchItems} />}

        {showNotifications && <NotificationMenu {...notifications} />}

        <ThemeToggle />

        <Separator orientation="vertical" className="mx-1 !h-5" />

        <UserMenu user={user} onSignOut={onSignOut} />
      </div>
    </header>
  )
}
