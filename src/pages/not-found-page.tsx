import { FileQuestion } from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { Button } from '@/components/ui/button'
import { appConfig } from '@/config/app.config'
import { useDocumentTitle } from '@/hooks/use-document-title'

export function NotFoundPage() {
  useDocumentTitle('Page not found')

  return (
    <PageContainer className="flex-1 justify-center">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="The page you are looking for does not exist or may have been moved."
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

export default NotFoundPage
