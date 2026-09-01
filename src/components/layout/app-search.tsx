import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CornerDownLeft, Search } from 'lucide-react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useDisclosure } from '@/hooks/use-disclosure'
import { useNavigation } from '@/hooks/use-navigation'
import type { IconComponent } from '@/types/common.types'
import type { NavGroup, NavItem } from '@/types/navigation.types'
import { cn } from '@/utils/cn'

/** One selectable result. Modules can contribute these via `extraItems`. */
export interface SearchItem {
  id: string
  label: string
  /** Route, or URL when `external`. */
  path: string
  icon?: IconComponent
  /** Breadcrumb-style trail shown after the label, e.g. "People › User Manager". */
  context?: string
  external?: boolean
  /** Extra terms to match on that are not part of the visible label. */
  keywords?: string[]
}

interface AppSearchProps {
  /** Defaults to the app-wide navigation config. */
  groups?: NavGroup[]
  /** Results contributed on top of the navigation index. */
  extraItems?: SearchItem[]
  placeholder?: string
  /** Results rendered at once. */
  limit?: number
}

/**
 * Flatten the navigation into searchable rows, carrying each entry's group and
 * parent labels as its context so "Roles" reads as "People › Admin Manager".
 */
function buildIndex(groups: NavGroup[]): SearchItem[] {
  const walk = (items: NavItem[], trail: string[]): SearchItem[] =>
    items.flatMap((item) => {
      if (item.hidden) return []

      const self: SearchItem[] = item.path
        ? [
            {
              id: item.id,
              label: item.label,
              path: item.path,
              icon: item.icon,
              context: trail.join(' › ') || undefined,
              external: item.external,
            },
          ]
        : []

      const children = item.children ? walk(item.children, [...trail, item.label]) : []
      return [...self, ...children]
    })

  return groups.flatMap((group) => walk(group.items, group.label ? [group.label] : []))
}

/**
 * Rank matches so the most literal ones come first: a label that starts with
 * the query beats one that merely contains it, which beats a context-only hit.
 */
function scoreItem(item: SearchItem, query: string): number {
  const label = item.label.toLowerCase()

  if (label === query) return 0
  if (label.startsWith(query)) return 1
  if (label.includes(query)) return 2
  if (item.context?.toLowerCase().includes(query)) return 3
  if (item.keywords?.some((keyword) => keyword.toLowerCase().includes(query))) return 4

  return Number.POSITIVE_INFINITY
}

function isMacPlatform(): boolean {
  if (typeof navigator === 'undefined') return false
  return /mac|iphone|ipad|ipod/i.test(navigator.userAgent)
}

/**
 * Header search with a keyboard-driven palette.
 *
 * Out of the box it searches the navigation config, so every route in the panel
 * is reachable by name with no per-module wiring. Modules that want to surface
 * their own records pass them through `extraItems`.
 */
export function AppSearch({
  groups,
  extraItems = [],
  placeholder = 'Search pages…',
  limit = 8,
}: AppSearchProps) {
  const navigate = useNavigate()
  const { isOpen, setOpen, open, close } = useDisclosure()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const shortcutLabel = useMemo(() => (isMacPlatform() ? '⌘K' : 'Ctrl K'), [])

  // Filtered like the sidebar: search must not surface a section the admin is
  // not allowed to open.
  const visibleGroups = useNavigation(groups)
  const index = useMemo(
    () => [...buildIndex(visibleGroups), ...extraItems],
    [visibleGroups, extraItems],
  )

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    // An empty query is a launcher, not a filter — show the first few entries.
    if (!trimmed) return index.slice(0, limit)

    return index
      .map((item) => ({ item, score: scoreItem(item, trimmed) }))
      .filter(({ score }) => Number.isFinite(score))
      .sort((a, b) => a.score - b.score || a.item.label.localeCompare(b.item.label))
      .slice(0, limit)
      .map(({ item }) => item)
  }, [index, query, limit])

  // ⌘K / Ctrl+K from anywhere in the shell.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return
      event.preventDefault()
      setOpen(true)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setOpen])

  // A fresh query invalidates the highlighted row.
  useEffect(() => setActiveIndex(0), [query])

  // Reopening should not inherit the previous search.
  useEffect(() => {
    if (!isOpen) setQuery('')
  }, [isOpen])

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  const select = useCallback(
    (item: SearchItem) => {
      close()

      if (item.external) {
        window.open(item.path, '_blank', 'noreferrer,noopener')
        return
      }

      navigate(item.path)
    },
    [close, navigate],
  )

  const handleKeyDown = (event: React.KeyboardEvent): void => {
    if (results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((previous) => (previous + 1) % results.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((previous) => (previous - 1 + results.length) % results.length)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      const item = results[activeIndex]
      if (item) select(item)
    }
  }

  return (
    <>
      {/* Wide trigger reads as a field; below `md` it collapses to an icon. */}
      <Button
        variant="outline"
        onClick={open}
        aria-label="Search"
        className={cn(
          'hidden h-9 w-56 justify-start gap-2 px-2.5 font-normal',
          'text-muted-foreground md:inline-flex',
        )}
      >
        <Search className="size-4 shrink-0" />
        <span className="truncate">Search…</span>
        <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-caption">
          {shortcutLabel}
        </kbd>
      </Button>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={open}
            aria-label="Search"
            className="md:hidden"
          >
            <Search className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Search</TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="top-[12%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0"
        >
          <DialogTitle className="sr-only">Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search pages by name, then press Enter to open one.
          </DialogDescription>

          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              aria-label="Search pages"
              autoComplete="off"
              className="h-11 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            />
          </div>

          {results.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              No results for “{query.trim()}”.
            </p>
          ) : (
            <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
              {results.map((item, itemIndex) => {
                const Icon = item.icon
                const isActive = itemIndex === activeIndex

                return (
                  <button
                    key={item.id}
                    type="button"
                    data-active={isActive}
                    onClick={() => select(item)}
                    onMouseEnter={() => setActiveIndex(itemIndex)}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left',
                      'text-sm outline-none',
                      isActive && 'bg-accent text-accent-foreground',
                    )}
                  >
                    {Icon ? (
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden="true" />
                    )}

                    <span className="truncate font-medium">{item.label}</span>

                    {item.context && (
                      <span className="truncate text-caption text-muted-foreground">
                        {item.context}
                      </span>
                    )}

                    {isActive && (
                      <CornerDownLeft
                        className="ml-auto size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
