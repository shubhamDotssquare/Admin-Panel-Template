import { LogOut, Settings, User } from 'lucide-react'
import { Link } from 'react-router'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PATHS } from '@/router/paths'
import { initials } from '@/utils/string'

export interface UserMenuUser {
  name: string
  email?: string
  avatarUrl?: string
}

interface UserMenuProps {
  /** Supplied by whichever provider owns the session; the shell only renders. */
  user?: UserMenuUser
  onSignOut?: () => void
}

const PLACEHOLDER_USER: UserMenuUser = { name: 'Signed-out user' }

/**
 * Account dropdown.
 *
 * Presentational by design — the user object and sign-out handler are injected,
 * so the shell carries no authentication logic.
 */
export function UserMenu({ user = PLACEHOLDER_USER, onSignOut }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-8">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback className="text-caption">{initials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{user.name}</span>
          {user.email && (
            <span className="truncate text-caption font-normal text-muted-foreground">
              {user.email}
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to={PATHS.profile} className="gap-2">
            <User className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to={PATHS.settings} className="gap-2">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" disabled={!onSignOut} onSelect={onSignOut}>
          <LogOut className="size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
