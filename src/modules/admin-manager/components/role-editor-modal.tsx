import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { z } from 'zod'

import { Modal } from '@/components/common/modal'
import {
  FieldGroup,
  Form,
  FormActions,
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
  useAppForm,
} from '@/components/form'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermission } from '@/hooks/use-permission'
import { requiredString } from '@/lib/zod-schemas'
import { resolveAuthError } from '@/services/auth-error'
import { PERMISSIONS, type RoleSummary } from '@/types/rbac.types'
import { cn } from '@/utils/cn'
import { notify } from '@/utils/toast'
import { roles, usePermissionCatalogue } from '../services/role.queries'

const roleSchema = z.object({
  name: requiredString('Enter a name.').max(80, 'Must be 80 characters or fewer.'),
  // Mirrors the server's rule so the failure is caught before the round trip.
  key: requiredString('Enter a key.')
    .max(64, 'Must be 64 characters or fewer.')
    .regex(/^[a-z0-9_]+$/, 'Lowercase letters, digits and underscores only.'),
  description: z.string().trim().max(240, 'Keep it under 240 characters.'),
  level: z.string(),
  parentId: z.string(),
  isActive: z.boolean(),
})

type RoleValues = z.infer<typeof roleSchema>

interface RoleEditorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Omit to create. */
  role?: RoleSummary
  /** Candidate parents for the hierarchy picker. */
  allRoles: RoleSummary[]
}

/**
 * Create or edit a role, and attach/detach its permissions.
 *
 * Permissions are only offered once the role exists: they are attached through
 * their own endpoints keyed by role id, so there is nothing to attach them to
 * until the role has been created.
 */
export function RoleEditorModal({ open, onOpenChange, role, allRoles }: RoleEditorModalProps) {
  const isEdit = Boolean(role)
  const canUpdate = usePermission(PERMISSIONS.rolesUpdate)

  const create = roles.useCreate()
  const update = roles.useUpdate()
  const detail = roles.useDetail(isEdit ? role?.id : undefined)
  const catalogue = usePermissionCatalogue()
  const attach = roles.useAttachPermission()
  const detach = roles.useDetachPermission()

  const [busyPermission, setBusyPermission] = useState<string | null>(null)

  const form = useAppForm<RoleValues>({
    schema: roleSchema,
    values: {
      name: role?.name ?? '',
      key: role?.key ?? '',
      description: role?.description ?? '',
      level: role?.level === undefined || role?.level === null ? '' : String(role.level),
      parentId: role?.parentId ?? '',
      isActive: role?.isActive ?? true,
    },
  })

  const attached = new Set((detail.data?.permissions ?? []).map((permission) => permission.id))

  const togglePermission = async (permissionId: string, key: string): Promise<void> => {
    if (!role) return

    setBusyPermission(permissionId)
    try {
      if (attached.has(permissionId))
        await detach.mutateAsync({ roleId: role.id, permissionId })
      else await attach.mutateAsync({ roleId: role.id, permissionId })

      await detail.refetch()
      notify.success(attached.has(permissionId) ? `Detached ${key}` : `Attached ${key}`)
    } catch (error) {
      notify.error(resolveAuthError(error).message)
    } finally {
      setBusyPermission(null)
    }
  }

  // A role cannot inherit from itself; deeper cycles are caught server-side
  // with ROLE_HIERARCHY_CYCLE, which the resolver puts on the parent field.
  const parentOptions = [
    { label: 'No parent', value: '' },
    ...allRoles
      .filter((candidate) => candidate.id !== role?.id)
      .map((candidate) => ({ label: candidate.name, value: candidate.id })),
  ]

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? `Edit ${role?.name}` : 'New role'}
      description={
        isEdit
          ? 'Change what this role is and what it grants.'
          : 'Create the role, then attach permissions to it.'
      }
      size="lg"
    >
      <Form
        form={form}
        mapError={resolveAuthError}
        onSubmit={async (values) => {
          const payload = {
            name: values.name,
            key: values.key,
            description: values.description || undefined,
            level: values.level === '' ? undefined : Number(values.level),
            // An empty select means "no parent", which the API takes as null.
            parentId: values.parentId === '' ? null : values.parentId,
            isActive: values.isActive,
          }

          if (isEdit && role) {
            await update.mutateAsync({ id: role.id, payload })
            notify.success('Role updated')
          } else {
            await create.mutateAsync(payload)
            notify.success('Role created')
          }

          onOpenChange(false)
        }}
      >
        <FieldGroup>
          <TextField<RoleValues> name="name" label="Name" required placeholder="Support" />
          <TextField<RoleValues>
            name="key"
            label="Key"
            required
            placeholder="support"
            hint="Lowercase, digits and underscores."
            disabled={role?.isSystem}
          />
        </FieldGroup>

        <TextareaField<RoleValues>
          name="description"
          label="Description"
          rows={2}
          placeholder="What this role is for."
        />

        <FieldGroup>
          <SelectField<RoleValues>
            name="parentId"
            label="Inherits from"
            options={parentOptions}
            hint="Gains everything the parent grants."
          />
          <TextField<RoleValues>
            name="level"
            label="Level"
            type="number"
            placeholder="10"
            hint="Higher means more senior. Optional."
          />
        </FieldGroup>

        <SwitchField<RoleValues>
          name="isActive"
          label="Active"
          hint="Turning this off revokes what the role grants, immediately."
        />

        <FormActions
          submitLabel={isEdit ? 'Save role' : 'Create role'}
          onCancel={() => onOpenChange(false)}
        />
      </Form>

      {isEdit && (
        <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
          <span className="flex items-center gap-1.5 text-heading-4">
            <KeyRound className="size-4" aria-hidden="true" />
            Permissions
          </span>
          <p className="text-caption text-muted-foreground">
            Attached directly to this role. Anything inherited from a parent is not listed here
            and cannot be detached from this screen.
          </p>

          {catalogue.isLoading || detail.isLoading ? (
            <div className="flex flex-col gap-1.5" aria-hidden="true">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-9 rounded-md" />
              ))}
            </div>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {catalogue.data?.items.map((permission) => {
                const isOn = attached.has(permission.id)
                const inputId = `perm-${role?.id}-${permission.id}`

                return (
                  <li key={permission.id}>
                    <Label
                      htmlFor={inputId}
                      className={cn(
                        'flex items-center gap-2.5 rounded-md p-2 font-normal',
                        canUpdate ? 'cursor-pointer hover:bg-accent' : 'cursor-default',
                      )}
                    >
                      <Checkbox
                        id={inputId}
                        checked={isOn}
                        disabled={!canUpdate || busyPermission === permission.id}
                        onCheckedChange={() =>
                          void togglePermission(permission.id, permission.key)
                        }
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="font-mono text-caption">{permission.key}</span>
                        {permission.description && (
                          <span className="text-caption text-muted-foreground">
                            {permission.description}
                          </span>
                        )}
                      </span>
                      {permission.resourceName && (
                        <Badge variant="outline">{permission.resourceName}</Badge>
                      )}
                    </Label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}
