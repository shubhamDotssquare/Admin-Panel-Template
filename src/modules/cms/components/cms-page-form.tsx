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
import { CMS_PAGE_STATUS_OPTIONS, type CmsPage, type CreateCmsPageDto } from '../types'

const cmsPageSchema = z.object({
  title: requiredString('Enter a title.').max(160, 'Must be 160 characters or fewer.'),
  slug: requiredString('Enter a slug.')
    .max(160, 'Must be 160 characters or fewer.')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Lowercase letters, numbers and hyphens only.'),
  content: z.string().trim(),
  status: z.string().min(1, 'Choose a status.'),
  seoTitle: z.string().trim().max(160, 'Must be 160 characters or fewer.'),
  seoDescription: z.string().trim().max(320, 'Must be 320 characters or fewer.'),
})

export type CmsPageFormValues = z.infer<typeof cmsPageSchema>

interface CmsPageFormProps {
  /** Omit to create. */
  page?: CmsPage
  onSubmit: (values: CreateCmsPageDto) => Promise<unknown>
  onCancel: () => void
}

export function CmsPageForm({ page, onSubmit, onCancel }: CmsPageFormProps) {
  const form = useAppForm<CmsPageFormValues>({
    schema: cmsPageSchema,
    defaultValues: {
      title: page?.title ?? '',
      slug: page?.slug ?? '',
      // The API returns `null` for unset optionals; inputs need strings.
      content: page?.content ?? '',
      status: page?.status ?? 'DRAFT',
      seoTitle: page?.seoTitle ?? '',
      seoDescription: page?.seoDescription ?? '',
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
          content: values.content || undefined,
          status: values.status as CreateCmsPageDto['status'],
          seoTitle: values.seoTitle || undefined,
          seoDescription: values.seoDescription || undefined,
        })
      }
    >
      <FormSection title="Page">
        <FieldGroup>
          <TextField<CmsPageFormValues>
            name="title"
            label="Title"
            required
            placeholder="About us"
          />
          <TextField<CmsPageFormValues>
            name="slug"
            label="Slug"
            required
            placeholder="about-us"
          />
        </FieldGroup>

        <SelectField<CmsPageFormValues>
          name="status"
          label="Status"
          required
          options={CMS_PAGE_STATUS_OPTIONS}
        />

        <TextareaField<CmsPageFormValues>
          name="content"
          label="Content"
          rows={14}
          placeholder="Page body…"
        />
      </FormSection>

      <FormSection title="SEO" description="Shown to search engines, not on the page itself.">
        <TextField<CmsPageFormValues>
          name="seoTitle"
          label="SEO title"
          placeholder="Defaults to the page title if left blank."
        />
        <TextareaField<CmsPageFormValues>
          name="seoDescription"
          label="SEO description"
          rows={3}
          placeholder="A short summary for search results."
        />
      </FormSection>

      <FormActions
        submitLabel={page ? 'Save changes' : 'Create page'}
        onCancel={onCancel}
        requireDirty={Boolean(page)}
      />
    </Form>
  )
}
