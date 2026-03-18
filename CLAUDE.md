# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## System Context

This repo is part of the **Propentro** multi-repo ecosystem. See `../CLAUDE.md` for system-wide conventions, data flow, and cross-repo navigation.

- **API endpoints:** `../propentro-api/src/Propentro.Api/Endpoints/` — backend endpoints this app proxies to
- **API contracts:** `../propentro-api/src/Propentro.Contracts/` — DTO definitions that frontend TypeScript types must match
- **Database schema:** `../propentro-db/releases/` — underlying data model

## Project Overview

Propentro is a multi-tenant property management dashboard. The backend is a .NET API; this repo is the frontend only. The app is org-scoped: every authenticated route and every API request belong to a single Clerk organization.

## Tech Stack

| Layer           | Technology                                       | Version         |
| --------------- | ------------------------------------------------ | --------------- |
| Framework       | Next.js (App Router, Turbopack dev)              | 16.x            |
| Language        | TypeScript (strict)                              | 5.x             |
| React           | React 19                                         | 19.x            |
| Auth            | Clerk (`@clerk/nextjs`)                          | 7.x             |
| i18n            | next-intl                                        | 4.x             |
| State (UI)      | Jotai                                            | 2.x             |
| State (server)  | TanStack React Query                             | 5.x             |
| Forms           | react-hook-form + zod (v4) + @hookform/resolvers | 7.x / 4.x / 5.x |
| UI components   | shadcn/ui (Base UI)                              | v4              |
| Styling         | Tailwind CSS 4                                   | 4.x             |
| Package manager | pnpm                                             | 10.x            |

## Commands

```bash
pnpm dev          # Start dev server (Turbopack)
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # ESLint
pnpm lint:fix     # ESLint with auto-fix
pnpm type:check   # TypeScript type checking (tsc --noEmit)
pnpm format       # Prettier formatting
```

## Environment Variables

Validated at build time via `@t3-oss/env-nextjs` with Zod in `src/env.mjs`. Copy `.env.example` to `.env.local`.

| Variable                                          | Scope  | Purpose                         |
| ------------------------------------------------- | ------ | ------------------------------- |
| `CLERK_SECRET_KEY`                                | server | Clerk API secret                |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`               | client | Clerk publishable key           |
| `NEXT_PUBLIC_BASE_API_URL`                        | client | Backend API base URL            |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL`                   | client | Defaults to `/sign-in`          |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | client | Defaults to `/select-workspace` |

## Path Aliases

`@/*` → `src/*` is the only path alias.

---

## Architecture

### Routing Structure

```
/[locale]/sign-in                         → Clerk sign-in
/[locale]/select-workspace                → Organization picker
/[locale]/access-denied                   → 403 page
/[locale]/[orgSlug]                       → Dashboard (authenticated, org-scoped)
/[locale]/[orgSlug]/settings/organization → Org settings
/[locale]/[orgSlug]/settings/members      → Members management
/[locale]/[orgSlug]/settings/roles        → Roles & permissions
```

Route path constants live in `src/config/routes.ts`.

### Middleware (`src/middleware.ts`)

Clerk middleware runs first (protects all routes except `/sign-in` and `/api`), then chains into next-intl middleware for locale handling.

### Provider Stack (`src/app/[locale]/layout.tsx`)

```
NextIntlClientProvider
  → QueryProvider (TanStack React Query + DevTools in dev)
    → ThemeProvider (next-themes)
      → AuthProvider (Clerk + theme-aware)
        → TooltipProvider
          → JotaiProvider
            → {children}
            → Toaster (sonner, top-right)
```

### Layout Shell

Uses shadcn/ui Sidebar component (Base UI). Files in `src/components/layout/`:

- `app-layout.tsx` — SidebarProvider + SidebarInset wrapper
- `app-sidebar.tsx` — Navigation items with permission gating
- `sidebar-nav.tsx` — Individual nav items using `render` prop (not `asChild`)
- `app-header.tsx` — SidebarTrigger + separator
- `user-menu.tsx` — Avatar dropdown (profile, theme toggle, sign out)
- `workspace-switcher.tsx` — Org switcher dropdown

### shadcn/ui v4 Notes (Base UI)

This project uses **shadcn/ui v4** which is built on **Base UI** (not Radix UI). Key differences:

- **No `asChild` prop** — use `render` prop instead: `<Button render={<Link href="..." />}>`
- **DropdownMenuTrigger** uses `render` prop: `<DropdownMenuTrigger render={<SidebarMenuButton />}>`
- Components are in `src/components/ui/` and auto-generated by `npx shadcn@latest add`

### Data Flow

#### API Proxy Architecture

```
Browser → apiClient (src/lib/api-client.ts) → /api/* route handlers → proxyRequest() → .NET backend
```

**Proxy path convention:** All proxy route handler paths MUST include the `/v1` API version prefix (e.g., `/v1/organizations/members`, `/v1/admin/organizations`). `NEXT_PUBLIC_BASE_API_URL` must NOT include a version prefix.

#### Query Key System

All server data is org-scoped. `orgKeys` from `src/lib/query-keys.ts` guarantees every query key includes the orgId.

### Auth

#### Client-Side Hooks

| Hook                     | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `useSession()`           | Returns `clerkOrgId`, `clerkUserId`, `isLoaded`, `isSignedIn` |
| `useMe()`                | Returns `CurrentUser` from React context (no fetch)           |
| `useHasPermission(perm)` | Client-side permission check from context                     |
| `useOrganizations()`     | Wraps Clerk org hooks (workspace switcher only)               |

#### Server-Side Auth (`src/lib/auth.ts`)

| Function                                | Purpose                                         |
| --------------------------------------- | ----------------------------------------------- |
| `getMe()`                               | Fetches `/me` from backend, cached 5 min        |
| `getMeOrRedirect(locale)`               | Like `getMe()` but redirects to sign-in if null |
| `hasPermission(permission)`             | Returns boolean                                 |
| `requirePermission(permission, locale)` | Redirects to `/access-denied` if not allowed    |
| `revalidateUserCache()`                 | Busts the `user-me` cache tag                   |

#### Clerk Abstraction Strategy

Clerk is isolated in 3 layers:

- **Layer 1 — Auth hooks** (`use-session.ts`, `use-me.ts`, `use-has-permission` in `use-me.ts`) — feature code uses these
- **Layer 2 — Auth infrastructure** (`lib/auth.ts`, `lib/proxy-request.ts`, `middleware.ts`)
- **Layer 3 — Auth UI** (`providers/auth-provider.tsx`, `hooks/use-organizations.ts`, sign-in page)

**Rule:** Feature code (`src/features/**`) NEVER imports `@clerk/nextjs` directly. ESLint enforces this.

#### Permission Constants (`src/config/permissions.ts`)

Permissions are centralised in a `PERMISSIONS` object with `feature.action` structure:

```ts
PERMISSIONS.settings.read; // 'org:settings:read'
PERMISSIONS.members.manage; // 'org:members:manage'
```

When adding a new feature, add its permissions to `PERMISSIONS` in `config/permissions.ts`. For sidebar/nav visibility that depends on _any_ permission in a group, create a derived array (e.g., `ANY_SETTINGS_READ_PERMISSION`).

---

## Feature Development

### File Organisation

#### Route folders are for routing only

`src/app/` contains **only** Next.js routing files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`. Never put components, hooks, utilities, or `_components` folders inside route directories. All non-routing code lives in `src/components/`, `src/features/`, `src/hooks/`, `src/lib/`, etc.

#### Component placement follows scope

| Scope                                 | Location                                      | Examples                                           |
| ------------------------------------- | --------------------------------------------- | -------------------------------------------------- |
| **UI primitives** (auto-generated)    | `src/components/ui/`                          | Button, Dialog, Command                            |
| **App shell** (visible on every page) | `src/components/layout/`                      | AppSidebar, AppHeader, UserMenu, WorkspaceSwitcher |
| **Shared across features**            | `src/components/`                             | PageHeader, DataTable                              |
| **Shared within a domain**            | `src/features/{domain}/components/`           | SettingsNav (shared across org, members, roles)    |
| **Specific to one feature**           | `src/features/{domain}/{feature}/components/` | MembersList, RoleForm                              |

#### Component File Separation

Any dialog, sheet, or modal that contains a form MUST be in its own file. Display-only helper components (<30 lines, stateless) may remain in the same file.

**Naming convention:**

- `create-{entity}-dialog.tsx` — create form in a dialog
- `edit-{entity}-sheet.tsx` — edit form in a sheet/side panel
- `{entity}-danger-zone.tsx` — destructive actions section
- `{entity}-{section}-table.tsx` — data table section within a detail page

**Guideline:** A component file exceeding 250 lines is a signal it should be split.

#### Feature Folder Structure (Vertical Slice)

All features — admin and dashboard — follow the same vertical slice structure:

```
src/features/{domain}/
  components/                        → Domain-level shared (layout, nav)
  types/index.ts                     → Domain-level shared types (when shared across sub-features)
  hooks/{domain}-query-keys.ts       → Domain-level shared query key factory (when shared across sub-features)
  {feature}/
    types/index.ts                   → Feature-specific types
    validators/{name}.schema.ts      → Zod schemas + inferred types + defaults
    hooks/use-{feature}.ts           → queryOptions factory + React Query hooks
    components/
      {feature}-list.tsx             → List page component
      {feature}-list-skeleton.tsx    → List loading skeleton
      {feature}-detail.tsx           → Detail page wrapper (compose sections)
      {feature}-detail-skeleton.tsx  → Detail loading skeleton
      create-{entity}-dialog.tsx     → Create form (dialog/sheet) — always separate file
      edit-{entity}-form.tsx         → Edit form — always separate file
      {entity}-danger-zone.tsx       → Destructive actions section
```

Domain-level `types/` and `hooks/` are for types and utilities shared across sub-features within the same domain. Feature-specific code lives inside the feature folder.

### Standard Page Template

Every authenticated page follows this pattern:

1. `requirePermission()` first — read permission as gate
2. `Promise.all` translations + write permission — parallel
3. Pass `canManage`/`canEdit` as prop to feature component
4. `PageHeader` is mandatory — consistent title + breadcrumb
5. No data fetching in pages — hooks in feature components handle data via React Query

**Read vs write permission:** `requirePermission('org:resource:read')` is a **gate** — blocks the entire page. `hasPermission('org:resource:manage')` is a **prop** — passed to components to show/hide write actions (edit buttons, delete, create). Both happen in the server component `page.tsx`.

**Admin page.tsx pattern:**

- Metadata format: `"Page Name | Platform Admin | Propentro"`
- Static pages use `export const metadata`
- Dynamic pages use `export async function generateMetadata`
- Admin hub page: redirect to first sub-page (same as settings hub pattern)

### Server vs Client Components

- `page.tsx`, `layout.tsx`, `loading.tsx` → always server component
- `error.tsx` → always client component (Next.js requirement)
- Feature components → pragmatic: `'use client'` only when interactive (state, hooks, event handlers)

### Hub Page Redirect

When a section has multiple sub-pages (e.g., `/settings` → organisation, members, roles), the parent route's `page.tsx` should **not render content**. Instead, it iterates through a permission → path map and redirects to the first accessible sub-page. Falls back to `/access-denied` if the user has no permissions. See `src/app/[locale]/[orgSlug]/settings/page.tsx` for the pattern.

### Page Metadata

Every page must export `metadata` (static) or `generateMetadata` (dynamic) with a descriptive title. Format: `"Page Name | Propentro"`. Never leave the browser tab showing just "Propentro".

```tsx
export const metadata: Metadata = { title: 'Members | Propentro' };
```

### Loading States (`loading.tsx`)

Every route group needs a `loading.tsx` that renders skeleton UI matching the page layout. Use the `Skeleton` component. The skeleton should mirror the page structure: `PageHeader` skeleton + content area skeleton. Never show a blank page while data loads.

### Skeleton File Pattern

- Skeleton component lives in feature's `components/`: `{feature}-skeleton.tsx` or `{feature}-list-skeleton.tsx`
- Route-level `loading.tsx` only imports and renders the skeleton component — never writes inline skeleton markup
- Skeleton must mirror page structure: PageHeader area + content area

### Error Boundaries (`error.tsx`)

Error boundaries must use i18n — no hardcoded strings. Pattern:

- Use `useTranslations('errorPages')` for all text
- Show a `Card` with translated title, description, and "Try again" button
- Call `reset()` on retry

### Not Found Pages (`not-found.tsx`)

Every dynamic route segment (`[orgSlug]`, future `[id]` routes) needs a `not-found.tsx` with i18n text. Show a centered card with icon, translated message, and a link back to the parent route.

### Empty States

When a list or table has zero items, show:

- Relevant `lucide-react` icon (muted colour)
- Translated title (e.g., "No properties yet")
- Translated description (one sentence explaining what this section is for)
- CTA button to create the first item (only if user has write permission via `canManage` prop)

Never show just a text row in an empty table. Empty states are a key onboarding moment.

---

## UX Patterns

### Breadcrumbs

Breadcrumbs live in `AppHeader` (`src/components/layout/app-header.tsx`) and are **automatically derived from the URL pathname**.

#### How it works

1. `usePathname()` returns the locale-stripped path (e.g., `/acme/settings/members`)
2. Split into `orgSlug` + `pageSegments` (e.g., `["settings", "members"]`)
3. Each segment is looked up in `SEGMENT_TO_TRANSLATION_KEY` to get a `pages.*` translation key
4. Paths are accumulated to build hrefs (e.g., `/acme/settings`, `/acme/settings/members`)
5. "Dashboard" is always the first item; last segment is non-clickable (`BreadcrumbPage`); others are links

#### Adding breadcrumbs for a new page

1. Add the URL segment → translation key mapping to `SEGMENT_TO_TRANSLATION_KEY` in `app-header.tsx`
2. Add the corresponding `pages.*` translation to `messages/en.json`

That's it — breadcrumbs appear automatically based on the URL.

#### Rules

- `AppHeader` is the single source for breadcrumbs — never render them elsewhere
- `PageHeader` has an unused `breadcrumb` prop — do not use it; remove it when convenient
- All breadcrumb labels must use `pages.*` translation keys
- Breadcrumbs are hidden on mobile (`hidden md:flex`)

### CRUD UX — Dialog vs Page

| Action                                            | UI Pattern                          |
| ------------------------------------------------- | ----------------------------------- |
| **Create/Edit** simple entity (few fields)        | Sheet (side panel)                  |
| **Create/Edit** complex entity (multi-step, tabs) | Separate page                       |
| **Detail/View**                                   | Separate page                       |
| **Delete**                                        | ConfirmPopover (existing component) |

### Toast Feedback Convention

| Scenario             | Feedback                                               |
| -------------------- | ------------------------------------------------------ |
| Mutation success     | Toast (sonner) — short confirmation message            |
| Mutation error (API) | Toast with error message from `ApiError`               |
| Validation error     | Inline under form field (react-hook-form handles this) |
| Permission denied    | Redirect to `/access-denied`                           |

Toast calls go in **components**, never in hooks.

### Status Colour Convention

Property management is status-heavy. Use consistent semantic colours everywhere:

| Colour              | Meaning           | Examples                           |
| ------------------- | ----------------- | ---------------------------------- |
| Green (`success`)   | Active, positive  | Active lease, paid, occupied       |
| Red (`destructive`) | Expired, negative | Overdue, terminated, expired       |
| Yellow (`warning`)  | Attention needed  | Pending, partial payment, due soon |
| Blue (`info`)       | Neutral state     | Draft, scheduled, in review        |
| Muted (`muted`)     | Inactive          | Vacant, archived, inactive         |

Define these as CSS variables and use them via Badge variants or utility classes. Same colour must mean the same thing across the entire app.

### Sidebar Navigation Groups

As features grow, sidebar items are organised into groups using `SidebarGroup` + `SidebarGroupLabel`:

- **Core:** Dashboard, Properties, Tenants, Leases
- **Finance:** Invoices, Payments, Reports
- **Settings:** Organisation, Members, Roles

Each group has a translated label. Items within a group are permission-gated individually.

### Section Sub-Navigation

Multi-page sections (like Settings) must have their own sub-navigation within the content area — a vertical nav sidebar or horizontal tabs. Users should see all available sections at a glance without relying on URL knowledge. Use `Tabs` (line variant) for 2–5 sections, a content-area sidebar for more.

### Command Palette

Global command palette triggered by `Cmd+K` (`Ctrl+K` on Windows/Linux). Uses the existing `Command`/`CommandDialog` components and `useHotkeys` hook. Provides:

- Quick navigation to any page
- Common actions (create property, invite member)
- Search across entities (future)

### Animation & Micro-interaction

- **Button loading:** Replace button content with a spinner icon during mutation `isPending`. Disable the button.
- **Form submit:** Disable submit button + show spinner until mutation resolves
- **Overlay components:** Keep existing 100ms open/close transitions (consistent across all overlays)
- **Route transitions:** Rely on `nextjs-toploader` — no custom page transitions needed
- **List rendering:** Subtle `animate-in fade-in` on first paint is acceptable, but not required. Do not over-animate.

---

## Data Patterns

### React Query Hook Pattern

- Hooks handle cache invalidation ONLY — no toasts, no modals
- Cross-feature invalidation is allowed
- `enabled: !!orgId` prevents queries from firing before org is loaded
- Use `isPending` (not `isLoading`) for loading checks — when `enabled` is false, `isLoading` is false but `isPending` is true, so `isLoading` skips the skeleton and can flash error states
- Toast calls go in COMPONENTS (not hooks)

### Form Schema Pattern

- `z.input<typeof schema>` → form state type (strings for inputs)
- `z.output<typeof schema>` → API payload type (nulls for empty optional fields)
- All nullable/optional helpers use `z.transform()`, NEVER `z.preprocess()`

### `Form<T>` Component (`src/components/ui/form.tsx`)

Custom wrapper around react-hook-form. Use this instead of raw `useForm` + `<form>`:

```tsx
<Form<MyFormValues>
  validationSchema={mySchema}
  resetValues={dataFromApi} // auto-resets form when data changes (stable reference check)
  onSubmit={handleSubmit}
>
  {(methods) => (
    <>
      <FormField label="Name" name="name" methods={methods} />
      <Button type="submit" disabled={methods.formState.isSubmitting}>
        Save
      </Button>
    </>
  )}
</Form>
```

- `validationSchema` — Zod schema, auto-wired to `zodResolver`
- `resetValues` — when API data loads/changes, form resets to match (uses `JSON.stringify` comparison to avoid infinite loops)
- `children` is a render function that receives `methods` (full `UseFormReturn`)

### `FormField<T>` Component (`src/components/shared/form-field.tsx`)

Reusable wrapper for Label + Input + error message. Reduces form boilerplate:

- Pass `methods` and `name` — it handles `register()` and error display automatically
- Pass `children` to replace the default `<Input>` with a custom control (picker, textarea, etc.)

### Picker Components (`src/components/shared/`)

Reusable searchable dropdowns: `CountryPicker`, `CurrencyPicker`, `TimezonePicker`, `PhoneInput`. All follow the same pattern:

- Props: `value`, `onChange`, `placeholder?`, `disabled?`, `id?`
- Use `Command` + `Popover` (shadcn/ui) for searchable list
- Use `usePreserveScroll()` hook on `onOpenChange` to prevent scroll jumping (Base UI FloatingFocusManager issue)
- Use `type="button"` on trigger to prevent form submission
- Labels come from `common.*` translations

When building a new picker, copy the `CountryPicker` pattern.

### API Error Handling (`src/lib/parse-api-error.ts`)

Use `getErrorMessage(error, fallbackTranslation)` to extract human-readable messages from `ApiError` in mutation `onError` handlers. It handles JSON-stringified error envelopes (e.g., Clerk errors with nested `errors[].long_message`).

```tsx
onError: (error) => {
  toast.error(getErrorMessage(error, t('errorMessage')));
};
```

### `useUnsavedChanges` Hook (`src/hooks/use-unsaved-changes.ts`)

Warns user before losing form changes. Pass `isDirty` from react-hook-form:

```tsx
useUnsavedChanges(methods.formState.isDirty);
```

**Current limitation:** Only intercepts hard navigation (`beforeunload` — tab close, browser refresh, URL change). Does **not** intercept Next.js soft navigation (sidebar clicks, `<Link>` navigation). Soft nav interception is not yet implemented.

### Money Formatting

Money is stored as minor units (cents/pence) in `BIGINT`. For display:

- Use a shared formatter utility with `Intl.NumberFormat` — never divide by 100 inline in components
- Column/property suffix: `*Minor` (e.g., `rentMinor`, `balanceMinor`)
- Currency code comes from the organisation's settings, never hardcoded

### Date & Time Formatting

- Always use `useFormatter()` from `next-intl` for date/time display in client components
- Use `format.dateTime()` from `next-intl` in server components
- Never use `toLocaleDateString()`, `moment()`, or hardcoded format strings like `DD/MM/YYYY`
- Relative time (e.g., "3 days ago") via `format.relativeTime()`
- No separate `FormattedDate` components — use `useFormatter().dateTime()` directly
- Consistent format presets defined in `src/lib/format-date.ts` as `DATE_PRESETS`

---

## Code Style

### Internationalization

- Messages in `messages/en.json`
- Use `Link`, `redirect`, `usePathname`, `useRouter` from `src/i18n/routing.ts` — NOT from `next/navigation` or `next/link`
- **American English everywhere** — code, UI text, translations, labels, page titles (matches parent CLAUDE.md convention)

### Translation Key Guidelines

All user-facing text lives in `messages/en.json`. Follow these conventions:

#### Structure

- **Shared keys** go under `common.*` (e.g., `common.yes`, `common.cancel`, `common.table.rowsPerPage`)
- **Feature keys** go under their own namespace (e.g., `members.*`, `roles.*`, `settings.organization.*`)
- **Layout keys** go under `layout.*` (sidebar, header, profile)
- **Page titles** go under `pages.*`
- **Error pages** go under `errorPages.*`

#### Naming

- Use camelCase for key names
- Group related keys with dot notation (e.g., `common.table.firstPage`)
- Use ICU message format for plurals: `"{count, plural, one {# item} other {# items}}"`
- Use interpolation for dynamic values: `"Page {page} of {total}"`

#### Spelling

- **Key names** (code layer): American English (`organization`, `color`)
- **Key values** (UI text): American English (`Organization`, `Color`)

#### Reusable components

- Generic components (DataTable, ConfirmPopover, PhoneInput) should use `common.*` translations internally
- Feature-specific text should be passed as props from the calling component, which reads from its own namespace

#### Message Hygiene

- **No duplicate keys.** Before adding a new translation key, check if an existing key already covers the same text. Reuse `pages.*`, `common.*`, or existing feature keys instead of creating parallel entries.
- **No orphan keys.** When removing a component or feature, remove its translation keys from `en.json` too.
- **Keep it flat where possible.** Only nest when grouping genuinely related keys (e.g., `common.table.*`). Avoid deep nesting for the sake of organisation.

### Icons

Use `lucide-react` for all icons.

### ESLint & Prettier

- `simple-import-sort` auto-sorts imports
- `unused-imports/no-unused-imports` auto-removes unused imports
- `@typescript-eslint/consistent-type-imports` enforces `type` keyword
- `no-restricted-imports` blocks `@clerk/nextjs` in feature code
- Prettier: single quotes, trailing commas (es5), 2-space indent

---

## DO and DON'T

### DO

- Use `cn()` from `@/lib/utils` for conditional class names
- Use `useSession()` for `clerkOrgId` in query keys
- Use `orgKeys.scope(clerkOrgId, 'resource')` for all feature query keys
- Use translation keys (`useTranslations` / `getTranslations`) for **every** user-visible string — labels, placeholders, aria-labels, error messages, empty states, button text, toasts, everything
- Type mutations as `useMutation<TData, ApiError, TVariables>`
- Use `render` prop (not `asChild`) with shadcn/ui v4 components
- Put toast calls in components, cache invalidation in hooks
- Export `metadata` or `generateMetadata` from every page
- Create `loading.tsx` with skeleton UI for every route group
- Create `not-found.tsx` for every dynamic route segment
- Use `useFormatter()` from `next-intl` for all date/time/number formatting
- Use semantic status colours consistently (green=active, red=destructive, yellow=warning, blue=info, muted=inactive)
- Show rich empty states (icon + title + description + CTA) when lists have zero items
- Use route constants from `@/config/routes` for all navigation — never hardcode URL path strings. Use `routes` (server-side `redirect()` — includes locale) and `paths` (client-side `router.push()` / `Link href` — locale handled by next-intl automatically)
- Use `PERMISSIONS.feature.action` from `@/config/permissions` — never inline permission strings
- Use `Form<T>` component for all forms — never use raw `useForm` + `<form>`
- Use `FormField<T>` for simple form fields — never manually write Label + Input + error boilerplate
- Use `getErrorMessage(error, t('fallback'))` in mutation `onError` — never access `error.detail` directly
- Use `usePreserveScroll()` on any Popover/Command picker's `onOpenChange`
- Use `useUnsavedChanges(isDirty)` in forms that edit existing data

### DON'T

- Import `@clerk/nextjs` in feature code (use `useSession()` or `useMe()`)
- Use `z.preprocess()` — always use `z.transform()`
- Put feature-specific types in `src/types/`
- **Hardcode ANY text** in components, pages, hooks, or utilities — every user-visible string must come from `messages/en.json` via `useTranslations` (client) or `getTranslations` (server). This includes button labels, placeholders, aria-labels, error messages, empty states, tooltips, and toast messages. The only exception is the brand name "Propentro" when used as a proper noun (e.g., metadata).
- Use `next/link` or `next/navigation` (use `src/i18n/routing.ts` exports)
- Use `asChild` prop — use `render` prop instead (shadcn v4 / Base UI)
- Use meaningless fallback values (`?? 'Propentro'`, `?? 'P'`, `?? '?'`, `|| 'U'`) — if data is guaranteed by auth guards, providers, or API contracts, access it directly without fallbacks. Use early returns or loading states instead of hiding broken state behind placeholder strings. `??` for null coalescing in data transforms (e.g., `data.field ?? ''` for form defaults) is fine.
- Show blank pages — always provide `loading.tsx` skeleton or inline loading state
- Use `toLocaleDateString()`, `moment()`, or hardcoded date formats — use `next-intl` formatters
- Divide minor units by 100 inline — use the shared money formatter
- Use inconsistent status colours — green means active everywhere, red means destructive everywhere
- Put components, hooks, or utilities inside `src/app/` route folders — route folders are for routing files only (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`)
- Render `<h1>` or page titles inside feature components — use `PageHeader` in `page.tsx` or `layout.tsx` only
- Use the `breadcrumb` prop on `PageHeader` — breadcrumbs are auto-generated in `AppHeader`/`AdminHeader`
