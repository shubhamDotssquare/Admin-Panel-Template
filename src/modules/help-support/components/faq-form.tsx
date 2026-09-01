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
import { FAQ_STATUS_OPTIONS, type CreateFaqDto, type Faq } from '../types'

const faqSchema = z.object({
  question: requiredString('Enter a question.').max(300, 'Must be 300 characters or fewer.'),
  answer: requiredString('Enter an answer.').max(4000, 'Must be 4000 characters or fewer.'),
  category: z.string().trim().max(80, 'Must be 80 characters or fewer.'),
  status: z.string().min(1, 'Choose a status.'),
  // Held as text while editing; parsed once, on submit.
  order: z.string().trim().regex(/^\d*$/, 'Enter a whole number.'),
})

export type FaqFormValues = z.infer<typeof faqSchema>

interface FaqFormProps {
  /** Omit to create. */
  faq?: Faq
  onSubmit: (values: CreateFaqDto) => Promise<unknown>
  onCancel: () => void
}

export function FaqForm({ faq, onSubmit, onCancel }: FaqFormProps) {
  const form = useAppForm<FaqFormValues>({
    schema: faqSchema,
    defaultValues: {
      question: faq?.question ?? '',
      answer: faq?.answer ?? '',
      // The API returns `null` for unset optionals; inputs need strings.
      category: faq?.category ?? '',
      status: faq?.status ?? 'DRAFT',
      order: faq ? String(faq.order) : '0',
    },
  })

  return (
    <Form
      form={form}
      mapError={resolveAuthError}
      onSubmit={(values) =>
        onSubmit({
          question: values.question,
          answer: values.answer,
          category: values.category || undefined,
          status: values.status as CreateFaqDto['status'],
          order: values.order.trim() ? Number(values.order) : undefined,
        })
      }
    >
      <FormSection title="Question & answer">
        <TextareaField<FaqFormValues>
          name="question"
          label="Question"
          rows={2}
          placeholder="How do I reset my password?"
        />

        <TextareaField<FaqFormValues>
          name="answer"
          label="Answer"
          rows={6}
          placeholder="Go to Settings → Security → Reset password…"
        />
      </FormSection>

      <FormSection title="Organisation">
        <FieldGroup>
          <TextField<FaqFormValues> name="category" label="Category" placeholder="Account" />
          <SelectField<FaqFormValues>
            name="status"
            label="Status"
            required
            options={FAQ_STATUS_OPTIONS}
          />
        </FieldGroup>

        <TextField<FaqFormValues>
          name="order"
          label="Order"
          type="number"
          hint="Lower numbers appear first."
        />
      </FormSection>

      <FormActions
        submitLabel={faq ? 'Save changes' : 'Create FAQ'}
        onCancel={onCancel}
        requireDirty={Boolean(faq)}
      />
    </Form>
  )
}
