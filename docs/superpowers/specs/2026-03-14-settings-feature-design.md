# Settings Feature — Design Spec

**Date:** 2026-03-14
**Status:** Approved
**Scope:** Organisation Settings, Members, Roles & Permissions

---

## 1. Overview

The Settings feature provides organisation administrators with tools to manage their organisation profile, team members, and role-based access control. It is the first major admin area in the Propentro app.

### Goals

- Provide a clean, grouped settings experience accessible from the sidebar
- Permission-gate every section (read gates the page, write gates actions)
- Follow existing app conventions (shadcn/ui v4, vertical slice architecture, i18n, React Query)
- Production-grade UX: loading skeletons, error handling, empty states, toast feedback, dirty state tracking

---

## 2. Navigation & Layout

### Sidebar

- Single "Settings" link under a **Settings** sidebar group (gear icon)
- Clicking navigates to `/settings/organization` (default tab)
- Link visible only if user has at least one settings-related `read` permission (`org:settings:read`, `org:members:read`, or `org:roles:read`)

### Settings Layout

```
PageHeader ("Settings" + breadcrumb)
  → Horizontal tab navigation (settings-nav.tsx)
    → Content area (per-section)
```

- Each tab has its own URL: `/settings/organization`, `/settings/members`, `/settings/roles`
- Tabs are permission-gated: only visible if user has the corresponding `read` permission
- `/settings` redirects to the first accessible tab
- Existing `settings-nav.tsx` component is reused and enhanced with permission filtering

### Permission Constants

Centralise permission strings to avoid repetition across pages, sidebar, and settings-nav:

```ts
// src/config/permissions.ts
export const PERMISSIONS = {
  settings: { read: 'org:settings:read', update: 'org:settings:update' },
  members: { read: 'org:members:read', manage: 'org:members:manage' },
  roles: { read: 'org:roles:read', manage: 'org:roles:manage' },
} as const satisfies Record<string, Record<string, Permission>>;
```

The `Permission` type in `src/types/user.types.ts` remains unchanged (string literal union). The constants object provides a single source of truth for string values used in `requirePermission()`, `hasPermission()`, sidebar gating, and tab filtering.

### Permission Format

The `org:<resource>:<action>` format is industry standard (Clerk, Auth0, WorkOS pattern). It extends naturally for future resources:

```
org:properties:read / manage
org:tenants:read / manage
org:leases:read / manage
org:invoices:read / manage
org:reports:read
```

---

## 3. Organisation Settings

### URL

`/[locale]/[orgSlug]/settings/organization`

### Permissions

- **Page gate:** `org:settings:read`
- **Write prop:** `org:settings:update` → passed as `canEdit` to form component

### Layout

Single-page form with 5 card sections, max-width 720px:

| Section                  | Fields                                                            | Grid                             |
| ------------------------ | ----------------------------------------------------------------- | -------------------------------- |
| **Organisation Profile** | name\*                                                            | 1-col                            |
| **Primary Contact**      | contactName, contactEmail, contactPhone                           | 2-col (phone full-width)         |
| **Address**              | addressLine1, addressLine2, city, region, postalCode, countryCode | 2-col (address lines full-width) |
| **Legal & Tax**          | legalName, taxNumber, taxCountry                                  | 2-col (legalName full-width)     |
| **Regional Settings**    | currencyCode, timezone                                            | 2-col                            |

Each card has a title and a one-line description.

### Form Behaviour

- **Single form, single save:** All sections are one `react-hook-form` form with one "Save Changes" button at the bottom
- **Dirty state tracking:** Save button disabled until `formState.isDirty` is true
- **Unsaved changes guard:** `beforeunload` event + warn on tab navigation when form is dirty
- **Cancel button:** Resets form to last saved state via `form.reset()`
- **Save loading:** Save button shows spinner + disabled, entire form disabled during mutation
- **Searchable combobox:** Country, Currency, Timezone fields use Command-based combobox (lists too long for regular select)

### Read-Only Mode

When user lacks `org:settings:update`:

- All inputs rendered as disabled
- Banner at top: "You do not have permission to edit these settings..."
- Save and Cancel buttons hidden

### UX States

| State      | Behaviour                                                      |
| ---------- | -------------------------------------------------------------- |
| Loading    | Skeleton UI: 5 card skeletons matching section layout          |
| Idle       | Form populated with current data, Save disabled                |
| Dirty      | Save enabled, Cancel visible                                   |
| Saving     | Save button spinner + disabled, form disabled                  |
| Success    | Toast: "Organisation settings saved." Form reset to new values |
| Error      | Toast: API error message. Form stays editable                  |
| Validation | Inline field errors under each field                           |
| Read-only  | All inputs disabled + banner, no Save/Cancel                   |

### Existing Assets

- Schema: `src/features/settings/organization/validators/org-settings.schema.ts`
- Hooks: `src/features/settings/organization/hooks/use-org-settings.ts`
- i18n: `settings.organization.*` in `messages/en.json`

---

## 4. Members

### URL

`/[locale]/[orgSlug]/settings/members`

### Permissions

- **Page gate:** `org:members:read`
- **Write prop:** `org:members:manage` → passed as `canManage` to members component

### Layout

DataTable with toolbar, using existing `data-table.tsx` and `data-table-pagination.tsx` components.

### Toolbar

- **Search:** Debounced text input (searches by name/email)
- **Status filter:** Dropdown (All, Active, Deactivated)
- **Role filter:** Dropdown (populated from roles query)
- **Invite Member button:** Primary action, visible only when `canManage`

### Table Columns

| Column      | Content                                                      |
| ----------- | ------------------------------------------------------------ |
| **Name**    | Avatar (initials, colour from name hash) + full name + email |
| **Role**    | Badge(s). If 3+ roles, show first 2 + "+N more" tooltip      |
| **Joined**  | Formatted date via `useFormatter()` from next-intl           |
| **Status**  | Badge: green "Active" / red "Deactivated"                    |
| **Actions** | ⋯ dropdown menu (only when `canManage`)                      |

### Row Actions (⋯ menu)

- **Edit Roles** → Opens Edit Roles sheet
- **Deactivate** → ConfirmPopover (for active members)
- **Reactivate** → Direct action with toast (for deactivated members)

Deactivated rows render at reduced opacity (0.6).

### Invite Member — Sheet

Side panel with:

- Email field (required)
- Role select dropdown (required, populated from roles query)
- Cancel + "Invite Member" buttons

### Edit Member Roles — Sheet

Side panel with:

- Member name + email display
- Checkbox list of all available roles (min 1 required)
- Cancel + "Save Roles" buttons

### Empty State

When no members exist:

- Users icon (lucide-react)
- Title: "No members yet"
- Description: "Invite team members to collaborate on managing your properties"
- CTA: "Invite Member" button (only when `canManage`)

### UX States

| State              | Behaviour                                            |
| ------------------ | ---------------------------------------------------- |
| Loading            | Table skeleton (header + 5 shimmer rows)             |
| Empty              | Rich empty state with invite CTA                     |
| Invite pending     | Sheet submit button → spinner + disabled             |
| Invite success     | Toast + sheet closes + table refreshes               |
| Invite error       | Toast with API error, sheet stays open               |
| Edit roles pending | Sheet submit button → spinner + disabled             |
| Edit roles success | Toast + sheet closes + table refreshes               |
| Deactivate         | ConfirmPopover → toast → table refreshes             |
| Reactivate         | Direct action → toast → table refreshes              |
| Read-only          | Invite button hidden, ⋯ menus hidden, table viewable |

### Existing Assets

- Types: `src/features/settings/members/types/index.ts`
- Schema: `src/features/settings/members/validators/create-user.schema.ts`
- Hooks: `src/features/settings/members/hooks/use-members.ts`
- i18n: `members.*` in `messages/en.json`

---

## 5. Roles & Permissions

### URL

`/[locale]/[orgSlug]/settings/roles`

### Permissions

- **Page gate:** `org:roles:read`
- **Write prop:** `org:roles:manage` → passed as `canManage` to roles component

### Layout

Card grid (2 columns, responsive to 1 on mobile). Not a table — roles are few (typically 3–8) and cards display name + description + stats better.

### Role Card Content

| Element              | Detail                                                 |
| -------------------- | ------------------------------------------------------ |
| **Name**             | Role name (e.g., "Property Manager")                   |
| **System badge**     | "System" badge for system roles (Owner, Admin)         |
| **Description**      | One-line role description                              |
| **Member count**     | "N members" (pluralised via ICU)                       |
| **Permission count** | "N permissions" (pluralised via ICU)                   |
| **Actions**          | System roles: lock icon, no menu. Custom roles: ⋯ menu |

### Row Actions (⋯ menu — custom roles only)

- **Edit Role** → Opens Edit Role sheet (pre-filled)
- **Delete Role** → ConfirmPopover with destructive button

System roles (Owner, Admin) show a lock icon instead of the ⋯ menu and cannot be edited or deleted.

### Create / Edit Role — Sheet (420px wide)

- **Role Name** (required)
- **Description** (optional)
- **Permissions** (required, min 1):
  - Grouped by domain (Settings, Members, Roles — future: Properties, Finance, etc.)
  - Each group has a "Select all" shortcut
  - Each permission shows code (`org:settings:read`) + human description
  - Checkbox UI

Same sheet component for create and edit — pre-filled with existing data for edit.

### Delete Role — ConfirmPopover

- Warning: "This role will be permanently deleted. Members assigned to this role will lose the associated permissions."
- Cancel + red "Delete" button

### Empty State

When no custom roles exist (system roles always exist):

- Shield icon (lucide-react)
- Title: "No custom roles"
- Description: "Create custom roles to define specific permissions for your team members"
- CTA: "Add New Role" button (only when `canManage`)

### Business Rules (API-enforced)

- **Last Owner protection:** The last member with the Owner system role cannot be deactivated, have their role removed, or be deleted. API returns 400/409. Frontend displays the error via toast.
- **System role immutability:** System roles (Owner, Admin) cannot be edited or deleted. API enforces this. Frontend hides action menus for system roles.

### UX States

| State               | Behaviour                                             |
| ------------------- | ----------------------------------------------------- |
| Loading             | 4 skeleton cards in 2x2 grid                          |
| Empty               | Rich empty state with "Add New Role" CTA              |
| Create/Edit pending | Submit button → spinner + disabled, form disabled     |
| Create success      | Toast + sheet closes + card grid refreshes            |
| Edit success        | Toast + sheet closes + card grid refreshes            |
| Delete success      | Toast + card removed + members query invalidated      |
| Error               | Toast with API error message                          |
| Read-only           | "Add New Role" hidden, ⋯ menus hidden, cards viewable |

### Existing Assets

- Types: `src/features/settings/roles/types/index.ts`
- Schema: `src/features/settings/roles/validators/role.schema.ts`
- Hooks: `src/features/settings/roles/hooks/use-roles.ts`
- i18n: `roles.*` in `messages/en.json`

---

## 6. Shared Patterns

### Toast Feedback

All toast calls go in **components**, never in hooks. Hooks handle cache invalidation only.

| Scenario         | Feedback                             |
| ---------------- | ------------------------------------ |
| Mutation success | Sonner toast — short confirmation    |
| Mutation error   | Sonner toast with `ApiError` message |
| Validation error | Inline under field (react-hook-form) |

### Loading States

- Organisation: 5 card skeletons
- Members: Table header + 5 shimmer rows
- Roles: 4 card skeletons in 2x2 grid

### Permission Gating (Two-Tier)

1. **Read gate (server, page.tsx):** `requirePermission()` — blocks the entire page, redirects to `/access-denied`
2. **Write prop (server, page.tsx):** `hasPermission()` — passed as `canManage`/`canEdit` prop to hide write actions

### Form Pattern

- `react-hook-form` + `zod` (v4) + `@hookform/resolvers`
- `z.input<typeof schema>` for form state, `z.output<typeof schema>` for API payload
- All nullable/optional helpers use `z.transform()`, never `z.preprocess()`

### i18n

All user-facing text comes from `messages/en.json`. No hardcoded strings. Key names in American English, values in British English.

---

## 7. Out of Scope

- Organisation logo/image upload
- Member profile editing (handled by Clerk)
- Audit log for settings changes
- Billing settings
- Email notification preferences
- Frontend "last owner" protection (API-only for MVP, optional UI enhancement later)

---

## 8. File Structure (New Files)

```
src/
  config/
    permissions.ts                          → Permission constants

  features/settings/
    components/
      settings-nav.tsx                      → Enhanced with permission filtering (existing)

    organization/
      components/
        org-settings-form.tsx               → Main form with 5 card sections
        org-settings-skeleton.tsx           → Loading skeleton

    members/
      components/
        members-content.tsx                 → Main content (toolbar + table + sheets)
        members-table.tsx                   → Table column definitions
        members-toolbar.tsx                 → Search + filters
        invite-member-sheet.tsx             → Invite form in sheet
        edit-member-roles-sheet.tsx         → Role checkbox list in sheet
        members-empty-state.tsx             → Empty state
        members-skeleton.tsx                → Loading skeleton

    roles/
      components/
        roles-content.tsx                   → Main content (toolbar + card grid + sheet)
        role-card.tsx                       → Individual role card
        role-form-sheet.tsx                 → Create/edit form in sheet
        roles-empty-state.tsx               → Empty state
        roles-skeleton.tsx                  → Loading skeleton

  components/layout/
    app-sidebar.tsx                         → Add Settings link (existing, modified)
```
