import { useFormContext, type FieldValues, type Path } from 'react-hook-form'

import type { IconComponent, SelectOption } from '@/types/common.types'
import { FieldGroup, FormSection, FormTabs } from './form-layout'
import { DateField } from './fields/date-field'
import { FileField } from './fields/file-field'
import { JsonField } from './fields/json-field'
import { RichTextField } from './fields/rich-text-field'
import { TextField, TextareaField } from './fields/text-field'
import {
  CheckboxField,
  MultiSelectField,
  RadioField,
  SelectField,
  SwitchField,
} from './fields/choice-fields'

/** Properties every field config shares. */
interface FieldConfigBase<TValues extends FieldValues> {
  name: Path<TValues>
  label?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  /** Width within a `columns` group. Defaults to one column. */
  span?: 1 | 2 | 3
  /**
   * Render only when this returns true. Receives current values, so a field can
   * depend on another — "VAT number" when "Is a business" is on.
   */
  visibleWhen?: (values: TValues) => boolean
}

export type FieldConfig<TValues extends FieldValues> = FieldConfigBase<TValues> &
  (
    | {
        type: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number' | 'search'
        placeholder?: string
        autoComplete?: string
        maxLength?: number
      }
    | { type: 'textarea'; placeholder?: string; rows?: number; maxLength?: number }
    | { type: 'select'; options: SelectOption[]; placeholder?: string; clearable?: boolean }
    | { type: 'multiselect'; options: SelectOption[]; placeholder?: string }
    | { type: 'radio'; options: SelectOption[]; horizontal?: boolean }
    | { type: 'checkbox' }
    | { type: 'switch' }
    | { type: 'date' | 'time' | 'datetime'; min?: string; max?: string }
    | {
        type: 'file' | 'image'
        accept?: string
        multiple?: boolean
        maxSizeBytes?: number
      }
    | { type: 'richtext'; rows?: number; placeholder?: string }
    | { type: 'json'; rows?: number; placeholder?: string }
    | { type: 'custom'; render: () => React.ReactNode }
  )

export interface SectionConfig<TValues extends FieldValues> {
  id: string
  title?: string
  description?: string
  /** Columns for this section's fields. */
  columns?: 1 | 2 | 3
  bare?: boolean
  fields: FieldConfig<TValues>[]
}

export interface TabConfig<TValues extends FieldValues> {
  id: string
  label: string
  icon?: IconComponent
  sections: SectionConfig<TValues>[]
}

/** One field config → the matching component. */
export function renderField<TValues extends FieldValues>(
  config: FieldConfig<TValues>,
): React.ReactNode {
  const shared = {
    name: config.name,
    label: config.label,
    hint: config.hint,
    required: config.required,
    disabled: config.disabled,
  }

  switch (config.type) {
    case 'textarea':
      return (
        <TextareaField
          {...shared}
          placeholder={config.placeholder}
          rows={config.rows}
          maxLength={config.maxLength}
        />
      )
    case 'select':
      return (
        <SelectField
          {...shared}
          options={config.options}
          placeholder={config.placeholder}
          clearable={config.clearable}
        />
      )
    case 'multiselect':
      return (
        <MultiSelectField
          {...shared}
          options={config.options}
          placeholder={config.placeholder}
        />
      )
    case 'radio':
      return <RadioField {...shared} options={config.options} horizontal={config.horizontal} />
    case 'checkbox':
      return <CheckboxField {...shared} />
    case 'switch':
      return <SwitchField {...shared} />
    case 'date':
    case 'time':
    case 'datetime':
      return <DateField {...shared} mode={config.type} min={config.min} max={config.max} />
    case 'file':
    case 'image':
      return (
        <FileField
          {...shared}
          variant={config.type === 'image' ? 'image' : 'file'}
          accept={config.accept}
          multiple={config.multiple}
          maxSizeBytes={config.maxSizeBytes}
        />
      )
    case 'richtext':
      return <RichTextField {...shared} rows={config.rows} placeholder={config.placeholder} />
    case 'json':
      return <JsonField {...shared} rows={config.rows} placeholder={config.placeholder} />
    case 'custom':
      return config.render()
    default:
      return (
        <TextField
          {...shared}
          type={config.type}
          placeholder={config.placeholder}
          autoComplete={config.autoComplete}
          maxLength={config.maxLength}
        />
      )
  }
}

function SectionFields<TValues extends FieldValues>({
  section,
}: {
  section: SectionConfig<TValues>
}) {
  // Watching all values is what makes `visibleWhen` reactive. Scoped to the
  // section so a conditional field re-renders its own group, not the whole form.
  const { watch } = useFormContext<TValues>()
  const values = watch()

  const visible = section.fields.filter((field) => field.visibleWhen?.(values) ?? true)

  return (
    <FieldGroup columns={section.columns ?? 1}>
      {visible.map((field) => (
        <div
          key={field.name}
          className={
            field.span === 3 ? 'lg:col-span-3' : field.span === 2 ? 'sm:col-span-2' : undefined
          }
        >
          {renderField(field)}
        </div>
      ))}
    </FieldGroup>
  )
}

export interface SchemaFormBodyProps<TValues extends FieldValues> {
  /** Flat form: a list of sections. */
  sections?: SectionConfig<TValues>[]
  /** Tabbed form. Takes precedence over `sections`. */
  tabs?: TabConfig<TValues>[]
  defaultTab?: string
}

/**
 * Renders a form's body from config.
 *
 * Goes **inside** a `<Form>`, which owns the schema, submit and error handling —
 * so a screen can mix config-driven sections with hand-written fields rather
 * than choosing one or the other:
 *
 * ```tsx
 * <Form form={form} onSubmit={save}>
 *   <SchemaFormBody sections={sections} />
 *   <MyUnusualField />
 *   <FormActions />
 * </Form>
 * ```
 *
 * Config covers the ordinary 90%; anything genuinely bespoke uses
 * `type: 'custom'` or is written out longhand.
 */
export function SchemaFormBody<TValues extends FieldValues>({
  sections,
  tabs,
  defaultTab,
}: SchemaFormBodyProps<TValues>) {
  if (tabs?.length) {
    return (
      <FormTabs
        defaultTab={defaultTab}
        tabs={tabs.map((tab) => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
          fields: tab.sections.flatMap((section) => section.fields.map((f) => String(f.name))),
          content: (
            <>
              {tab.sections.map((section) => (
                <FormSection
                  key={section.id}
                  title={section.title}
                  description={section.description}
                  bare={section.bare}
                >
                  <SectionFields section={section} />
                </FormSection>
              ))}
            </>
          ),
        }))}
      />
    )
  }

  return (
    <>
      {sections?.map((section) => (
        <FormSection
          key={section.id}
          title={section.title}
          description={section.description}
          bare={section.bare ?? true}
        >
          <SectionFields section={section} />
        </FormSection>
      ))}
    </>
  )
}
