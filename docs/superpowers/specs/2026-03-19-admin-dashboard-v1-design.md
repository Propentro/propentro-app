# Admin Dashboard v1.0.0 — Design Spec

## Overview

Audit, harden, and polish the existing admin dashboard to production-ready v1.0.0 quality. No new features — focus on consistency, completeness, and best-practice UX patterns.

## Context

- **User:** Single admin (founder), designed for future team expansion (B/C)
- **Philosophy:** Pragmatic, YAGNI, platform ops only (business logic stays in org-scoped dashboard)
- **Access control:** Clerk `super_admin` system role — no admin-specific permission system in v1.0.0
- **Approach:** Audit & Harden — review every page, fix inconsistencies, add missing states, enforce patterns

## Scope

### In Scope

- Organizations — full CRUD + deactivate/reactivate + hard delete (GDPR) + all DB fields editable
- Users — list/detail + deactivate/reactivate + hard delete (GDPR), read-only info (SSO source)
- Invites — platform-wide list + cancel, org-level invite
- Members — org detail tab: invite, remove, deactivate/reactivate membership
- Hub page → redirect to organizations (no dashboard overview)
- Enforce all 3 UX patterns: two-column section forms, entity header + tabs, URL-synced list pages

### Out of Scope (Conscious Decisions)

- Dashboard/overview metrics — not needed yet
- User create — invite-only by design
- User edit — SSO is source of truth (firstName/lastName come from auth provider)
- Bulk operations — not needed yet
- Advanced search/filters — current search + status filter is sufficient
- Admin role/permission system — not needed until team expansion
- Org role management — org owner's responsibility, not admin
- Activity/audit log — not needed yet
- User activity info — available in Clerk

## Prerequisites / Dependencies

### Backend API Changes Required

The following fields are in the DB but NOT yet in the admin API response/request contracts. Backend changes are needed before the frontend can use them:

**`AdminOrganizationResponse`** — needs to return:
- `addressLine1`, `addressLine2`, `city`, `region`, `postalCode`, `countryCode`
- `legalName`, `taxNumber`, `taxCountry`

**`UpdateOrganizationRequest`** — needs to accept:
- `slug` (currently not updatable via admin)
- `addressLine1`, `addressLine2`, `city`, `region`, `postalCode`, `countryCode`
- `legalName`, `taxNumber`, `taxCountry`

**`UserOrganizationInfo`** (in admin user detail response) — needs to return:
- `status` (membership status from `organization_users`)
- `joinedAt` (from `organization_users.created_at`)

> **Note:** Verify the current backend contracts before starting frontend work. If fields already exist in the backend but are missing from the frontend types, only frontend changes are needed.

## Pages

### 1. `/admin` — Hub (Redirect)

Redirects to `/admin/organizations`. No content rendered.

### 2. `/admin/organizations` — Organizations List

**Layout:** Standard list page pattern

| Element | Detail |
|---|---|
| Search | By name or slug |
| Filter | Status: All / Active / Inactive |
| Create | "Create Organization" button → dialog |
| Table columns | Name, Slug, Org Status (badge), Member Count, Created At |
| Row click | Navigate to organization detail |
| Sorting | Name, Created At |
| Pagination | Default 25, URL-synced via `useListParams` |
| Empty state | Icon + title + description + "Create Organization" CTA |

**Delta from current:** Page size changes from 10 to 25. Status badge changes from `destructive` (red) for inactive to `outline` (muted). Full row click instead of name-column-only link.

### 3. `/admin/organizations/[id]` — Organization Detail

**Layout:** Entity header + tabs

**Delta from current:** Major restructure. Current page has minimal header (slug + badge) + tabs (info/members/invites) + danger zone at bottom. Target adds a full entity header component, renames `?tab=info` to `?tab=details`, restructures the info form to two-column section layout, adds missing DB fields, moves deactivate/reactivate from danger zone to entity header.

#### Entity Header

- **Name:** Organization name
- **Status badge:** Org Status — Active (`default` variant, green) / Inactive (`outline` variant, muted)
- **Key identifiers:** `public_id` · `slug` · `currencyCode` · `timezone` (muted text below name)
- **Quick action:** Deactivate / Reactivate button (toggles based on current `isActive`)
- **Back link:** ← Back to Organizations

#### Tab: Details (`?tab=details`)

**Layout:** Two-column section layout (`max-w-4xl`)

**Section: General**
- `name` (text, required)
- `slug` (text, required) — note: changing slug may affect Clerk org sync, add validation warning

**Section: Contact**
- `contactName` (text)
- `contactEmail` (email)
- `contactPhone` (phone input — use `PhoneInput` component)

**Section: Address**
- `addressLine1` (text)
- `addressLine2` (text)
- `city` (text)
- `region` (text)
- `postalCode` (text)
- `countryCode` (country picker — use `CountryPicker` component)

**Section: Legal & Tax**
- `legalName` (text)
- `taxNumber` (text)
- `taxCountry` (country picker)

**Section: Regional Settings**
- `currencyCode` (currency picker — use `CurrencyPicker` component)
- `timezone` (timezone picker — use `TimezonePicker` component)

Single save button at bottom of form (all sections save together).

**Danger Zone** (below form sections, same two-column layout, `border-destructive` card):
- Hard delete organization (GDPR) — button only enabled when org `isActive === false`
- Uses existing confirmation pattern (type entity name to confirm)
- After successful delete → redirect to organizations list

#### Tab: Members (`?tab=members`)

| Column | Detail |
|---|---|
| Name | First + last name |
| Email | User email |
| Role(s) | Badge(s) for each role |
| Membership Status | Active (`default` badge) / Deactivated (`outline` badge) — from `organization_users` |
| Joined At | Relative time via `useFormatter().relativeTime()` |

**Actions:**
- "Invite User" button → dialog (email + role selection)
- Row actions dropdown: Deactivate/Reactivate membership, Remove from org (with confirmation)

#### Tab: Invites (`?tab=invites`)

| Column | Detail |
|---|---|
| Email | Invitee email |
| Role | Role name badge |
| Invite Status | Pending (`warning` badge) / Accepted (`default` badge) / Expired (`outline` badge) / Canceled (`outline` badge) |
| Invited By | Inviter name |
| Expires At | Relative time |
| Created At | Relative time |

**Actions:**
- Row action: Cancel invite (pending only, with confirmation)

### 4. `/admin/users` — Users List

**Layout:** Standard list page pattern

| Element | Detail |
|---|---|
| Search | By name or email |
| Filter | Status: All / Active / Inactive |
| Table columns | Name, Email, User Status (badge), Organization Count, Created At |
| Row click | Navigate to user detail |
| Sorting | Name, Email, Created At |
| Pagination | Default 25, URL-synced via `useListParams` |
| Empty state | Icon + title + description |

**Delta from current:** Page size changes from 10 to 25. Status badge changes from `destructive` to `outline` for inactive. Full row click.

### 5. `/admin/users/[id]` — User Detail

**Layout:** Entity header + tabs

**Delta from current:** Major restructure. Current page is a flat layout with inline user info form (editable firstName/lastName) + organizations table + deactivate/delete section. Target restructures to entity header + tabs, removes edit form (SSO source of truth), adds Danger Zone with two-step delete.

#### Entity Header

- **Name:** First + last name
- **Status badge:** User Status — Active (`default` variant) / Inactive (`outline` variant)
- **Key identifiers:** `public_id` · `email` (muted text below name)
- **Quick action:** Deactivate / Reactivate button
- **Back link:** ← Back to Users

#### Tab: Details (`?tab=details`)

**Read-only info display** (not a form — SSO is source of truth, remove existing edit form):
- Email, First Name, Last Name, Created At
- Display as a simple key-value list or description list, not form fields

**Danger Zone** (below info, `border-destructive` card):
- Hard delete user (GDPR) — button only enabled when user `isActive === false`
- Requires confirmation (type email to confirm)
- After successful delete → redirect to users list

#### Tab: Organizations (`?tab=organizations`)

| Column | Detail |
|---|---|
| Organization Name | Link to org detail page |
| Role(s) | Badge(s) |
| Membership Status | Active (`default` badge) / Deactivated (`outline` badge) |
| Joined At | Relative time |

Row click navigates to the organization detail page.

### 6. `/admin/invites` — Invites List (Platform-wide)

**Layout:** Standard list page pattern

| Element | Detail |
|---|---|
| Search | By email |
| Filter | Status: All / Pending / Accepted / Expired / Canceled |
| Table columns | Email, Organization Name (link to org), Role, Invite Status (badge), Invited By, Expires At, Created At |
| Row actions | Cancel (pending only) |
| Sorting | Created At, Expires At |
| Pagination | Default 25, URL-synced via `useListParams` |
| Empty state | Icon + title + description |

**Delta from current:** Page size changes from 10 to 25. Added "Expired" to status filter. Full row click where applicable.

## Status Terminology

Consistent across all tables and badges — never use bare "Status" label.

| Source | UI Label | Values | Badge Variant |
|---|---|---|---|
| `organizations.is_active` | Org Status | Active / Inactive | `default` (green) / `outline` (muted) |
| `users.is_active` | User Status | Active / Inactive | `default` (green) / `outline` (muted) |
| `organization_users.status` | Membership Status | Active / Deactivated | `default` (green) / `outline` (muted) |
| `organization_invites.status` | Invite Status | Pending / Accepted / Expired / Canceled | `warning` (yellow) / `default` (green) / `outline` (muted) / `outline` (muted) |

**Badge variant mapping:**
- `default` → green/success semantic (active, positive states)
- `warning` → yellow semantic (pending, needs attention)
- `outline` → muted/neutral (inactive, deactivated, expired, canceled)
- Never use `destructive` variant for status badges — red is reserved for destructive action buttons

## UX Patterns (Enforced)

### Detail/Settings Forms — Two-Column Section Layout

- Container: `max-w-4xl`
- Left column: section title (semibold) + short description (muted text)
- Right column: Card with form fields in responsive grid (`grid-cols-1 sm:grid-cols-2`)
- Separator between sections
- Danger Zone: same two-column layout, `border-destructive` card, always last section
- Mobile (`< md`): sections stack vertically, description on top, form card below

### Detail Pages — Entity Header + Tabs

- Entity header always visible across all tabs: name, status badge, key identifiers, quick actions
- `EntityHeader` is a reusable shared component in `src/features/admin/components/entity-header.tsx`
- Tabs for distinct content types (form, table)
- Tabs URL-synced via `nuqs` (`?tab=details` as default)
- Danger Zone renders below tab content on Details tab (not a separate tab)
- Back link above entity header navigates to parent list

### List Pages — URL-Synced State

- All filter/pagination/sort state via `useListParams` hook + `nuqs`
- Default page size: 25 (update current code from 10 to 25)
- Never `useState` for list state
- Shareable, bookmarkable, refresh-safe URLs
- Any filter change resets to page 1
- Full row click navigates to detail page (not just name column link)

### Danger Zone Rules

- Always at the bottom of the Details tab content
- Same two-column layout as form sections, with `border-destructive` card on right
- **Hard delete only** — deactivate/reactivate lives exclusively in entity header quick actions
- Hard delete button only enabled when entity is already deactivated (two-step safety)
- Confirmation required: user must type entity identifier (name or email) to confirm
- After successful delete → redirect to parent list page

## Admin Sidebar

Navigation items:
- Organizations (`/admin/organizations`)
- Users (`/admin/users`)
- Invites (`/admin/invites`)

No Dashboard item (hub redirects to organizations).

## Technical Notes

### Organization DB Fields (All Editable via Admin)

From `propentro-db/releases/v1.0.0/006_create_organizations.sql`:

| Field | Type | Admin Form Section |
|---|---|---|
| `name` | TEXT, NOT NULL | General |
| `slug` | TEXT, NOT NULL | General |
| `contact_name` | TEXT, nullable | Contact |
| `contact_email` | TEXT, nullable | Contact |
| `contact_phone` | TEXT, nullable | Contact |
| `address_line1` | TEXT, nullable | Address |
| `address_line2` | TEXT, nullable | Address |
| `city` | TEXT, nullable | Address |
| `region` | TEXT, nullable | Address |
| `postal_code` | TEXT, nullable | Address |
| `country_code` | CHAR(2), nullable | Address |
| `legal_name` | TEXT, nullable | Legal & Tax |
| `tax_number` | TEXT, nullable | Legal & Tax |
| `tax_country` | CHAR(2), nullable | Legal & Tax |
| `currency_code` | CHAR(3), NOT NULL, default EUR | Regional Settings |
| `timezone` | TEXT, NOT NULL, default UTC | Regional Settings |

Non-editable (system-managed): `id`, `public_id`, `external_id`, `auth_provider`, `is_active`, `created_at`, `updated_at`, `created_by_id`, `updated_by_id`

### Current State → Target State Delta Summary

| Page | Current | Target Changes |
|---|---|---|
| Hub | Redirects to `/admin/organizations` | No change |
| Organizations List | Table with search/status filter, pageSize=10, name-click nav, `destructive` badge for inactive | pageSize→25, full row click, `outline` badge for inactive |
| Organization Detail | Minimal header (slug+badge), tabs (info/members/invites), single-card form (6 fields), danger zone with deactivate+delete | Entity header component, tab rename `info→details`, two-column section form (17 fields), deactivate moves to header, danger zone = delete only |
| Users List | Table with search/status filter, pageSize=10, `destructive` badge for inactive | pageSize→25, full row click, `outline` badge for inactive |
| User Detail | Flat layout, editable form (firstName/lastName), orgs table (name+roles only), inline deactivate/delete | Entity header + tabs, remove edit form (read-only), add membership status + joinedAt to orgs table, danger zone with two-step delete |
| Invites List | Table with search/status filter (no expired), pageSize=10 | pageSize→25, add "Expired" filter option |

### Audit Checklist Per Page

For each of the 6 pages, verify:

1. **Loading states** — `loading.tsx` exists with skeleton matching page structure
2. **Error boundaries** — `error.tsx` exists with i18n text and retry button
3. **Not-found pages** — `not-found.tsx` for dynamic routes (`[id]`)
4. **Empty states** — icon + translated title + description + CTA (where applicable)
5. **i18n completeness** — every string comes from `messages/en.json`, no hardcoded text
6. **API error handling** — `getErrorMessage(error, t('fallback'))` in all mutation `onError`
7. **Form validation** — Zod schemas with proper error messages
8. **Confirmation dialogs** — consistent pattern for destructive actions
9. **Status badges** — correct variant per status terminology table (no `destructive` for status)
10. **Pagination** — URL-synced, default 25
11. **Sorting** — URL-synced where applicable
12. **Responsive** — mobile-friendly (forms collapse to single column, tables scroll horizontally)
13. **Accessibility** — proper aria-labels, keyboard navigation
14. **Permission gating** — admin layout checks `super_admin` role
15. **Post-delete redirect** — hard delete navigates back to list page
16. **Dates** — all use `useFormatter().relativeTime()` or `useFormatter().dateTime()`, never hardcoded formats
