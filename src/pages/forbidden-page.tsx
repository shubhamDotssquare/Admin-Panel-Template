import { ShieldOff } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { Button } from '@/components/ui/button'
import { appConfig } from '@/config/app.config'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function ForbiddenPage() {
  useDocumentTitle('Access denied')

  return (
    <PageContainer className="flex-1 justify-center">
      <EmptyState
        icon={ShieldOff}
        title="Access denied"
        description="You do not have permission to view this page. Contact an administrator if you believe this is a mistake."
        action={
          <Button asChild variant="outline" size="sm">
            <Link to={appConfig.homePath}>Back to dashboard</Link>
          </Button>
        }
        className="border-none"
      />
    </PageContainer>
  )
}

export default ForbiddenPage
