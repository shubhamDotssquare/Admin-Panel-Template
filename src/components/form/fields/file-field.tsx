import { useEffect, useRef, useState } from 'react'
import { ImageIcon, Upload, X } from 'lucide-react'
import type { FieldValues } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { formatBytes } from '@/utils/format'
import { cn } from '@/utils/cn'
import { Field, type FieldProps } from '../field'

type BaseProps<TValues extends FieldValues> = Omit<FieldProps<TValues>, 'children'>

export interface FileFieldProps<TValues extends FieldValues> extends BaseProps<TValues> {
  /** `accept` attribute, e.g. `'application/pdf,.docx'`. */
  accept?: string
  multiple?: boolean
  /** Rejected client-side with a message before anything is uploaded. */
  maxSizeBytes?: number
  disabled?: boolean
  /** Show image thumbnails instead of a file row. */
  variant?: 'file' | 'image'
}

function toArray(value: unknown): File[] {
  if (!value) return []
  if (value instanceof File) return [value]
  return Array.isArray(value) ? value.filter((item): item is File => item instanceof File) : []
}

/**
 * File and image upload, holding native `File` objects in form state.
 *
 * Deliberately does **not** upload: the field owns selection and preview, the
 * submit handler owns transport. That keeps it usable with direct-to-S3, a
 * multipart POST, or a two-step "create then attach" without rewriting it.
 *
 * Size and type are checked here as a courtesy — the server must check again,
 * since nothing client-side is a control.
 */
export function FileField<TValues extends FieldValues>({
  accept,
  multiple = false,
  maxSizeBytes,
  disabled,
  variant = 'file',
  ...fieldProps
}: FileFieldProps<TValues>) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  return (
    <Field {...fieldProps}>
      {(field, ids) => {
        const files = toArray(field.value)

        const accept_ = accept ?? (variant === 'image' ? 'image/*' : undefined)

        const handleFiles = (incoming: FileList | null): void => {
          setLocalError(null)
          if (!incoming?.length) return

          const picked = Array.from(incoming)
          const tooBig = maxSizeBytes
            ? picked.find((file) => file.size > maxSizeBytes)
            : undefined

          if (tooBig && maxSizeBytes) {
            setLocalError(
              `${tooBig.name} is ${formatBytes(tooBig.size)} — the limit is ${formatBytes(maxSizeBytes)}.`,
            )
            return
          }

          field.onChange(multiple ? [...files, ...picked] : picked[0])
        }

        const remove = (target: File): void => {
          const next = files.filter((file) => file !== target)
          field.onChange(multiple ? next : undefined)
          // Clearing lets the same file be picked again immediately.
          if (inputRef.current) inputRef.current.value = ''
        }

        return (
          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              id={ids.id}
              aria-describedby={ids['aria-describedby']}
              aria-invalid={ids['aria-invalid']}
              type="file"
              accept={accept_}
              multiple={multiple}
              disabled={disabled ?? field.disabled}
              onBlur={field.onBlur}
              onChange={(event) => handleFiles(event.target.files)}
              className="sr-only"
            />

            <Button
              type="button"
              variant="outline"
              disabled={disabled ?? field.disabled}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'h-auto w-full justify-start gap-2 border-dashed py-6',
                ids['aria-invalid'] && 'border-destructive',
              )}
            >
              {variant === 'image' ? (
                <ImageIcon className="size-4" />
              ) : (
                <Upload className="size-4" />
              )}
              <span className="flex flex-col items-start">
                <span className="font-medium">
                  {files.length === 0
                    ? `Choose ${variant === 'image' ? 'image' : 'file'}${multiple ? 's' : ''}`
                    : `Add ${multiple ? 'more' : 'a different file'}`}
                </span>
                {maxSizeBytes && (
                  <span className="text-caption font-normal text-muted-foreground">
                    Up to {formatBytes(maxSizeBytes)}
                  </span>
                )}
              </span>
            </Button>

            {localError && <p className="text-caption text-destructive">{localError}</p>}

            {files.length > 0 && (
              <ul
                className={cn(
                  variant === 'image'
                    ? 'grid grid-cols-3 gap-2 sm:grid-cols-4'
                    : 'flex flex-col gap-2',
                )}
              >
                {files.map((file) => (
                  <li key={`${file.name}-${file.lastModified}`}>
                    {variant === 'image' ? (
                      <ImagePreview file={file} onRemove={() => remove(file)} />
                    ) : (
                      <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                        <span className="min-w-0 flex-1 truncate text-body">{file.name}</span>
                        <span className="shrink-0 text-caption text-muted-foreground">
                          {formatBytes(file.size)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => remove(file)}
                          aria-label={`Remove ${file.name}`}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      }}
    </Field>
  )
}

/** Thumbnail backed by an object URL, revoked when the file changes or unmounts. */
function ImagePreview({ file, onRemove }: { file: File; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)

    // Object URLs are held for the document's lifetime otherwise — a real leak
    // on a form where someone swaps images a few times.
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  return (
    <div className="group relative overflow-hidden rounded-md border border-border">
      {url && <img src={url} alt={file.name} className="aspect-square w-full object-cover" />}

      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute top-1 right-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
