import { Monitor, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { themeConfig } from '@/config/theme.config'
import { useTheme } from '@/hooks/use-theme'
import type { IconComponent } from '@/types/common.types'
import type { ThemeMode } from '@/types/theme.types'

const MODE_META: Record<ThemeMode, { label: string; icon: IconComponent }> = {
  light: { label: 'Light', icon: Sun },
  dark: { label: 'Dark', icon: Moon },
  system: { label: 'System', icon: Monitor },
}

/** Light / dark / system switcher, driven by `themeConfig.availableModes`. */
export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const ActiveIcon = resolvedTheme === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Change theme">
              <ActiveIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Theme</TooltipContent>
      </Tooltip>

      <DropdownMenuContent align="end" className="min-w-36">
        {themeConfig.availableModes.map((mode) => {
          const { label, icon: Icon } = MODE_META[mode]

          return (
            <DropdownMenuItem
              key={mode}
              onSelect={() => setTheme(mode)}
              data-active={theme === mode || undefined}
              className="gap-2 data-active:bg-accent data-active:text-accent-foreground"
            >
              <Icon className="size-4" />
              {label}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
