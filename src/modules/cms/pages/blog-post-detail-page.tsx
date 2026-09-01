import { FileText, Info, Pencil, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { DescriptionList, DetailPage, StatusBadge } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useConfirm } from '@/hooks/use-confirm'
import { usePermission } from '@/hooks/use-permission'
import { PATHS, route } from '@/router/paths'
import { PERMISSIONS } from '@/types/rbac.types'
import { formatDate } from '@/utils/format'
import { notify } from '@/utils/toast'
import { blogPosts } from '../services/blog-post.queries'
import { BLOG_STATUS } from '../types'

export function BlogPostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()

  const { data: post, isLoading, isError } = blogPosts.useDetail(postId)
  const remove = blogPosts.useRemove()
  const canUpdate = usePermission(PERMISSIONS.blogPostsUpdate)
  const canDelete = usePermission(PERMISSIONS.blogPostsDelete)

  const listPath = route(PATHS.cms, 'blog')

  if (isError || (!isLoading && !post)) {
    return (
      <PageContainer>
        <EmptyState
          title="Post not found"
          description="It may have been deleted, or the link is wrong."
          action={
            <Button asChild variant="outline" size="sm">
              <Link to={listPath}>Back to blog</Link>
            </Button>
          }
        />
      </PageContainer>
    )
  }

  const title = post?.title ?? 'Loading…'

  const handleDelete = async (): Promise<void> => {
    if (!post) return

    const ok = await confirm({
      title: `Delete ${post.title}?`,
      description: 'This cannot be undone.',
      confirmLabel: 'Delete',
      tone: 'destructive',
    })
    if (!ok) return

    await remove.mutateAsync(post.id)
    notify.success(`${post.title} deleted`)
    navigate(listPath)
  }

  return (
    <DetailPage
      title={title}
      subtitle={post?.slug}
      isLoading={isLoading}
      backTo={listPath}
      backLabel="Back to blog"
      status={post && <StatusBadge status={post.status} map={BLOG_STATUS} />}
      meta={
        post
          ? [
              { label: 'Category', value: post.category || '—' },
              { label: 'Author', value: post.author || '—' },
              { label: 'Views', value: post.views },
              {
                label: 'Published',
                value: post.publishedAt ? formatDate(post.publishedAt) : 'Not published',
              },
            ]
          : undefined
      }
      actions={
        post && (
          <>
            {canUpdate && (
              <Button asChild variant="outline" size="sm">
                <Link to={route(PATHS.cms, 'blog', post.id, 'edit')}>
                  <Pencil className="size-4" />
                  Edit
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                size="sm"
                disabled={remove.isPending}
                onClick={() => void handleDelete()}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            )}
          </>
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
                    { label: 'Title', value: post?.title },
                    { label: 'Slug', value: post && <code className="font-mono">{post.slug}</code> },
                    { label: 'Category', value: post?.category || '—' },
                    { label: 'Author', value: post?.author || '—' },
                    {
                      label: 'Status',
                      value: post && <StatusBadge status={post.status} map={BLOG_STATUS} />,
                    },
                    { label: 'Views', value: post?.views },
                    { label: 'Created', value: post?.createdAt ? formatDate(post.createdAt) : '—' },
                    { label: 'Updated', value: post?.updatedAt ? formatDate(post.updatedAt) : '—' },
                    { label: 'Post ID', value: post?.id },
                  ]}
                />
              </CardContent>
            </Card>
          ),
        },
        {
          id: 'content',
          label: 'Content',
          icon: FileText,
          content: (
            <Card>
              <CardContent className="flex flex-col gap-4">
                {post?.excerpt && (
                  <p className="text-body text-muted-foreground italic">{post.excerpt}</p>
                )}
                {post?.content ? (
                  <p className="whitespace-pre-wrap text-body">{post.content}</p>
                ) : (
                  <EmptyState
                    icon={FileText}
                    title="No content"
                    description="Add a body from the edit screen."
                    className="border-none"
                  />
                )}
              </CardContent>
            </Card>
          ),
        },
      ]}
    />
  )
}

export default BlogPostDetailPage
