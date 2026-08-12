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
│   ├── layout/              # shell chrome: sidebar, header, nav, search, notifications
│   ├── common/              # design system: Modal, Drawer, DataTable, FormField, …
│   ├── data-table/          # schema-driven CRUD table (toolbar, paging, actions)
│   ├── form/                # form engine: RHF + Zod, field types, sections, tabs
│   └── patterns/            # ListPage, DetailPage, Timeline, FileList, NoteList, …
│
├── config/                  # app.config, env, navigation, theme — all behaviour switches
├── constants/               # endpoints, storage keys, http codes, UI defaults
├── hooks/                   # useAuth, usePermission, usePagination, useForm, …
├── lib/                     # query client, query keys, resource-query factory
├── layouts/                 # AdminLayout + AdminShell, AuthLayout, BlankLayout
├── modules/                 # feature modules + the registry (see modules/README.md)
├── pages/                   # shell-level screens: auth, profile, 404, 403
├── providers/               # Theme, Auth, Layout, Breadcrumb, Confirm + AppProviders
├── router/                  # paths, route tree, guards
├── services/                # http client, error type, CRUD factory, auth, session
├── styles/                  # globals.css, tokens.css, typography.css
├── types/                   # shared contracts
└── utils/                   # cn, formatters, storage, query-string, string, validation, toast
```

`@/*` is aliased to `src/*` in both `vite.config.ts` and `tsconfig.app.json`.

### The app shell

`AdminLayout` is the frame every module screen mounts into: a fixed sidebar, a
sticky header, and a scrolling content region. It holds **no** session or data
state — anything user-specific is passed in, so the shell stays reusable:

```tsx
<AdminLayout
  user={{ name: 'Ada Lovelace', email: 'ada@example.com' }}
  onSignOut={signOut}
  notifications={{ notifications: items, onMarkAllRead, viewAllPath: PATHS.enquiryManager }}
  searchItems={recentlyViewedRecords}
/>
```

**Sidebar.** Collapses to an icon rail (persisted across reloads) and becomes an
off-canvas sheet below `lg`. It renders entirely from
[`navigation.config.ts`](src/config/navigation.config.ts) — labelled groups,
icons, badges, nested children, `permissions`, `hidden`, and `external`. Adding
an entry never means editing a component. On the collapsed rail a badge anywhere
in a subtree surfaces as a dot on the icon.

**Header.** Breadcrumb trail, search, notifications, theme toggle, and the
account menu. `showSearch`, `showNotifications` and `showBreadcrumbs` in
`appConfig.layout` switch the three off per project.

**Search** (`⌘K` / `Ctrl K`) indexes the navigation config, so every route is
reachable by name with zero per-module wiring. Modules add their own records via
`searchItems`.

**Breadcrumbs** are derived from the URL by default. A screen that knows better —
dynamic segments like `/users/42` — publishes its own trail, and the header
prefers it:

```tsx
useSetBreadcrumbs([{ label: 'Users', path: PATHS.userManager }, { label: user.name }])
```

### The design system

Two layers, and the distinction matters when deciding where new work goes.

**`components/ui/`** — shadcn/ui primitives. Generated, unstyled-by-intent, edit
freely. Add with `npm run ui:add <name>`.

**`components/common/`** — the app's own compositions. These exist so a module
never re-assembles the same six primitives, or re-decides the same max-width:

| Component                        | Purpose                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `Modal`                          | Dialog with header, scrolling body, action row. Sizes `sm`–`xl`; `dismissible={false}` for work in flight                 |
| `Drawer`                         | Off-canvas panel on any side, sized by width (left/right) or height (top/bottom)                                          |
| `DataTable`                      | The list surface: column data in, three states out — loading skeletons, empty, populated. `footer` is the pagination slot |
| `ConfirmDialog`                  | "Are you sure?", with a `destructive` tone                                                                                |
| `EmptyState`                     | Icon, title, description, optional action                                                                                 |
| `FormField`                      | Label, control, error/hint, and the ARIA wiring. Spread its payload: `{(field) => <Input {...field} />}`                  |
| `FormMessage`                    | Whole-form banner — `error`, `success`, `info`                                                                            |
| `PageContainer` / `PageHeader`   | Page frame and heading every screen opens with                                                                            |
| `AuthCard`                       | Shared frame for the authentication screens                                                                               |
| `PasswordInput`                  | Password field with a reveal toggle                                                                                       |
| `LoadingScreen` / `PageSkeleton` | Route-level loading                                                                                                       |

New primitives added to `ui/`: **`Tabs`** (`pill` and `line` variants, kept in
sync through context so a list and its triggers cannot drift) and **`Spinner`**
(sizes aligned to the `Button` scale, so swapping one into a button never changes
its height).

**Confirming an action.** `ConfirmProvider` mounts one dialog for the whole app and
`useConfirm()` hands out a promise, so the call site reads like the question:

```ts
const confirm = useConfirm()

if (!(await confirm({ title: 'Delete user?', tone: 'destructive' }))) return
notify.promise(userService.remove(id), { loading: 'Deleting…', success: 'Deleted' })
```

**Toasts.** Always through [`notify`](src/utils/toast.ts) — never `sonner`
directly — so tone and duration stay consistent and the library is swappable.
`notify.success/error/info/warning/loading`, plus `notify.fromError(error)` for a
caught `ApiError` and `notify.promise()` to bind one toast to a request.

The dividing line: **toasts confirm, they do not validate.** Field problems belong
on the field, whole-form failures in `FormMessage`; a toast reports the outcome of
an action the user already committed to.

### List and detail patterns

Two page shapes cover almost every module screen, so neither the layout nor the
table behaviour is re-approximated per feature.

**The CRUD table is described as data.** `TableSchema` declares columns, filters,
row actions, bulk actions, export and empty copy; the framework supplies
searching (debounced), sorting, server-side paging, selection, column visibility,
confirmations and export. A module writes a schema, not a table:

```tsx
const schema: TableSchema<User> = {
  rowKey: (u) => u.id,
  search: { placeholder: 'Search users…' },
  defaultSort: { field: 'name', direction: 'asc' },
  filters: [{ id: 'role', label: 'Role', type: 'select', options: roleOptions }],
  columns: [
    { id: 'name', header: 'Name', sortable: true, accessor: (u) => u.name },
    { id: 'role', header: 'Role', accessor: (u) => u.role,
      cell: (u) => <Badge>{u.role}</Badge> },
  ],
  rowActions: [{ id: 'delete', label: 'Delete', destructive: true,
    confirm: (u) => ({ title: `Delete ${u.name}?` }),
    onSelect: (u) => remove.mutateAsync(u.id) }],
  bulkActions: [{ id: 'archive', label: 'Archive', onSelect: (rows) => archive(rows) }],
  export: { filename: 'users', fetchAll: () => userService.list({ perPage: 500 }) },
}

const table = useTableState({ schema, total: data?.meta.total })
const { data, isLoading } = users.useList(table.params)

<ListPage title="Users" stats={stats} actions={<Button>Add user</Button>}>
  <CrudTable schema={schema} table={table} rows={data?.items ?? []}
             total={data?.meta.total} isLoading={isLoading} />
</ListPage>
```

`useTableState` owns the state and hands back `params` ready for a list query, so
the page keeps control of _what_ it fetches while the table owns _how_ it is
presented. State lives outside the table because a page often needs it too — for
a filtered count, or to keep the URL shareable via `syncToUrl`.

A few behaviours worth knowing:

- **`accessor` is what gets exported.** A spreadsheet should contain `Active`,
  not the `<Badge>` you drew around it, so exports read values rather than cells.
- **Narrowing resets to page 1.** Page 7 of a freshly-filtered 3-page result is a
  blank screen that reads as "no records".
- **Selection survives paging** — the header checkbox governs the current page,
  not the whole result set — and is cleared after a bulk action, since those rows
  may no longer exist.
- **CSV fields starting `=`, `+`, `-` or `@` are quote-prefixed.** Spreadsheets
  treat those as formulas, which turns an export into code execution on the
  recipient's machine.
- **"All matching records" only appears when `fetchAll` is supplied** — offering
  it otherwise would promise something the table cannot deliver.

**Detail screens** use `DetailPage`: an identity header (avatar, status, meta
facts, actions) above tabs. Overview / Activity / Files / Notes / History is the
recurring set, so the layout is fixed while the tabs stay data — pass whichever
sections a record has, rendered with the section components:

| Component         | Serves                                                                   |
| ----------------- | ------------------------------------------------------------------------ |
| `DescriptionList` | Overview — label/value pairs as a real `<dl>`                            |
| `Timeline`        | Activity **and** History; history entries add `changes` for before/after |
| `FileList`        | Attachments, with size, uploader and download                            |
| `NoteList`        | Internal notes, pinned-first, with an optional composer                  |
| `StatCard`        | The summary row on list pages                                            |

### The form engine

React Hook Form for state, Zod for rules. **One Zod schema is the source of truth
for a form's shape and its validation**, so value types are inferred rather than
declared twice.

```tsx
const schema = z.object({
  name: z.string().min(2, 'Enter at least 2 characters.'),
  email: emailSchema,
  role: z.string().min(1, 'Pick a role.'),
})

const form = useAppForm<z.infer<typeof schema>>({ schema, defaultValues })

<Form form={form} onSubmit={(values) => users.create(values)} mapError={resolveAuthError}>
  <FieldGroup>
    <TextField name="name" label="Name" required />
    <TextField name="email" label="Email" type="email" required />
  </FieldGroup>
  <SelectField name="role" label="Role" options={roles} required />
  <FormActions submitLabel="Create user" />
</Form>
```

**Field types.** `TextField` (text, email, password, tel, url, number, search),
`TextareaField`, `SelectField`, `MultiSelectField`, `RadioField`,
`CheckboxField`, `SwitchField`, `DateField` (date / time / datetime),
`FileField` (file and image variants, with previews), `RichTextField`,
`JsonField`. All are built on one `Field` wrapper that owns the label, message
and ARIA wiring — a module can wrap any control the same way without the
framework growing a prop union.

**Layout.** `FormSection` (titled group, card or bare), `FieldGroup` (responsive
columns), `FormTabs`, `FormActions` (submit row reading `isSubmitting` and
`isDirty` from context, so a screen cannot forget to block a double-submit).

**Config-driven when it helps.** `SchemaFormBody` renders sections or tabs from
a `FieldConfig[]`, including `visibleWhen` for fields that depend on other
answers. It goes _inside_ a `<Form>`, so a screen can mix generated sections with
hand-written fields rather than choosing one or the other; anything genuinely
unusual uses `type: 'custom'`.

Decisions worth knowing:

- **Submit failures are a first-class outcome.** A thrown `ApiError` carrying
  `fieldErrors` lands on the fields it names; anything unattributed becomes the
  banner. Client and server validation render identically.
- **Tabs flag hidden errors.** A failed submit marks any tab holding invalid
  fields, otherwise a tabbed form looks like it silently refused to save.
- **Dates use native inputs.** A custom calendar is another dependency plus its
  own keyboard, locale and screen-reader story; the platform already ships one
  that speaks the user's locale. Swap one in behind `DateField` if a project
  needs ranges or presets.
- **Rich text is markdown, not WYSIWYG.** A contentEditable surface means storing
  HTML that must be sanitised everywhere it is later rendered, and the API behind
  the classic toolbar (`document.execCommand`) is deprecated. The preview renders
  to React elements — never `dangerouslySetInnerHTML` — and `javascript:` URLs in
  links are dropped. Swap in TipTap or Lexical behind the same field API if
  WYSIWYG is genuinely required.
- **`JsonField` keeps a string.** Any half-typed state is invalid JSON, and
  re-serialising per keystroke fights the caret. Parse in the schema with
  `jsonStringSchema()`.
- **`FileField` does not upload.** It owns selection and preview; transport
  belongs to the submit handler, which keeps it usable with direct-to-S3, a
  multipart POST, or create-then-attach.

Shared rules live in [`lib/zod-schemas.ts`](src/lib/zod-schemas.ts) —
`emailSchema`, `passwordSchema` (mirrors the server policy), `requiredString`,
`digitsSchema`, `jsonStringSchema`, `withMatchingFields`.

### The module system

Feature areas are modules. Each exports a `ModuleDefinition` — id, base path,
routes, optional navigation — and is listed in
[`src/modules/registry.ts`](src/modules/registry.ts). The router builds its tree
from that registry, so **adding a feature means adding a folder and one registry
line**; no framework file changes.

**User Manager** and **Admin Manager** are implemented and are the reference
modules — copy either shape. Each is roughly 6 files: `types.ts` (record shape
plus its status map), `services/*.queries.ts` (one `createResourceQueries` call
plus any action endpoints), `components/*-form.tsx` (one form shared by create
and edit), `pages/` (list, detail, form) and `index.ts`.

Sidebar entries for the remaining planned modules (CMS,
Settings, Enquiry Manager, Email Templates, Help & Support, Analytics) already
exist in [`src/config/navigation.config.ts`](src/config/navigation.config.ts)
with reserved paths. Until a module is registered, its routes render a placeholder
that names the folder meant to own them — so the shell is fully navigable now and
each module can be built independently.

See [`src/modules/README.md`](src/modules/README.md) for the full recipe.

### Routing

[`src/router/routes.tsx`](src/router/routes.tsx) has three branches:

- **Auth** — `GuestRoute` → `AuthLayout`, for sign-in and recovery.
- **Shell** — `ProtectedRoute` → `AdminShell`, where module routes mount.
- **Standalone** — `BlankLayout`, for `/403` and `/404`.

Every path lives in [`src/router/paths.ts`](src/router/paths.ts); use `PATHS` and
`route()` rather than string literals. Pages are lazy-loaded, so each becomes its
own chunk.

### Authentication

Wired to the backend auth API at `VITE_API_BASE_URL` (default
`http://localhost:4000/api/v1`). Six screens:

| Screen          | Path                 | Notes                                                       |
| --------------- | -------------------- | ----------------------------------------------------------- |
| Sign in         | `/login`             | Honours `redirectTo`; offers resend on `EMAIL_NOT_VERIFIED` |
| Create account  | `/register`          | Account starts `PENDING`; success points at the inbox       |
| Verify email    | `/verify-email`      | Exchanges `?token=` on mount                                |
| Forgot password | `/forgot-password`   | Response is identical whether or not the address exists     |
| Reset password  | `/reset-password`    | Signs out every device; always ends at sign-in              |
| Devices         | `/settings/devices`  | `GET`/`DELETE /auth/sessions`, plus sign-out-everywhere     |
| Change password | `/settings/security` | Optional revoke-other-sessions, on by default               |

`AuthProvider` owns state and token custody: `user`, `accessToken`, `sessionId`,
`status`, `signIn`, `register`, `signOut`, `signOutEverywhere`, `refresh`,
`fetchMe`. Read it with `useAuth()`.

**Token custody.** The access token is held **in memory only** — it is
short-lived and rebuildable from the refresh token, so persisting it would widen
the XSS blast radius for nothing. The refresh token goes to localStorage, because
the API returns tokens in the JSON body and cannot set an httpOnly cookie yet.
Move it to a cookie the moment the backend can: `session.service.ts` is the only
file that would change.

**Refresh tokens are single-use.** Every `/auth/refresh` returns a _new_ refresh
token and permanently spends the old one; replaying a spent token makes the server
revoke the whole session. Two consequences the code depends on:

- `setTokens` always writes **both** tokens together.
- `refresh()` is **single-flight**. Overlapping refreshes would send the same
  token twice and self-revoke the session. This is not a theoretical race —
  React StrictMode double-invokes the bootstrap effect, so an ordinary reload
  hits it.

**Boot is refresh-then-hydrate.** With no access token in memory after a reload,
the only credential on hand is the refresh token: exchange it, then adopt the
user (the live API returns one alongside the tokens; otherwise `/auth/me`).
`status` separates `loading` from `unauthenticated` so guards wait rather than
bounce.

**Error handling is one table, not a switch per screen.**
[`constants/auth-errors.ts`](src/constants/auth-errors.ts) maps every `error.code`
to copy plus a UI action; `resolveAuthError` applies it, and forms consume it via
`useForm({ mapError })`. Branch on `error.code`, never on `message`. A code whose
action is `field` is placed on that input automatically — which is why a 409
`EMAIL_ALREADY_REGISTERED` lands on the email field with no page-level code. Where
the server knows more than we can (lockout countdown, rate-limit window),
`preferServerMessage` defers to its copy.

**Not every 401 is a dead session.** `/auth/change-password` answers 401 when the
_current password_ is wrong; signing the user out for a typo would be wrong. The
client only clears the session for token/session codes, or a 401 carrying no code.

Route protection: `ProtectedRoute` (authenticated, redirects with `redirectTo`),
`GuestRoute` (keeps signed-in users off auth screens), `PermissionRoute`. Both
guards hold during bootstrap.

**No RBAC yet.** The server does not enforce roles, so `can()` returns true for
everything and `user.role` is informational. Do not build role-gated UI expecting
server-side enforcement — revisit when the backend grows real permissions.

### Theming

`ThemeProvider` owns a `light | dark | system` preference, persists it, resolves
`system` against the OS, keeps `<html class="dark">` and `color-scheme` in sync,
and suppresses transitions during the swap. Read it with `useTheme()`.

### Design tokens

[`src/styles/tokens.css`](src/styles/tokens.css) is the single source of truth for
colour, radius, layout and spacing — light and dark, as oklch pairs. `@theme inline`
exposes them as Tailwind utilities.

**Colour.** Semantic pairs only: `background`/`foreground`, `card`, `popover`,
`primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`,
`info`, `border`, `input`, `ring`, a `sidebar-*` scale so the shell can invert
independently, and `chart-1`…`chart-5`. Each has a `-foreground` counterpart, so
`bg-success text-success-foreground` is always legible. **Never a raw colour in a
component.**

**Layout.** `h-header`, `w-sidebar`, `w-sidebar-collapsed`, `p-gutter` (page
padding), `max-w-content` (page max width).

**Spacing rhythm** — the vertical scale pages and forms compose on:

| Token                 | Utility           | Value      | Used for                                             |
| --------------------- | ----------------- | ---------- | ---------------------------------------------------- |
| `--space-section`     | `gap-section`     | `1.5rem`   | Between the major blocks of a page (`PageContainer`) |
| `--space-field`       | `gap-field`       | `1rem`     | Between fields in a form                             |
| `--space-field-inner` | `gap-field-inner` | `0.375rem` | Label → control → message (`FormField`)              |

**Type.** [`typography.css`](src/styles/typography.css) exposes the scale as
utilities — `text-heading-1`…`text-heading-4`, `text-body`, `text-caption` —
applied to bare `h1`–`h4` in the base layer. **No ad-hoc `text-lg font-semibold`
pairs.**

**Control heights.** `Button`, `Input` and `SelectTrigger` share one scale — `sm`
= 2rem, `default` = 2.25rem, `lg` = 2.5rem — so a field and the button beside it
always line up.

One naming trap worth knowing: `max-w-*` resolves the `--spacing-*` namespace
before `--container-*`, so a spacing token and a container token must never share
a name. That is why the page gutter is `--spacing-gutter` and not
`--spacing-content`.

**Rebranding should touch only `tokens.css` and `.env.local`** — no component
edits.

### The data layer

Four pieces, each replaceable without touching the others.

**Transport.** `httpClient` is a dependency-free `fetch` wrapper handling base
URL, auth header, query serialisation, timeouts, envelope unwrapping, transparent
token refresh and uniform `ApiError`s. It receives its session hooks through
`configureHttpClient({ getToken, refresh, onUnauthorized })`, so the transport
layer has no auth dependency of its own.

**Services.** `createResourceService<T>('/path')` returns typed `list`, `get`,
`create`, `update`, `patch` and `remove`. It returns payloads directly — the
client already unwrapped `{ success, data }`, so services must not unwrap again.

**Server state.** TanStack Query, configured in
[`lib/query-client.ts`](src/lib/query-client.ts). Two defaults are deliberate:

- **`refetchOnWindowFocus` is off.** An admin panel loses focus constantly — to a
  terminal, a spreadsheet, an email. Refetching each time yanks rows out from
  under a half-finished action.
- **Mutations toast on failure, queries do not.** A mutation is something the user
  just did, so silence reads as success. A query failure belongs in the surface
  that was loading (`DataTable` renders its own states), and a global toast would
  fire again on every background refetch. Opt out with `meta: { silent: true }`.

Retries are error-aware: network and 5xx get two attempts, 4xx gets none (it will
fail identically), and a session-ending code gets none (retrying would burn the
refresh token the client is already using).

**Keys.** `createQueryKeys(resource)` builds the hierarchical shape
`[resource] → [resource,'list'] → [resource,'list',params]`, which gives three
invalidation blast radii for free because TanStack matches by prefix. Hand-written
string keys drift and quietly stop matching; a factory cannot.

**Putting it together.** `createResourceQueries` is the seam feature modules build
on — one call yields service, keys and hooks:

```ts
// src/modules/user-manager/services/user.queries.ts
export const users = createResourceQueries<User, CreateUserDto>('users', '/users')

// in a screen
const pagination = usePagination({ syncToUrl: true, total: data?.meta.total })
const { data, isLoading } = users.useList(pagination.params)
const remove = users.useRemove() // invalidates the right keys on success
```

Mutations declare what they invalidate via `meta: { invalidates: [...] }`, applied
centrally, so no mutation repeats that boilerplate. `useList` keeps the previous
page rendered while the next loads, so paging never flashes an empty table.

Cached data is **cleared on sign-out** — otherwise the next user to sign in on the
same browser would be served the previous account's rows until each query happened
to refetch.

### Hooks

| Hook                                                                                                   | Purpose                                                      |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| `useAuth`                                                                                              | Session, user, sign-in/out, refresh                          |
| `useTheme`                                                                                             | `light \| dark \| system`, persisted                         |
| `usePermission`                                                                                        | Declarative permission check (see the RBAC caveat below)     |
| `usePagination`                                                                                        | Page/size state, optional URL sync, `range` and `totalPages` |
| `useDebouncedValue`                                                                                    | Debounce for search inputs                                   |
| `useForm`                                                                                              | Values, validation, submit lifecycle, server field errors    |
| `useConfirm`                                                                                           | Promise-based confirmation dialog                            |
| `useLayout`, `useBreadcrumbs`, `useDisclosure`, `useLocalStorage`, `useMediaQuery`, `useDocumentTitle` | Shell and utility state                                      |

`usePermission` is **presentation only** — the backend has no RBAC yet, so `can()`
allows everything and the hook returns true. Use it to hide controls that would
only fail; never as the sole guard on a sensitive action.

### Utilities

`@/utils` covers formatting and shaping: dates and relative time
(`formatDate`, `formatDateTime`, `formatRelativeTime`), numbers and money
(`formatNumber`, `formatCompactNumber`, `formatCurrency`, `formatPercent`,
`formatBytes`), strings (`titleCase`, `slugify`, `initials`, `truncate`),
`displayName` for user records, validation rules, `cn`, storage and query-string
helpers.

API errors have two entry points: `toErrorMessage(error)` for a plain string, and
`resolveAuthError(error)` for copy **plus** a UI action and field placement driven
by the server's `error.code`.

## Conventions

- Files are `kebab-case`; components are `PascalCase`; hooks are `use-*.ts`.
- No hard-coded paths, endpoints, storage keys, colours or font sizes — they all
  have a home under `config/`, `constants/` or `styles/`.
- Modules never import each other. Promote anything shared up into
  `components/`, `hooks/`, `utils/` or `services/`.
- `erasableSyntaxOnly` is on: no TS `enum`s, parameter properties or namespaces.
  Use `as const` objects with a `ValueOf<>` union instead.

## Verified

`npm run build`, `npm run typecheck`, `npm run lint` and `npm run format:check`
pass. The shell was render-checked in a real browser: root redirect, dashboard,
placeholder routes, 404 fallback, auth layout, the responsive sidebar
(rail / collapsed / mobile sheet) and OS-driven dark mode.

Driven end-to-end with no console errors or warnings: `⌘K` opens the palette,
filters, and `Enter` navigates to the highlighted route; the notification panel
renders populated and empty states; sidebar badges render as pills when expanded
and as subtree dots on the collapsed rail; the mobile drawer opens below `lg`.

The backend integration was checked against the live API at
`http://localhost:4000/api/v1` (register → verify-email → login → `/auth/me` →
`/auth/sessions`, plus refresh rotation and reuse detection), and driven through
the UI against a stand-in modelling the same semantics — single-use refresh
tokens, reuse detection and the error envelope.

Verified with no console errors: an anonymous deep link redirects to
`/login?redirectTo=…` and returns there after sign-in; only the refresh token is
persisted (never the access token); a reload restores the session with **exactly
one** `/auth/refresh` call, repeatedly; an expired access token produces
`401 → refresh → retry` transparently and the original request succeeds; a replayed
refresh token is rejected `TOKEN_REUSE_DETECTED` and the app returns to sign-in;
a wrong _current_ password shows a field error **without** signing the user out;
`PASSWORD_REUSED` lands on `newPassword` from `error.details`; a duplicate
registration lands on the email field; an unverified account is offered a resend;
and the devices screen lists sessions and revokes them.

The shared components were driven together on a throwaway showcase route, in light
and dark, with no console errors: both `Tabs` variants switch panels; `DataTable`
renders all three states; `Modal` and `Drawer` open and close on Escape;
`useConfirm()` resolves false on cancel and true on confirm; `notify` raises a
toast; and `Input` measures 32/36/40px across `sm`/`default`/`lg`, matching
`Button`.

The data layer was exercised against a live REST resource on a throwaway route,
then removed: a paged list renders and pages forward; returning to a cached page
issues **no** request; `canNext` goes false on the last page and `range` tracks
correctly; a create invalidates and the total moves 23 → 24; a failed delete
surfaces the server's own message as a toast without touching the table; and a
successful delete invalidates and drops the row. No console errors.

The CRUD table and page patterns were driven on throwaway routes, then removed.
Every feature was exercised against a REST resource with no console errors:
sorting issues `sortBy`/`sortDirection`; eight keystrokes of search fire **one**
request; a filter round-trips as `filters[role]`; clearing restores the full set;
columns toggle in and out; row and header checkboxes drive the bulk bar; a bulk
action runs and clears the selection; a row action opens its confirmation and the
row disappears on confirm; paging and page-size re-query correctly; and CSV export
downloads `people-2026-08-12.csv` whose rows carry accessor **values**
(`Editor`, `PENDING`), not rendered badges. The detail layout was checked across
all five tabs, including adding a note and seeing the tab badge update.

The form engine was driven on a throwaway route covering every field type, then
removed. With no console errors: an empty submit raised all seven validation
messages and flagged **both** other tabs as holding errors; `visibleWhen` showed
a conditional field when its dependency changed; multi-select produced chips;
native `date`, `time` and `datetime-local` controls bound correctly; the JSON
field reported a parse error and reformatted valid input; the rich-text toolbar
wrapped a selection in `**bold**`, the preview rendered lists and bold, and a
`javascript:` link was stripped. The five migrated auth and settings forms were
re-verified end to end afterwards — including server `fieldErrors` landing on the
right inputs for a wrong current password and a reused password.
