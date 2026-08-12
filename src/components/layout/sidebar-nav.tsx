import { useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { NavLink, useLocation } from 'react-router'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { NavGroup, NavItem } from '@/types/navigation.types'
import { cn } from '@/utils/cn'

interface SidebarNavProps {
  groups: NavGroup[]
  /** Icon-only rendering; labels move into tooltips. */
  collapsed?: boolean
  /** Fired after any navigation — used to close the mobile drawer. */
  onNavigate?: () => void
}

const ROW_CLASSES = cn(
  // `relative` anchors the collapsed-rail badge dot.
  'group/nav relative flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium',
  'text-sidebar-foreground/75 transition-colors outline-none',
  'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
  'focus-visible:ring-[3px] focus-visible:ring-sidebar-ring/50',
)

const ACTIVE_CLASSES = 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold'

function isPathActive(pathname: string, path: string | undefined): boolean {
  if (!path) return false
  return pathname === path || pathname.startsWith(`${path}/`)
}

function containsActivePath(item: NavItem, pathname: string): boolean {
  if (isPathActive(pathname, item.path)) return true
  return Boolean(item.children?.some((child) => containsActivePath(child, pathname)))
}

/** True when this entry, or anything nested under it, carries a badge. */
function hasBadge(item: NavItem): boolean {
  if (item.badge) return true
  return Boolean(item.children?.some(hasBadge))
}

/** The badge pill shown on the right of an expanded row. */
function NavBadge({ children }: { children: string }) {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-sidebar-primary/10 px-1.5 py-0.5 text-caption text-sidebar-primary">
      {children}
    </span>
  )
}

/**
 * Collapsed rows have no room for a pill, so a badge anywhere in the subtree
 * becomes a dot on the icon — otherwise the signal vanishes on the icon rail.
 */
function NavBadgeDot() {
  return (
    <span
      aria-hidden="true"
      className="absolute top-1 right-1 size-1.5 rounded-full bg-sidebar-primary"
    />
  )
}

/** A leaf entry: internal link, or external anchor when `external` is set. */
function NavLeaf({
  item,
  collapsed,
  depth,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  depth: number
  onNavigate?: () => void
}) {
  const label = <span className={cn('truncate', collapsed && 'sr-only')}>{item.label}</span>

  let badge: React.ReactNode = null
  if (item.badge) badge = collapsed ? <NavBadgeDot /> : <NavBadge>{item.badge}</NavBadge>

  const icon = item.icon ? (
    <item.icon className="size-4 shrink-0" />
  ) : (
    // Keeps child rows aligned with their parent's icon column.
    <span className="size-4 shrink-0" aria-hidden="true" />
  )

  const indent =
    !collapsed && depth > 0 ? { paddingLeft: `${0.625 + depth * 1}rem` } : undefined

  const row =
    item.external && item.path ? (
      <a
        href={item.path}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(ROW_CLASSES, collapsed && 'justify-center px-0')}
        style={indent}
        onClick={onNavigate}
      >
        {icon}
        {label}
        {badge}
      </a>
    ) : (
      <NavLink
        to={item.path ?? '#'}
        end={item.path === '/'}
        className={({ isActive }) =>
          cn(ROW_CLASSES, isActive && ACTIVE_CLASSES, collapsed && 'justify-center px-0')
        }
        style={indent}
        onClick={onNavigate}
      >
        {icon}
        {label}
        {badge}
      </NavLink>
    )

  if (!collapsed) return row

  return (
    <Tooltip>
      <TooltipTrigger asChild>{row}</TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  )
}

/** A parent entry that expands to reveal its children. */
function NavBranch({
  item,
  collapsed,
  depth,
  onNavigate,
}: {
  item: NavItem
  collapsed: boolean
  depth: number
  onNavigate?: () => void
}) {
  const { pathname } = useLocation()
  const hasActiveChild = containsActivePath(item, pathname)
  const [isOpen, setOpen] = useState(hasActiveChild)

  // Reveal the branch when navigation lands inside it.
  useEffect(() => {
    if (hasActiveChild) setOpen(true)
  }, [hasActiveChild])

  // Collapsed rails have no room for children; show the branch as a tooltip leaf.
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <NavLink
            to={item.children?.find((child) => child.path)?.path ?? item.path ?? '#'}
            className={cn(ROW_CLASSES, 'justify-center px-0', hasActiveChild && ACTIVE_CLASSES)}
            onClick={onNavigate}
          >
            {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
            <span className="sr-only">{item.label}</span>
            {hasBadge(item) && <NavBadgeDot />}
          </NavLink>
        </TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(ROW_CLASSES, hasActiveChild && 'text-sidebar-accent-foreground')}
      >
        {item.icon ? <item.icon className="size-4 shrink-0" /> : null}
        <span className="truncate">{item.label}</span>
        {item.badge && <NavBadge>{item.badge}</NavBadge>}
        <ChevronRight
          className={cn(
            'size-4 shrink-0 transition-transform duration-200',
            // The badge already claimed `ml-auto`; without one the chevron does.
            item.badge ? 'ml-1.5' : 'ml-auto',
            isOpen && 'rotate-90',
          )}
          aria-hidden="true"
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <ul className="mt-0.5 space-y-0.5">
          {item.children
            ?.filter((child) => !child.hidden)
            .map((child) => (
              <li key={child.id}>
                <NavNode
                  item={child}
                  collapsed={collapsed}
                  depth={depth + 1}
                  onNavigate={onNavigate}
                />
              </li>
            ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function NavNode(props: {
  item: NavItem
  collapsed: boolean
  depth: number
  onNavigate?: () => void
}) {
  return props.item.children?.length ? <NavBranch {...props} /> : <NavLeaf {...props} />
}

/**
 * Renders the sidebar from `NavGroup[]` data.
 *
 * Purely presentational: it knows nothing about which modules exist, so adding
 * a module means adding a nav entry — never editing this file.
 */
export function SidebarNav({ groups, collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-4 px-2 py-3">
      {groups.map((group) => {
        const items = group.items.filter((item) => !item.hidden)
        if (items.length === 0) return null

        return (
          <div key={group.id}>
            {group.label && !collapsed && (
              <p className="px-2.5 pb-1.5 text-caption tracking-wide text-sidebar-foreground/50 uppercase">
                {group.label}
              </p>
            )}

            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.id}>
                  <NavNode
                    item={item}
                    collapsed={collapsed}
                    depth={0}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
