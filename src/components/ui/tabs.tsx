import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Tabs as TabsPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

/**
 * `pill` reads as a segmented control and suits filters; `line` is the
 * underlined form that suits page-level sections. The variant is set once on
 * `TabsList` and shared with its triggers through context, so the two halves of
 * the pairing can never drift apart.
 */
type TabsVariant = 'pill' | 'line'

const TabsVariantContext = React.createContext<TabsVariant>('pill')

const tabsListVariants = cva('inline-flex items-center', {
  variants: {
    variant: {
      pill: 'h-9 w-fit justify-center rounded-lg bg-muted p-1 text-muted-foreground',
      line: 'w-full justify-start gap-4 border-b border-border',
    },
  },
  defaultVariants: { variant: 'pill' },
})

const tabsTriggerVariants = cva(
  cn(
    "inline-flex flex-1 items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ),
  {
    variants: {
      variant: {
        pill: cn(
          'h-full rounded-md border border-transparent px-2.5 py-1',
          'data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
          'dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30',
        ),
        line: cn(
          // The active indicator is a negative-offset bottom border so it sits
          // on top of the list's own border rather than beside it.
          '-mb-px h-9 flex-none border-b-2 border-transparent px-0.5 pb-px',
          'hover:text-foreground',
          'data-[state=active]:border-primary data-[state=active]:text-foreground',
        ),
      },
    },
    defaultVariants: { variant: 'pill' },
  },
)

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-4', className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = 'pill',
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List> & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsVariantContext.Provider value={variant ?? 'pill'}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(tabsListVariants({ variant }), className)}
        {...props}
      />
    </TabsVariantContext.Provider>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  const variant = React.useContext(TabsVariantContext)

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants, tabsTriggerVariants }
