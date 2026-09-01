import { Link, useNavigate, useParams } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { FormPage } from '@/components/patterns'
import { Button } from '@/components/ui/button'
import { PATHS, route } from '@/router/paths'
import { notify } from '@/utils/toast'
import { BlogPostForm } from '../components/blog-post-form'
import { blogPosts } from '../services/blog-post.queries'

/**
 * Create and edit, in one screen.
 *
 * The route decides which: `/cms/blog/new` has no `:postId`,
 * `/cms/blog/:postId/edit` does. Both render the same `BlogPostForm`, so the
 * two paths cannot drift.
 */
export function BlogPostFormPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()

  const isEdit = Boolean(postId)
  const { data: post, isLoading, isError } = blogPosts.useDetail(postId)

  const create = blogPosts.useCreate()
  const update = blogPosts.useUpdate()

  const listPath = route(PATHS.cms, 'blog')
  const backTo = isEdit && postId ? route(PATHS.cms, 'blog', postId) : listPath

  return (
    <FormPage
      title={isEdit ? `Edit ${post?.title ?? 'post'}` : 'Add post'}
      description={
        isEdit ? 'Update this post’s content and status.' : 'Create a new blog post.'
      }
      backTo={backTo}
      backLabel={isEdit ? 'Back to post' : 'Back to blog'}
      isLoading={isEdit && isLoading}
      error={
        isError && (
          <EmptyState
            title="Post not found"
            description="It may have been deleted, or the link is wrong."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to={listPath}>Back to blog</Link>
              </Button>
            }
          />
        )
      }
    >
      <BlogPostForm
        post={post}
        onCancel={() => navigate(backTo)}
        onSubmit={async (values) => {
          if (isEdit && postId) {
            await update.mutateAsync({ id: postId, payload: values })
            notify.success('Post updated')
            navigate(route(PATHS.cms, 'blog', postId))
            return
          }

          const created = await create.mutateAsync(values)
          notify.success('Post created')
          // Straight to the new record: creating one is almost always followed
          // by wanting to look at it.
          navigate(route(PATHS.cms, 'blog', created.id))
        }}
      />
    </FormPage>
  )
}

export default BlogPostFormPage
