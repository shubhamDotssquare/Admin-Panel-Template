import { z } from 'zod'

import {
  FieldGroup,
  Form,
  FormActions,
  FormSection,
  SelectField,
  TextField,
  TextareaField,
  useAppForm,
} from '@/components/form'
import { requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import { BLOG_STATUS_OPTIONS, type BlogPost, type CreateBlogPostDto } from '../types'

const blogPostSchema = z.object({
  title: requiredString('Enter a title.').max(160, 'Must be 160 characters or fewer.'),
  slug: requiredString('Enter a slug.')
    .max(160, 'Must be 160 characters or fewer.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and hyphens only.'),
  excerpt: z.string().trim().max(320, 'Must be 320 characters or fewer.'),
  content: z.string().trim(),
  category: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
  author: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
  status: z.string().min(1, 'Choose a status.'),
})

export type BlogPostFormValues = z.infer<typeof blogPostSchema>

interface BlogPostFormProps {
  /** Omit to create. */
  post?: BlogPost
  onSubmit: (values: CreateBlogPostDto) => Promise<unknown>
  onCancel: () => void
}

export function BlogPostForm({ post, onSubmit, onCancel }: BlogPostFormProps) {
  const form = useAppForm<BlogPostFormValues>({
    schema: blogPostSchema,
    defaultValues: {
      title: post?.title ?? '',
      slug: post?.slug ?? '',
      // The API returns `null` for unset optionals; inputs need strings.
      excerpt: post?.excerpt ?? '',
      content: post?.content ?? '',
      category: post?.category ?? '',
      author: post?.author ?? '',
      status: post?.status ?? 'DRAFT',
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) =>
        onSubmit({
          title: values.title,
          slug: values.slug,
          excerpt: values.excerpt || undefined,
          content: values.content || undefined,
          category: values.category || undefined,
          author: values.author || undefined,
          status: values.status as CreateBlogPostDto['status'],
        })
      }
    >
      <FormSection title="Post">
        <FieldGroup>
          <TextField<BlogPostFormValues>
            name="title"
            label="Title"
            required
            placeholder="How we shipped this feature"
          />
          <TextField<BlogPostFormValues>
            name="slug"
            label="Slug"
            required
            placeholder="how-we-shipped-this-feature"
          />
        </FieldGroup>

        <FieldGroup>
          <TextField<BlogPostFormValues>
            name="category"
            label="Category"
            placeholder="Engineering"
          />
          <TextField<BlogPostFormValues> name="author" label="Author" placeholder="Ada Lovelace" />
        </FieldGroup>

        <SelectField<BlogPostFormValues>
          name="status"
          label="Status"
          required
          options={BLOG_STATUS_OPTIONS}
        />

        <TextareaField<BlogPostFormValues>
          name="excerpt"
          label="Excerpt"
          rows={3}
          placeholder="A short teaser shown in listings."
        />

        <TextareaField<BlogPostFormValues>
          name="content"
          label="Content"
          rows={14}
          placeholder="Post body…"
        />
      </FormSection>

      <FormActions
        submitLabel={post ? 'Save changes' : 'Create post'}
        onCancel={onCancel}
        requireDirty={Boolean(post)}
      />
    </Form>
  )
}
