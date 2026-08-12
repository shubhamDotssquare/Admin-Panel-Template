import { LogIn, LogOut, Settings, User } from 'lucide-react'
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
import { appConfig } from '@/config/app.config'
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

/** Shown in place of an account when no one is signed in. */
const PLACEHOLDER_USER: UserMenuUser = { name: 'Guest' }

/**
 * Account dropdown.
 *
 * Presentational by design — the user object and sign-out handler are injected,
 * so the shell carries no authentication logic.
 */
export function UserMenu({ user, onSignOut }: UserMenuProps) {
  // No user means no session — the menu offers a way *in*, not a sign-out that
  // would do nothing. Without this the sign-in screen is unreachable by
  // navigation whenever the guards are inert.
  const isSignedIn = Boolean(user)
  const display = user ?? PLACEHOLDER_USER

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar className="size-8">
            {display.avatarUrl && <AvatarImage src={display.avatarUrl} alt="" />}
            <AvatarFallback className="text-caption">{initials(display.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{display.name}</span>
          {display.email && (
            <span className="truncate text-caption font-normal text-muted-foreground">
              {display.email}
            </span>
          )}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {!isSignedIn && (
          <DropdownMenuItem asChild>
            <Link to={appConfig.loginPath} className="gap-2">
              <LogIn className="size-4" />
              Sign in
            </Link>
          </DropdownMenuItem>
        )}

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

        {isSignedIn && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" disabled={!onSignOut} onSelect={onSignOut}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
