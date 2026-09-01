import { Link } from 'react-router'

import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'

export type AnalyticsTab = 'revenue' | 'location' | 'device'

const TABS: Array<{ id: AnalyticsTab; label: string; to: string }> = [
  { id: 'revenue', label: 'Revenue', to: PATHS.analytics },
  { id: 'location', label: 'Location', to: route(PATHS.analytics, 'location') },
  { id: 'device', label: 'Device', to: route(PATHS.analytics, 'device') },
]

/** Nav-style toggle between the three analytics list screens. */
export function AnalyticsTabs({ active }: { active: AnalyticsTab }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <Button key={tab.id} asChild variant={active === tab.id ? 'default' : 'outline'} size="sm">
          <Link to={tab.to}>{tab.label}</Link>
        </Button>
      ))}
    </div>
  )
}
