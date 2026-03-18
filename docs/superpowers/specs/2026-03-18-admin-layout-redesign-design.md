# Admin Layout Redesign — Design Spec

## What

Redesign the admin (super admin) layout shell to align with the normal app layout patterns, improve the profile dropdown with preferences and workspace navigation, and clean up redundant UI elements.

## Why

The current admin layout diverges from the normal app layout in structure and capabilities. The sidebar footer duplicates user info that belongs in the header dropdown. Language/theme preferences are not accessible from the admin area at all. There is no way to navigate back to a workspace without manually changing the URL.

## Scope

This spec covers the **admin layout shell only** — sidebar, header, and profile dropdown. It does NOT cover:

- Admin dashboard content/metrics (no endpoints exist yet)
- New admin features or pages
- Changes to the normal (org-scoped) app layout

---

## Current State

### Admin Sidebar (`src/features/admin/components/admin-sidebar.tsx`)

- **Header:** Static "PA" square icon + "Platform Admin" text
- **Nav:** Dashboard, Organizations, Users, Invites
- **Footer:** `AdminProfile` component showing avatar (initials), display name, and admin role

### Admin Header (`src/features/admin/components/admin-header.tsx`)

- **Left:** SidebarTrigger + separator + breadcrumbs
- **Right:** `AdminUserMenu` — avatar button opening a dropdown with name/email + sign out

### Admin User Menu (`src/features/admin/components/admin-user-menu.tsx`)

- Dropdown trigger: ghost button with initials avatar (no profile photo)
- Dropdown content: user info label (initials avatar + name + email) + sign out button
- Uses `useAdminMe()` hook for data, `useClerk()` for sign out

---

## Proposed Changes

### 1. Sidebar Header — Brand + Admin Badge

**Current:** "PA" icon + "Platform Admin" text
**Proposed:** "Propentro" brand name + small "Admin" badge

The sidebar header mirrors the normal app's pattern where the org name + logo sits in the header. In admin context, the brand name "Propentro" replaces the org name, and a subtle badge indicates the admin context.

**Collapsed state:** Only the "PA" (or "P") icon is visible — badge hides via `group-data-[collapsible=icon]:hidden`.

### 2. Sidebar Footer — Remove

**Current:** `AdminProfile` component with avatar, name, and role
**Proposed:** Empty — remove the `SidebarFooter` entirely (or keep the element for structural consistency but render nothing)

**Rationale:** Profile information moves to the header dropdown. Showing it in both places is redundant.

### 3. Sidebar Nav — No Changes

Nav items remain: Dashboard, Organizations, Users, Invites. No workspace switcher in the sidebar.

### 4. Admin Header — No Search

**Current:** SidebarTrigger + breadcrumbs + AdminUserMenu
**Proposed:** Same structure, no search button added. The normal app has a `⌘K` search button; the admin area does not need one since list pages have their own table filters.

### 5. Profile Dropdown — Enriched

**Current:** Name + email + sign out
**Proposed:** Structured into four sections:

#### Section 1: User Info (non-interactive)

- Avatar (initials-based, rounded-lg)
- Display name (bold)
- Email (muted, truncated)
- Admin role badge (small colored badge showing e.g., "Super Admin")

#### Section 2: Workspace Navigation

- **"Select workspace"** menu item with building icon
- `onClick`: navigates to `/select-workspace` using next-intl router
- This leaves the admin area entirely and takes the user to the workspace picker

#### Section 3: Preferences

- **Language** — dropdown menu sub-trigger showing current language (e.g., "English"), opens submenu with available locales
- **Theme** — dropdown menu sub-trigger showing current theme (e.g., "System"), opens submenu with Light / Dark / System options

Implementation notes:

- Language switching: use `useRouter()` and `usePathname()` from `@/i18n/routing` to navigate to the same path with a different locale
- Theme switching: use `useTheme()` from `next-themes` (already in the provider stack)
- Use `DropdownMenuSub` + `DropdownMenuSubTrigger` + `DropdownMenuSubContent` for submenus

#### Section 4: Sign Out

- Sign out button with door/logout icon
- Uses `useClerk().signOut()` (same as current)

#### Dropdown Separator Pattern

```
[ User info: avatar + name + email + role badge ]
─────────────────────────────
[ Select workspace                               ]
─────────────────────────────
[ Language                            English  › ]
[ Theme                               System   › ]
─────────────────────────────
[ Sign out                                       ]
```

---

## Component Changes Summary

| Component                   | Action    | Details                                                                         |
| --------------------------- | --------- | ------------------------------------------------------------------------------- |
| `admin-sidebar.tsx`         | Modify    | Replace header content (brand + badge), remove `SidebarFooter` / `AdminProfile` |
| `admin-header.tsx`          | No change | Structure stays the same                                                        |
| `admin-user-menu.tsx`       | Rewrite   | Add workspace nav, language/theme submenus, role badge                          |
| `AdminProfile` (in sidebar) | Delete    | No longer rendered anywhere                                                     |

## New Dependencies

None. All required components already exist:

- `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent` — shadcn/ui
- `useTheme()` — next-themes (already in provider stack)
- `useRouter()`, `usePathname()` — `@/i18n/routing`
- `useAdminMe()` — existing hook
- `paths.selectWorkspace` — existing route constant

## Translation Keys

New keys needed under `admin.userMenu` (or similar namespace):

| Key               | Value                                  |
| ----------------- | -------------------------------------- |
| `selectWorkspace` | `"Select workspace"`                   |
| `language`        | `"Language"`                           |
| `theme`           | `"Theme"`                              |
| `themeLight`      | `"Light"`                              |
| `themeDark`       | `"Dark"`                               |
| `themeSystem`     | `"System"`                             |
| `signOut`         | `"Sign out"`                           |
| `roleBadge`       | `"{role}"` (or use raw value from API) |

Note: Some keys may already exist under `layout.profile` or `common` — reuse where possible instead of duplicating.

## Out of Scope

- Admin dashboard content/metrics (separate spec, needs backend endpoints)
- Global search (`⌘K`) in admin area
- Changes to the normal app layout or its components
- Mobile-specific adaptations (sidebar already handles collapse)
- Profile photo support in admin (API returns initials only via `useAdminMe`)
