# Modules

A module is a self-contained feature area. It owns its routes, screens, services
and types, and plugs into the shell through a single registration point. The
framework never imports module internals — that boundary is what keeps this
template reusable across projects.

## Anatomy

```
src/modules/<module-id>/
├── index.ts                 # exports the ModuleDefinition — the only public surface
├── routes.tsx               # optional: split routes out once there are several
├── pages/                   # route-level screens
│   ├── <thing>-list-page.tsx
│   └── <thing>-detail-page.tsx
├── components/              # components used only by this module
├── services/                # API calls for this module's resources
├── hooks/                   # module-specific hooks
├── types/                   # module-specific types
└── constants.ts             # module-specific constants
```

Create only the folders you actually need. `index.ts` and `pages/` are enough to
start.

## Adding a module

**1. Reserve the path** in [`src/router/paths.ts`](../router/paths.ts) — most of
the planned modules already have one.

**2. Write the pages.** Open every screen with the shared primitives so the whole
panel stays visually consistent:

```tsx
// src/modules/user-manager/pages/user-list-page.tsx
import { PageContainer } from '@/components/common/page-container'
import { PageHeader } from '@/components/common/page-header'
import { Button } from '@/components/ui/button'

export function UserListPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Manage accounts and access."
        actions={<Button size="sm">Add user</Button>}
      />
      {/* table goes here */}
    </PageContainer>
  )
}

export default UserListPage
```

**3. Declare the module.** Lazy-load pages so each module lands in its own chunk:

```ts
// src/modules/user-manager/index.ts
import { lazy } from 'react'

import { PATHS, route } from '@/router/paths'
import type { ModuleDefinition } from '@/types/module.types'

const UserListPage = lazy(() => import('./pages/user-list-page'))
const UserDetailPage = lazy(() => import('./pages/user-detail-page'))

export const userManagerModule: ModuleDefinition = {
  id: 'user-manager',
  title: 'User Manager',
  basePath: PATHS.userManager,
  enabled: true,
  routes: [
    { path: PATHS.userManager, Component: UserListPage },
    { path: route(PATHS.userManager, ':userId'), Component: UserDetailPage },
  ],
}

export default userManagerModule
```

**4. Register it** in [`registry.ts`](./registry.ts):

```ts
import { userManagerModule } from './user-manager'

export const MODULE_REGISTRY: ModuleDefinition[] = [dashboardModule, userManagerModule]
```

That is the whole wiring. The router mounts the routes and the existing sidebar
entry starts resolving to real screens.

## Navigation

Sidebar entries for the planned modules already live in
[`src/config/navigation.config.ts`](../config/navigation.config.ts). Until a
module is registered, its paths resolve to `ModulePlaceholderPage`, which names
the folder that should own them.

Edit that config for entries that belong to the app's information architecture.
Use the module's own `navigation` field only when a module ships nav entries that
should appear and disappear with the module itself.

## Services

Most resources need nothing beyond the CRUD factory:

```ts
// src/modules/user-manager/services/user.service.ts
import { createResourceService } from '@/services/base.service'
import { httpClient } from '@/services/http-client'
import type { CreateUserDto, User } from '../types'

export const userService = {
  ...createResourceService<User, CreateUserDto>('/users'),
  suspend: (id: string) => httpClient.post(`/users/${id}/suspend`),
}
```

`list`, `get`, `create`, `update`, `patch` and `remove` come for free, already
typed and already unwrapping the `ApiResponse` envelope.

## Rules

- **Never import from another module.** Promote anything shared into
  `@/components`, `@/hooks`, `@/utils` or `@/services`.
- **No hard-coded paths.** Always go through `PATHS` and `route()`.
- **No hard-coded storage keys or endpoints.** Use `@/constants`.
- **No raw colours or font sizes.** Use the tokens in `@/styles/tokens.css`.
- **Keep `index.ts` to the definition.** It is the module's public contract.

## Planned modules

| Module          | Reserved path     | Folder                         |
| --------------- | ----------------- | ------------------------------ |
| Dashboard       | `/dashboard`      | `dashboard/` *(implemented)*   |
| Analytics       | `/analytics`      | `analytics/`                   |
| User Manager    | `/users`          | `user-manager/`                |
| Admin Manager   | `/admin-manager`  | `admin-manager/`               |
| CMS             | `/cms`            | `cms/`                         |
| Email Templates | `/email-templates`| `email-templates/`             |
| Enquiry Manager | `/enquiries`      | `enquiry-manager/`             |
| Settings        | `/settings`       | `settings/`                    |
| Help & Support  | `/help`           | `help-support/`                |

Authentication screens belong to `admin-manager/`; point `PATHS.auth.login` at
them and set `VITE_AUTH_ENABLED=true` to activate the route guards.
