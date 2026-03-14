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

## Data Flow

### API Proxy Architecture

```
Browser → apiClient (src/lib/api-client.ts) → /api/* route handlers → proxyRequest() → .NET backend
```

### Query Key System

All server data is org-scoped. `orgKeys` from `src/lib/query-keys.ts` guarantees every query key includes the orgId.

### Auth Hooks

| Hook                     | Purpose                                                       |
| ------------------------ | ------------------------------------------------------------- |
| `useSession()`           | Returns `clerkOrgId`, `clerkUserId`, `isLoaded`, `isSignedIn` |
| `useMe()`                | Returns `CurrentUser` from React context (no fetch)           |
| `useHasPermission(perm)` | Client-side permission check from context                     |
| `useOrganizations()`     | Wraps Clerk org hooks (workspace switcher only)               |

### Server-Side Auth (`src/lib/auth.ts`)

| Function                                | Purpose                                         |
| --------------------------------------- | ----------------------------------------------- |
| `getMe()`                               | Fetches `/me` from backend, cached 5 min        |
| `getMeOrRedirect(locale)`               | Like `getMe()` but redirects to sign-in if null |
| `hasPermission(permission)`             | Returns boolean                                 |
| `requirePermission(permission, locale)` | Redirects to `/access-denied` if not allowed    |
| `revalidateUserCache()`                 | Busts the `user-me` cache tag                   |

### Clerk Abstraction Strategy

Clerk is isolated in 3 layers:

- **Layer 1 — Auth hooks** (`use-session.ts`, `use-me.ts`, `use-has-permission` in `use-me.ts`) — feature code uses these
- **Layer 2 — Auth infrastructure** (`lib/auth.ts`, `lib/proxy-request.ts`, `middleware.ts`)
- **Layer 3 — Auth UI** (`providers/auth-provider.tsx`, `hooks/use-organizations.ts`, sign-in page)

**Rule:** Feature code (`src/features/**`) NEVER imports `@clerk/nextjs` directly. ESLint enforces this.

## Feature Folder Structure

```
src/features/{domain}/{feature}/
  types/index.ts              → Feature-specific types
  validators/{feature}.schema.ts → Zod schemas + inferred types + defaults
  hooks/use-{feature}.ts      → queryOptions factory + React Query hooks
  components/                 → UI components (shadcn-based)
```

## Standard Page Template

Every authenticated page follows this pattern:

1. `requirePermission()` first — read permission as gate
2. `Promise.all` translations + write permission — parallel
3. Pass `canManage`/`canEdit` as prop to feature component
4. `PageHeader` is mandatory — consistent title + breadcrumb
5. No data fetching in pages — hooks in feature components handle data via React Query

## React Query Hook Pattern

- Hooks handle cache invalidation ONLY — no toasts, no modals
- Cross-feature invalidation is allowed
- `enabled: !!orgId` prevents queries from firing before org is loaded
- Toast calls go in COMPONENTS (not hooks)

## Form Schema Pattern

- `z.input<typeof schema>` → form state type (strings for inputs)
- `z.output<typeof schema>` → API payload type (nulls for empty optional fields)
- All nullable/optional helpers use `z.transform()`, NEVER `z.preprocess()`

## Internationalization

- Messages in `messages/en.json`
- Use `Link`, `redirect`, `usePathname`, `useRouter` from `src/i18n/routing.ts` — NOT from `next/navigation` or `next/link`
- **Code:** American English (`organization`); **UI text:** British English (`Organisation`)

## Icons

Use `lucide-react` for all icons.

## ESLint & Prettier

- `simple-import-sort` auto-sorts imports
- `unused-imports/no-unused-imports` auto-removes unused imports
- `@typescript-eslint/consistent-type-imports` enforces `type` keyword
- `no-restricted-imports` blocks `@clerk/nextjs` in feature code
- Prettier: single quotes, trailing commas (es5), 2-space indent

## DO and DON'T

### DO

- Use `cn()` from `@/lib/utils` for conditional class names
- Use `useSession()` for `clerkOrgId` in query keys
- Use `orgKeys.scope(clerkOrgId, 'resource')` for all feature query keys
- Use translation keys (`useTranslations` / `getTranslations`) for **every** user-visible string — labels, placeholders, aria-labels, error messages, empty states, button text, toasts, everything
- Type mutations as `useMutation<TData, ApiError, TVariables>`
- Use `render` prop (not `asChild`) with shadcn/ui v4 components
- Put toast calls in components, cache invalidation in hooks

### DON'T

- Import `@clerk/nextjs` in feature code (use `useSession()` or `useMe()`)
- Use `z.preprocess()` — always use `z.transform()`
- Put feature-specific types in `src/types/`
- **Hardcode ANY text** in components, pages, hooks, or utilities — every user-visible string must come from `messages/en.json` via `useTranslations` (client) or `getTranslations` (server). This includes button labels, placeholders, aria-labels, error messages, empty states, tooltips, and toast messages. The only exception is the brand name "Propentro" when used as a proper noun (e.g., metadata).
- Use `next/link` or `next/navigation` (use `src/i18n/routing.ts` exports)
- Use `asChild` prop — use `render` prop instead (shadcn v4 / Base UI)
- Use meaningless fallback values (`?? 'Propentro'`, `?? 'P'`, `?? '?'`, `|| 'U'`) — if data is guaranteed by auth guards, providers, or API contracts, access it directly without fallbacks. Use early returns or loading states instead of hiding broken state behind placeholder strings. `??` for null coalescing in data transforms (e.g., `data.field ?? ''` for form defaults) is fine.

## Translation Key Guidelines

All user-facing text lives in `messages/en.json`. Follow these conventions:

### Structure

- **Shared keys** go under `common.*` (e.g., `common.yes`, `common.cancel`, `common.table.rowsPerPage`)
- **Feature keys** go under their own namespace (e.g., `members.*`, `roles.*`, `settings.organization.*`)
- **Layout keys** go under `layout.*` (sidebar, header, profile)
- **Page titles** go under `pages.*`
- **Error pages** go under `errorPages.*`

### Naming

- Use camelCase for key names
- Group related keys with dot notation (e.g., `common.table.firstPage`)
- Use ICU message format for plurals: `"{count, plural, one {# item} other {# items}}"`
- Use interpolation for dynamic values: `"Page {page} of {total}"`

### Spelling

- **Key names** (code layer): American English (`organization`, `color`)
- **Key values** (UI text): British English (`Organisation`, `Colour`)

### Reusable components

- Generic components (DataTable, ConfirmPopover, PhoneInput) should use `common.*` translations internally
- Feature-specific text should be passed as props from the calling component, which reads from its own namespace
