import { Info, Pencil } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage, StatusBadge } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDate } from '@/utils/format'
import { enquiries } from '../services/enquiry.queries'
import { ENQUIRY_PRIORITY, ENQUIRY_STATUS } from '../types'

export function EnquiryDetailPage() {
  const { enquiryId } = useParams<{ enquiryId: string }>()

  const { data: enquiry, isLoading, isError } = enquiries.useDetail(enquiryId)
  const canUpdate = usePermission(PERMISSIONS.enquiriesUpdate)

  if (isError || (!isLoading && !enquiry)) {
    return (
      <PageContainer>
        <EmptyState
          title="Enquiry not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={PATHS.enquiryManager}>Back to enquiries</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  return (
    <DetailPage
      title={enquiry?.subject ?? 'Loading…'}
      subtitle={enquiry?.email}
      isLoading={isLoading}
      backTo={PATHS.enquiryManager}
      backLabel="Back to enquiries"
      status={enquiry && <StatusBadge status={enquiry.status} map={ENQUIRY_STATUS} />}
      meta={
        enquiry
          ? [
              { label: 'Category', value: enquiry.category },
              {
                label: 'Priority',
                value: <StatusBadge status={enquiry.priority} map={ENQUIRY_PRIORITY} />,
              },
              { label: 'Created', value: formatDate(enquiry.createdAt) },
            ]
          : undefined
      }
      actions={
        enquiry &&
        canUpdate && (
          <Button asChild variant="outline" size="sm">
            <Link to={route(PATHS.enquiryManager, enquiry.id, 'edit')}>
              <Pencil className="size-4" />
              Edit
            </Link>
          </Button>
        )
      }
      tabs={[
        {
          id: 'overview',
          label: 'Overview',
          icon: Info,
          content: (
            <Card>
              <CardContent>
                <DescriptionList
                  isLoading={isLoading}
                  items={[
                    { label: 'Name', value: enquiry?.name },
                    { label: 'Email', value: enquiry?.email },
                    { label: 'Phone', value: enquiry?.phone },
                    { label: 'Subject', value: enquiry?.subject },
                    { label: 'Category', value: enquiry?.category },
                    {
                      label: 'Priority',
                      value: enquiry && (
                        <StatusBadge status={enquiry.priority} map={ENQUIRY_PRIORITY} />
                      ),
                    },
                    {
                      label: 'Status',
                      value: enquiry && (
                        <StatusBadge status={enquiry.status} map={ENQUIRY_STATUS} />
                      ),
                    },
                    { label: 'Source', value: enquiry?.source },
                    { label: 'Notes', value: enquiry?.notes },
                    { label: 'Assigned to', value: enquiry?.assignedToId },
                    {
                      label: 'Created',
                      value: enquiry?.createdAt && formatDate(enquiry.createdAt),
                    },
                    {
                      label: 'Updated',
                      value: enquiry?.updatedAt && formatDate(enquiry.updatedAt),
                    },
                    { label: 'Enquiry ID', value: enquiry?.id },
                  ]}
                />
              </CardContent>
            </Card>
          ),
        },
      ]}
    />
  )
}

export default EnquiryDetailPage
