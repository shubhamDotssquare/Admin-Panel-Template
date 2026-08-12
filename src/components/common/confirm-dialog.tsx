import { Modal } from '@/components/common/modal'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export interface ConfirmOptions {
  title: string
  description?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** `destructive` colours the confirm button for irreversible actions. */
  tone?: 'default' | 'destructive'
}

export interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  /** Shows a spinner and blocks dismissal while the action runs. */
  isConfirming?: boolean
}

/**
 * "Are you sure?" as one component.
 *
 * Usable directly with local state, but most call sites want the promise-based
 * `useConfirm()` instead — see [`use-confirm.ts`](../../hooks/use-confirm.ts).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isConfirming = false,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      // Dismissing mid-action would leave the user unsure whether it ran.
      dismissible={!isConfirming}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isConfirming}>
            {cancelLabel}
          </Button>

          <Button
            variant={tone === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isConfirming}
            autoFocus
          >
            {isConfirming && <Spinner size="sm" />}
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
