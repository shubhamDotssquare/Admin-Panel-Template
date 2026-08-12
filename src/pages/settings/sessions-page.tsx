import { useCallback, useEffect, useState } from 'react'
import { LogOut, MonitorSmartphone, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router'

import { DataTable, type DataTableColumn } from '@/components/common/data-table'
import { FormMessage } from '@/components/common/form-message'
import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/use-auth'
import { useConfirm } from '@/hooks/use-confirm'
import { PATHS } from '@/router/paths'
import { authService } from '@/services/auth.service'
import { resolveAuthError } from '@/services/auth-error'
import type { SessionSummary } from '@/types/auth.types'
import { formatRelativeTime } from '@/utils/format'
import { notify } from '@/utils/toast'

/**
 * Condense a user-agent into something a person can recognise.
 *
 * The server's `deviceLabel` is preferred whenever it supplies one; this is only
 * the fallback, and deliberately coarse — the goal is "is this me?", not
 * forensic accuracy.
 */
function describeDevice(session: SessionSummary): string {
  if (session.deviceLabel) return session.deviceLabel

  const agent = session.userAgent
  if (!agent) return 'Unknown device'

  const browser = /edg/i.test(agent)
    ? 'Edge'
    : /chrome|crios/i.test(agent)
      ? 'Chrome'
      : /firefox|fxios/i.test(agent)
        ? 'Firefox'
        : /safari/i.test(agent)
          ? 'Safari'
          : 'Browser'

  const platform = /iphone|ipad|ios/i.test(agent)
    ? 'iOS'
    : /android/i.test(agent)
      ? 'Android'
      : /mac os|macintosh/i.test(agent)
        ? 'macOS'
        : /windows/i.test(agent)
          ? 'Windows'
          : /linux/i.test(agent)
            ? 'Linux'
            : undefined

  return platform ? `${browser} on ${platform}` : browser
}

/**
 * Active sessions, with per-device revocation.
 *
 * No token is ever rendered — the API does not return them, and a "manage
 * devices" screen has no business displaying credentials even if it could.
 */
export function SessionsPage() {
  const { signOutEverywhere } = useAuth()
  const confirm = useConfirm()
  const navigate = useNavigate()

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await authService.listSessions()
      setSessions(result?.sessions ?? [])
      setTotal(result?.total ?? result?.sessions?.length ?? 0)
    } catch (err) {
      setError(resolveAuthError(err).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleRevoke = async (session: SessionSummary): Promise<void> => {
    const label = describeDevice(session)

    const ok = await confirm({
      title: session.current ? 'Sign out this device?' : `Sign out ${label}?`,
      description: session.current
        ? 'This is the device you are using now — you will be returned to the sign-in screen.'
        : 'That device will need to sign in again to regain access.',
      confirmLabel: 'Sign out',
      tone: 'destructive',
    })
    if (!ok) return

    setRevokingId(session.id)
    try {
      await authService.revokeSession(session.id)

      // Revoking your own session invalidates the token this page is using, so
      // there is nothing left to reload — leave rather than show a broken list.
      if (session.current) {
        navigate(PATHS.auth.login, { replace: true })
        return
      }

      notify.success(`Signed out ${label}`)
      await load()
    } catch (err) {
      notify.error(resolveAuthError(err).message)
    } finally {
      setRevokingId(null)
    }
  }

  const handleRevokeAll = async (): Promise<void> => {
    const ok = await confirm({
      title: 'Sign out of every device?',
      description:
        'This ends all sessions, including this one. You will need to sign in again.',
      confirmLabel: 'Sign out everywhere',
      tone: 'destructive',
    })
    if (!ok) return

    try {
      await signOutEverywhere()
    } finally {
      navigate(PATHS.auth.login, { replace: true })
    }
  }

  const columns: DataTableColumn<SessionSummary>[] = [
    {
      id: 'device',
      header: 'Device',
      cell: (session) => (
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-2 font-medium">
            {describeDevice(session)}
            {session.current && <Badge variant="secondary">This device</Badge>}
          </span>
          {session.ip && (
            <span className="text-caption text-muted-foreground">{session.ip}</span>
          )}
        </div>
      ),
    },
    {
      id: 'lastUsed',
      header: 'Last active',
      cell: (session) =>
        session.lastUsedAt ? (
          formatRelativeTime(session.lastUsedAt)
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'signedIn',
      header: 'Signed in',
      cell: (session) =>
        session.createdAt ? (
          formatRelativeTime(session.createdAt)
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: '9rem',
      cell: (session) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleRevoke(session)}
          disabled={revokingId === session.id}
        >
          {revokingId === session.id ? <Spinner size="sm" /> : <LogOut className="size-4" />}
          Sign out
        </Button>
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Devices"
        description="Every device currently signed in to your account."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void load()}
              disabled={isLoading}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleRevokeAll()}
              disabled={isLoading || sessions.length === 0}
            >
              Sign out everywhere
            </Button>
          </div>
        }
      />

      <FormMessage>{error}</FormMessage>

      <DataTable
        columns={columns}
        rows={sessions}
        rowKey={(session) => session.id}
        isLoading={isLoading}
        emptyIcon={MonitorSmartphone}
        emptyTitle="No active sessions"
        emptyDescription="Sessions appear here once you sign in on a device."
        footer={
          <span className="text-caption text-muted-foreground">
            {total} active {total === 1 ? 'session' : 'sessions'}
          </span>
        }
      />
    </PageContainer>
  )
}

export default SessionsPage
