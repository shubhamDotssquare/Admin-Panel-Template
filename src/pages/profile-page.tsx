import {
  Clock,
  KeyRound,
  LogOut,
  Mail,
  MonitorSmartphone,
  ShieldCheck,
  User,
} from 'lucide-react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/common/empty-state'
import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { appConfig } from '@/config/app.config'
import { useAuth } from '@/hooks/use-auth'
import { PATHS, route } from '@/router/paths'
import { formatDate } from '@/utils/format'
import { initials } from '@/utils/string'
import { displayName } from '@/utils/user'

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex min-w-0 flex-col">
        <span className="text-caption text-muted-foreground">{label}</span>
        <span className="text-body break-words">{value}</span>
      </div>
    </div>
  )
}

/**
 * Read-only account screen — the destination of the header's "Profile" link.
 *
 * Editing belongs to whichever module owns user records, so this deliberately
 * renders what auth state already knows and nothing more.
 */
export function ProfilePage() {
  const { user, signOut } = useAuth()

  if (!user) {
    return (
      <PageContainer>
        <PageHeader title="Profile" description="Your account details." />
        <EmptyState
          icon={User}
          title="No signed-in account"
          description={
            appConfig.auth.enabled
              ? 'Sign in to see your profile.'
              : 'Authentication is disabled, so there is no account to show. Set VITE_AUTH_ENABLED=true to activate it.'
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Profile"
        description="Your account details."
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to={route(PATHS.settings, 'security')}>
                <KeyRound className="size-4" />
                Change password
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={route(PATHS.settings, 'devices')}>
                <MonitorSmartphone className="size-4" />
                Devices
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void signOut()}>
              <LogOut className="size-4" />
              Sign out
            </Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="flex-row items-center gap-4">
          <Avatar className="size-14">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="text-heading-4">
              {initials(displayName(user))}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-col items-start gap-1">
            <CardTitle className="truncate text-heading-3">{displayName(user)}</CardTitle>
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Informational only — there is no server-side RBAC yet. */}
              {user.role && <Badge variant="secondary">{user.role}</Badge>}
              {user.status && (
                <Badge variant={user.status === 'ACTIVE' ? 'outline' : 'destructive'}>
                  {user.status}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-4">
          <DetailRow icon={Mail} label="Email" value={user.email} />
          <DetailRow icon={User} label="Account ID" value={user.id} />
          {user.lastLoginAt && (
            <DetailRow icon={Clock} label="Last sign-in" value={formatDate(user.lastLoginAt)} />
          )}
          <DetailRow
            icon={ShieldCheck}
            label="Email verified"
            value={
              user.emailVerified ? (
                'Verified'
              ) : (
                <span className="text-muted-foreground">Not verified</span>
              )
            }
          />
        </CardContent>
      </Card>
    </PageContainer>
  )
}

export default ProfilePage
