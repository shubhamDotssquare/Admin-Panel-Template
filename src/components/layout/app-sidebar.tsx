import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { AppBrand } from '@/components/layout/app-brand'
import { SidebarNav } from '@/components/layout/sidebar-nav'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useLayout } from '@/hooks/use-layout'
import { useNavigation } from '@/hooks/use-navigation'
import type { NavGroup } from '@/types/navigation.types'
import { cn } from '@/utils/cn'

interface AppSidebarProps {
  /** Defaults to the app-wide navigation config. */
  groups?: NavGroup[]
}

/** Shared inner content, rendered in both the desktop rail and mobile sheet. */
function SidebarBody({
  groups,
  collapsed,
  onNavigate,
}: {
  groups: NavGroup[]
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <ScrollArea className="flex-1">
      <SidebarNav groups={groups} collapsed={collapsed} onNavigate={onNavigate} />
    </ScrollArea>
  )
}

/**
 * The primary sidebar.
 *
 * Desktop renders a fixed rail that collapses to icons; below `lg` the same
 * navigation is served from an off-canvas sheet.
 */
export function AppSidebar({ groups }: AppSidebarProps) {
  // Permission-filtered: entries the signed-in admin cannot reach are dropped.
  const visibleGroups = useNavigation(groups)
  const {
    isSidebarCollapsed,
    setSidebarCollapsed,
    isMobile,
    isMobileNavOpen,
    setMobileNavOpen,
  } = useLayout()

  if (isMobile) {
    return (
      <Sheet open={isMobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-sidebar bg-sidebar p-0 text-sidebar-foreground">
          <SheetHeader className="h-header justify-center border-b border-sidebar-border px-4">
            <SheetTitle asChild>
              <AppBrand />
            </SheetTitle>
          </SheetHeader>

          <SidebarBody
            groups={visibleGroups}
            collapsed={false}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside
      data-collapsed={isSidebarCollapsed || undefined}
      className={cn(
        'border-sidebar-border bg-sidebar text-sidebar-foreground',
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r',
        'transition-[width] duration-200 ease-out',
        isSidebarCollapsed ? 'w-sidebar-collapsed' : 'w-sidebar',
      )}
    >
      <div
        className={cn(
          'flex h-header shrink-0 items-center border-b border-sidebar-border',
          isSidebarCollapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        <AppBrand compact={isSidebarCollapsed} />
      </div>

      <SidebarBody groups={visibleGroups} collapsed={isSidebarCollapsed} />

      <div
        className={cn(
          'flex shrink-0 items-center border-t border-sidebar-border p-2',
          isSidebarCollapsed ? 'justify-center' : 'justify-end',
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!isSidebarCollapsed}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>
      </div>
    </aside>
  )
}
