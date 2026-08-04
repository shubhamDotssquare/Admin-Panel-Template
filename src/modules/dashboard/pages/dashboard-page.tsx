import { LayoutDashboard } from 'lucide-react'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { appConfig } from '@/config/app.config'

/**
 * Landing screen for the shell.
 *
 * Intentionally content-free: it demonstrates the page primitives
 * (container → header → cards) that module screens should follow, and carries
 * no metrics or data of its own.
 */
export function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description={`Welcome to ${appConfig.name}. Widgets appear here as modules are added.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {['Overview', 'Activity', 'Queue', 'Health'].map((slot) => (
          <Card key={slot}>
            <CardHeader>
              <CardTitle className="text-heading-4">{slot}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-caption text-muted-foreground">
                Reserved for a module widget.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <EmptyState
        icon={LayoutDashboard}
        title="No widgets registered yet"
        description="Each module can contribute a dashboard widget. Register one from its module definition to see it here."
      />
    </PageContainer>
  )
}

export default DashboardPage
