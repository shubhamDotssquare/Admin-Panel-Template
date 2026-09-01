import { Info } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PATHS } from '@/router/paths'
import { formatDateTime } from '@/utils/format'
import { auditLogs } from '../services/audit-log.queries'

export function AuditLogDetailPage() {
  const { logId } = useParams<{ logId: string }>()

  const { data: entry, isLoading, isError } = auditLogs.useDetail(logId)

  if (isError || (!isLoading && !entry)) {
    return (
      <PageContainer>
        <EmptyState
          title="Audit log entry not found"
          description="It may have aged out, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.auditLogs}>Back to audit logs</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <DetailPage
      title={entry?.action ?? 'Loading…'}
      subtitle={entry?.entity}
      isLoading={isLoading}
      backTo={PATHS.auditLogs}
      backLabel="Back to audit logs"
      meta={
        entry
          ? [{ label: 'Recorded', value: entry.createdAt ? formatDateTime(entry.createdAt) : '—' }]
          : undefined
      }
      tabs={[
        {
          id: 'overview',
          label: 'Overview',
          icon: Info,
          content: (
            <Card>
              <CardContent className="flex flex-col gap-4">
                <DescriptionList
                  isLoading={isLoading}
                  items={[
                    { label: 'ID', value: entry?.id },
                    { label: 'Action', value: entry?.action },
                    { label: 'Entity', value: entry?.entity },
                    { label: 'Entity ID', value: entry?.entityId },
                    { label: 'Admin ID', value: entry?.adminId },
                    { label: 'IP address', value: entry?.ip },
                    { label: 'Request ID', value: entry?.requestId },
                    { label: 'User agent', value: entry?.userAgent, full: true },
                    {
                      label: 'Created',
                      value: entry?.createdAt ? formatDateTime(entry.createdAt) : undefined,
                    },
                  ]}
                />

                {entry?.metadata && (
                  <div className="flex flex-col gap-1">
                    <span className="text-caption text-muted-foreground">Metadata</span>
                    <pre className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-caption">
                      {JSON.stringify(entry.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ),
        },
      ]}
    />
  )
}

export default AuditLogDetailPage
