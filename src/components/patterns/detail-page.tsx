import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

import { PageContainer } from '@/components/common/page-container'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDocumentTitle } from '@/hooks/use-document-title'
import type { IconComponent } from '@/types/common.types'
import { initials } from '@/utils/string'
import { cn } from '@/utils/cn'

export interface DetailTab {
  id: string
  label: string
  icon?: IconComponent
  /** Small count beside the label, e.g. the number of notes. */
  badge?: React.ReactNode
  content: React.ReactNode
  hidden?: boolean
}

export interface DetailPageProps {
  title: string
  subtitle?: string
  /** Status pill beside the title. */
  status?: React.ReactNode
  /** Where "back" goes. Omit to hide the control. */
  backTo?: string
  backLabel?: string
  /** Buttons for this record — Edit, Suspend, Delete. */
  actions?: React.ReactNode
  /** Avatar or logo. Falls back to initials of `title`. */
  avatarUrl?: string
  showAvatar?: boolean
  /** Key facts rendered in the header card, under the title. */
  meta?: { label: string; value: React.ReactNode }[]
  tabs: DetailTab[]
  defaultTab?: string
  isLoading?: boolean
  /** Also sets `document.title`. Defaults to true. */
  setDocumentTitle?: boolean
  className?: string
}

/**
 * The standard shape of a record screen: identity header, then tabbed sections.
 *
 * Overview / Activity / Files / Notes / History are the recurring set across
 * Admin Manager, User Manager, CMS and Enquiries, so the *layout* is fixed here
 * while the tabs stay data: a module passes whichever sections its record has,
 * in whatever order, and renders each with the pattern components
 * (`DescriptionList`, `Timeline`, `FileList`, `NoteList`).
 *
 * ```tsx
 * <DetailPage title={user.name} status={<Badge>Active</Badge>} backTo={PATHS.userManager}
 *   tabs={[
 *     { id: 'overview', label: 'Overview', content: <DescriptionList items={facts} /> },
 *     { id: 'activity', label: 'Activity', content: <Timeline events={events} /> },
 *   ]} />
 * ```
 */
export function DetailPage({
  title,
  subtitle,
  status,
  backTo,
  backLabel = 'Back',
  actions,
  avatarUrl,
  showAvatar = false,
  meta,
  tabs,
  defaultTab,
  isLoading = false,
  setDocumentTitle = true,
  className,
}: DetailPageProps) {
  useDocumentTitle(setDocumentTitle ? title : undefined)

  const visibleTabs = tabs.filter((tab) => !tab.hidden)
  const initialTab = defaultTab ?? visibleTabs[0]?.id

  return (
    <PageContainer className={className}>
      {backTo && (
        <Button asChild variant="ghost" size="sm" className="-ml-2 self-start">
          <Link to={backTo}>
            <ArrowLeft className="size-4" />
            {backLabel}
          </Link>
        </Button>
      )}

      <Card>
        <CardContent className="flex flex-wrap items-start gap-4 py-1">
          {showAvatar && (
            <Avatar className="size-12 shrink-0">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
              <AvatarFallback>{initials(title)}</AvatarFallback>
            </Avatar>
          )}

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              {isLoading ? (
                <Skeleton className="h-8 w-56" />
              ) : (
                <h1 className="truncate text-heading-2">{title}</h1>
              )}
              {!isLoading && status}
            </div>

            {subtitle && !isLoading && (
              <p className="text-body text-muted-foreground">{subtitle}</p>
            )}

            {meta && meta.length > 0 && !isLoading && (
              <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-1">
                {meta.map((item) => (
                  <span key={item.label} className="flex items-center gap-1.5 text-caption">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </CardContent>
      </Card>

      {visibleTabs.length > 0 && (
        <Tabs defaultValue={initialTab} className="gap-section">
          {/* The `line` variant reads as page-level sections rather than a
              segmented control, which is what these tabs are. */}
          <TabsList variant="line" className="overflow-x-auto">
            {visibleTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5">
                {tab.icon && <tab.icon className="size-4" aria-hidden="true" />}
                {tab.label}
                {tab.badge !== undefined && (
                  <Badge variant="secondary" className="ml-0.5">
                    {tab.badge}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {visibleTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className={cn('flex flex-col gap-4')}>
              {tab.content}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </PageContainer>
  )
}
