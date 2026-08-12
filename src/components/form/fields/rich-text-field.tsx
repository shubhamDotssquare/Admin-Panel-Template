import { Fragment, useRef, useState } from 'react'
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pencil,
} from 'lucide-react'
import type { FieldValues } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/utils/cn'
import { Field, type FieldProps } from '../field'

type BaseProps<TValues extends FieldValues> = Omit<FieldProps<TValues>, 'children'>

/**
 * Only these schemes may appear in a rendered link. Blocks `javascript:` and
 * `data:` URLs, which is the one way markdown can still inject script.
 */
const SAFE_LINK = /^(https?:\/\/|mailto:|\/)/i

/** Inline markdown → React nodes. Never HTML, so nothing can be injected. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  const parts = text.split(pattern).filter(Boolean)

  return parts.map((part, index) => {
    const key = `${keyPrefix}-${index}`

    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={key}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={key}>{part.slice(1, -1)}</em>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={key} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      )
    }

    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (link) {
      const [, label, href] = link
      if (!SAFE_LINK.test(href)) return <Fragment key={key}>{label}</Fragment>

      return (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-primary underline underline-offset-4"
        >
          {label}
        </a>
      )
    }

    return <Fragment key={key}>{part}</Fragment>
  })
}

/** Block-level markdown → React nodes. Supports headings, lists, paragraphs. */
function renderMarkdown(source: string): React.ReactNode[] {
  const lines = source.split('\n')
  const blocks: React.ReactNode[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushList = (): void => {
    if (!list) return
    const ListTag = list.ordered ? 'ol' : 'ul'
    blocks.push(
      <ListTag
        key={`list-${blocks.length}`}
        className={cn('ml-5 flex flex-col gap-1', list.ordered ? 'list-decimal' : 'list-disc')}
      >
        {list.items.map((item, index) => (
          <li key={index}>{renderInline(item, `li-${blocks.length}-${index}`)}</li>
        ))}
      </ListTag>,
    )
    list = null
  }

  lines.forEach((line, index) => {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line)
    const numbered = /^\s*\d+\.\s+(.*)$/.exec(line)
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)

    if (bullet) {
      // Switching list style starts a new list rather than mixing markers.
      if (list?.ordered) flushList()
      list ??= { ordered: false, items: [] }
      list.items.push(bullet[1])
      return
    }
    if (numbered) {
      if (list && !list.ordered) flushList()
      list ??= { ordered: true, items: [] }
      list.items.push(numbered[1])
      return
    }

    flushList()

    if (heading) {
      const level = heading[1].length
      const Tag = (['h2', 'h3', 'h4'] as const)[level - 1]
      blocks.push(
        <Tag key={`h-${index}`} className={`text-heading-${level + 1}`}>
          {renderInline(heading[2], `h-${index}`)}
        </Tag>,
      )
      return
    }

    if (line.trim() === '') return
    blocks.push(<p key={`p-${index}`}>{renderInline(line, `p-${index}`)}</p>)
  })

  flushList()
  return blocks
}

export interface RichTextFieldProps<TValues extends FieldValues> extends BaseProps<TValues> {
  rows?: number
  disabled?: boolean
  placeholder?: string
}

/**
 * Formatted long-form text, stored as markdown.
 *
 * Markdown rather than a WYSIWYG editor, deliberately. A contentEditable
 * surface means storing HTML, which has to be sanitised everywhere it is later
 * rendered — and the browser API that drives the classic toolbar
 * (`document.execCommand`) is deprecated. Markdown is plain text: safe to store,
 * safe to diff, safe to render, and portable if the panel is not the only thing
 * reading it.
 *
 * The preview renders to React elements, never `dangerouslySetInnerHTML`, so
 * markup in the source cannot execute. Swap in TipTap or Lexical behind this
 * same field API if a project genuinely needs WYSIWYG.
 */
export function RichTextField<TValues extends FieldValues>({
  rows = 10,
  disabled,
  placeholder = 'Write something…',
  ...fieldProps
}: RichTextFieldProps<TValues>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [isPreview, setPreview] = useState(false)

  return (
    <Field {...fieldProps}>
      {(field, ids) => {
        const text = (field.value as string | undefined) ?? ''

        /** Wrap the selection, or insert the marker and place the caret inside. */
        const surround = (before: string, after = before): void => {
          const el = textareaRef.current
          if (!el) return

          const { selectionStart: start, selectionEnd: end } = el
          const selected = text.slice(start, end)
          const next = `${text.slice(0, start)}${before}${selected}${after}${text.slice(end)}`

          field.onChange(next)

          // Restore focus after React re-renders, or the toolbar steals it.
          requestAnimationFrame(() => {
            el.focus()
            el.setSelectionRange(start + before.length, start + before.length + selected.length)
          })
        }

        /** Prefix each selected line — for headings and lists. */
        const prefixLines = (marker: string): void => {
          const el = textareaRef.current
          if (!el) return

          const { selectionStart: start, selectionEnd: end } = el
          const lineStart = text.lastIndexOf('\n', start - 1) + 1
          const block = text.slice(lineStart, end)
          const prefixed = block
            .split('\n')
            .map((line, index) =>
              marker === '1. ' ? `${index + 1}. ${line}` : `${marker}${line}`,
            )
            .join('\n')

          field.onChange(`${text.slice(0, lineStart)}${prefixed}${text.slice(end)}`)
          requestAnimationFrame(() => el.focus())
        }

        const tools = [
          { id: 'bold', icon: Bold, label: 'Bold', run: () => surround('**') },
          { id: 'italic', icon: Italic, label: 'Italic', run: () => surround('*') },
          { id: 'code', icon: Code, label: 'Code', run: () => surround('`') },
          { id: 'heading', icon: Heading2, label: 'Heading', run: () => prefixLines('## ') },
          { id: 'bullet', icon: List, label: 'Bullet list', run: () => prefixLines('- ') },
          {
            id: 'ordered',
            icon: ListOrdered,
            label: 'Numbered list',
            run: () => prefixLines('1. '),
          },
          { id: 'link', icon: Link2, label: 'Link', run: () => surround('[', '](https://)') },
        ]

        return (
          <div
            className={cn(
              'overflow-hidden rounded-md border border-input',
              ids['aria-invalid'] && 'border-destructive',
            )}
          >
            <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1">
              {tools.map((tool) => (
                <Button
                  key={tool.id}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled || isPreview}
                  onClick={tool.run}
                  aria-label={tool.label}
                  title={tool.label}
                >
                  <tool.icon className="size-4" />
                </Button>
              ))}

              <Separator orientation="vertical" className="mx-1 !h-5" />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreview((previous) => !previous)}
                aria-pressed={isPreview}
              >
                {isPreview ? <Pencil className="size-4" /> : <Eye className="size-4" />}
                {isPreview ? 'Edit' : 'Preview'}
              </Button>
            </div>

            {isPreview ? (
              <div className="flex min-h-40 flex-col gap-3 p-3 text-body">
                {text.trim() ? (
                  renderMarkdown(text)
                ) : (
                  <p className="text-muted-foreground">Nothing to preview.</p>
                )}
              </div>
            ) : (
              <Textarea
                {...ids}
                name={field.name}
                ref={(node) => {
                  field.ref(node)
                  textareaRef.current = node
                }}
                value={text}
                rows={rows}
                placeholder={placeholder}
                disabled={disabled ?? field.disabled}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                className="rounded-none border-0 shadow-none focus-visible:ring-0"
              />
            )}
          </div>
        )
      }}
    </Field>
  )
}
