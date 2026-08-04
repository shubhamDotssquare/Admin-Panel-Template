# Admin Panel Template

A reusable admin panel foundation: React 19, Vite 8, TypeScript 6, Tailwind CSS v4
and shadcn/ui. It ships the shell — routing, layouts, theming, design tokens and a
module system — and deliberately ships no business features.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional; every value has a default
npm run dev                  # http://localhost:3000
```

| Script               | What it does                          |
| -------------------- | ------------------------------------- |
| `npm run dev`        | Dev server with HMR                   |
| `npm run build`      | Typecheck, then production build      |
| `npm run preview`    | Serve the production build            |
| `npm run typecheck`  | TypeScript only                       |
| `npm run lint`       | oxlint                                |
| `npm run format`     | Prettier, with Tailwind class sorting |
| `npm run ui:add <x>` | Add a shadcn/ui component             |

## Architecture

```
src/
├── app.tsx                  # composition root: providers + router
├── main.tsx                 # React entry point
│
├── components/
│   ├── ui/                  # shadcn/ui primitives (generated; edit freely)
│   ├── layout/              # shell chrome: sidebar, header, brand, nav, theme toggle
│   └── common/              # shared app components: PageHeader, EmptyState, …
│
├── config/                  # app.config, env, navigation, theme — all behaviour switches
├── constants/               # endpoints, storage keys, http codes, UI defaults
├── hooks/                   # reusable hooks
├── layouts/                 # AdminLayout, AuthLayout, BlankLayout
├── modules/                 # feature modules + the registry (see modules/README.md)
├── pages/                   # shell-level screens: 404, 403, placeholders
├── providers/               # ThemeProvider, LayoutProvider, AppProviders
├── router/                  # paths, route tree, guards
├── services/                # http client, error type, CRUD factory, session
├── styles/                  # globals.css, tokens.css, typography.css
├── types/                   # shared contracts
└── utils/                   # cn, formatters, storage, query-string, string helpers
```

`@/*` is aliased to `src/*` in both `vite.config.ts` and `tsconfig.app.json`.

### The module system

Feature areas are modules. Each exports a `ModuleDefinition` — id, base path,
routes, optional navigation — and is listed in
[`src/modules/registry.ts`](src/modules/registry.ts). The router builds its tree
from that registry, so **adding a feature means adding a folder and one registry
line**; no framework file changes.

Sidebar entries for all planned modules (Admin Manager, User Manager, CMS,
Settings, Enquiry Manager, Email Templates, Help & Support, Analytics) already
exist in [`src/config/navigation.config.ts`](src/config/navigation.config.ts)
with reserved paths. Until a module is registered, its routes render a placeholder
that names the folder meant to own them — so the shell is fully navigable now and
each module can be built independently.

See [`src/modules/README.md`](src/modules/README.md) for the full recipe.

### Routing

[`src/router/routes.tsx`](src/router/routes.tsx) has three branches:

- **Auth** — `GuestRoute` → `AuthLayout`, for sign-in and recovery.
- **Shell** — `ProtectedRoute` → `AdminLayout`, where module routes mount.
- **Standalone** — `BlankLayout`, for `/403` and `/404`.

Every path lives in [`src/router/paths.ts`](src/router/paths.ts); use `PATHS` and
`route()` rather than string literals. Pages are lazy-loaded, so each becomes its
own chunk.

Guards are inert while `VITE_AUTH_ENABLED=false`, which lets the template run
without a backend. Set it to `true` once real auth exists; `ProtectedRoute` reads
`sessionService.hasSession()` and is the single place to swap in a real session
hook.

### Theming

`ThemeProvider` owns a `light | dark | system` preference, persists it, resolves
`system` against the OS, keeps `<html class="dark">` and `color-scheme` in sync,
and suppresses transitions during the swap. Read it with `useTheme()`.

### Design tokens

[`src/styles/tokens.css`](src/styles/tokens.css) is the single source of truth for
colour, radius and layout metrics — light and dark, as oklch pairs. `@theme inline`
exposes them as Tailwind utilities (`bg-sidebar`, `text-muted-foreground`,
`w-sidebar`, `h-header`, `p-content`, `max-w-content`).

[`typography.css`](src/styles/typography.css) adds a type scale as utilities
(`text-heading-1`…`text-heading-4`, `text-body`, `text-caption`), applied to bare
`h1`–`h4` in the base layer.

**Rebranding should touch only `tokens.css` and `.env.local`** — no component
edits.

### Services

`httpClient` is a dependency-free `fetch` wrapper handling base URL, auth header,
query serialisation, timeouts and uniform `ApiError`s. Call
`configureHttpClient({ getToken, onUnauthorized })` once from the auth module to
connect it to a session — the transport layer has no auth dependency of its own.

`createResourceService<T>('/path')` returns typed `list`/`get`/`create`/`update`/
`patch`/`remove` against the standard response envelope.

## Conventions

- Files are `kebab-case`; components are `PascalCase`; hooks are `use-*.ts`.
- No hard-coded paths, endpoints, storage keys, colours or font sizes — they all
  have a home under `config/`, `constants/` or `styles/`.
- Modules never import each other. Promote anything shared up into
  `components/`, `hooks/`, `utils/` or `services/`.
- `erasableSyntaxOnly` is on: no TS `enum`s, parameter properties or namespaces.
  Use `as const` objects with a `ValueOf<>` union instead.

## Verified

`npm run build` and `npm run lint` pass. The shell was render-checked in a real
browser: root redirect, dashboard, placeholder routes, 404 fallback, auth layout,
the responsive sidebar (rail / collapsed / mobile sheet) and OS-driven dark mode.
