# API Feature Parity & Production-Ready Polish

**Date:** 2026-03-18
**Scope:** Full API feature parity for org-scoped settings + admin panel, bug fixes, production polish
**Approach:** Infrastructure first, then parallelizable vertical slices

---

## 1. Context

### What Exists

The propentro-app frontend has working implementations for:

- **Org Settings:** GET/PATCH organization settings form
- **Members:** List, invite, edit roles, deactivate/reactivate, pending invites
- **Roles:** List, create, update, delete, permission matrix
- **Admin Organizations:** List, detail (tabs: info/members/invites), create, update, deactivate
- **Admin Users:** List, detail, deactivate, reactivate
- **Admin Invites:** Global list, cancel (from org detail), org-scoped invite
- **Admin Members:** List (in org detail), remove

### What's Broken

| #   | Issue                                               | File(s)                             | Detail                                                                                                                                                                        |
| --- | --------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Double `/v1` in ALL admin proxy routes**          | All `src/app/api/admin/**/route.ts` | Admin routes pass `/v1/admin/...` to `adminProxyRequest`, but `NEXT_PUBLIC_BASE_API_URL` already includes `/v1` → double `/v1/v1/admin/...`. Org routes correctly omit `/v1`. |
| 2   | **`checkSuperAdmin()` also double `/v1`**           | `select-workspace/page.tsx`         | `${BASE_API_URL}/v1/admin/me` → `/v1/v1/admin/me`. This function is being removed entirely (JWT check replaces it).                                                           |
| 3   | **`useDeactivateMember` uses POST**                 | `use-members.ts`                    | API expects PATCH. Proxy route `deactivate/route.ts` also exports POST — both must change.                                                                                    |
| 4   | **`useReactivateMember` uses POST**                 | `use-members.ts`                    | API expects PATCH. Proxy route `reactivate/route.ts` also exports POST — both must change.                                                                                    |
| 5   | **`useUpdateMemberRoles` wrong path**               | `use-members.ts`                    | Calls `/organizations/members/${userId}` — missing `/roles` suffix. API expects `PATCH /v1/organizations/members/{id}/roles`. Proxy route also missing.                       |
| 6   | **`useCancelInvite` (admin) uses DELETE**           | `use-admin-invites.ts`              | API expects `PATCH /admin/invites/{id}/cancel`. Proxy route exports DELETE to wrong path. Orphaned DELETE route must be removed.                                              |
| 7   | **Admin create org form — no Zod schema**           | `organizations-list.tsx`            | No validation on submit                                                                                                                                                       |
| 8   | **Admin update org form — no Zod schema**           | `organization-detail.tsx`           | No validation on submit                                                                                                                                                       |
| 9   | **`adminOrgMembersQueryOptions` wrong return type** | `use-admin-organizations.ts`        | Returns `AdminMember[]` but API returns `PagedResult<AdminMember>`                                                                                                            |
| 10  | **`adminOrgInvitesQueryOptions` wrong return type** | `use-admin-invites.ts`              | Returns `AdminInvite[]` but API returns paginated results                                                                                                                     |
| 11  | **British English in UI text**                      | `messages/en.json`                  | "Organisation" etc. should be "Organization"                                                                                                                                  |
| 12  | **CLAUDE.md contradicts parent on spelling**        | `CLAUDE.md`                         | Says "UI text: British English" but parent says American everywhere                                                                                                           |
| 13  | **`getMe()` in `auth.ts` missing `/v1`**            | `src/lib/auth.ts`                   | Calls `${BASE_API_URL}/me` — after env fix (removing `/v1`), needs `/v1/me`                                                                                                   |

### What's Missing

| Feature                            | API Endpoint                                                    | Current Frontend Status                      |
| ---------------------------------- | --------------------------------------------------------------- | -------------------------------------------- |
| Reactivate org                     | `PATCH /v1/admin/organizations/{id}/reactivate`                 | No hook, no UI, no proxy route               |
| Hard delete org                    | `DELETE /v1/admin/organizations/{id}`                           | No hook, no UI, no proxy route               |
| Hard delete user                   | `DELETE /v1/admin/users/{id}`                                   | No hook, no UI, no proxy route               |
| Admin member deactivate            | `PATCH /v1/admin/organizations/{orgId}/members/{id}/deactivate` | No hook, no UI, no proxy route               |
| Admin member reactivate            | `PATCH /v1/admin/organizations/{orgId}/members/{id}/reactivate` | No hook, no UI, no proxy route               |
| Admin invite from org detail       | `POST /v1/admin/organizations/{orgId}/invites`                  | Hook exists (`useInviteUser`), no UI         |
| Admin me profile                   | `GET /v1/admin/me`                                              | No hook, no UI, no proxy route               |
| Member detail (org-scoped)         | `GET /v1/organizations/members/{id}`                            | No hook                                      |
| `apiClient.delete` headers support | N/A                                                             | Cannot send `X-Confirm-Delete` header        |
| Proxy header forwarding            | N/A                                                             | Cannot forward `X-Confirm-Delete` to backend |
| Org member roles proxy route       | `PATCH /v1/organizations/members/{id}/roles`                    | Missing — current proxy has no `/roles` path |

### API Limitation (Out of Scope)

`AdminMemberResponse` (backend contract) does not include a `status` or `isActive` field. The admin member deactivate/reactivate endpoints exist, but the list response does not expose current status. As a result:

- Admin members table cannot show a status column
- Deactivate/reactivate actions will be shown for all members; API guards handle invalid state transitions (409 Conflict)
- This is a backend limitation — if status column is needed, `AdminMemberResponse` must be updated in propentro-api

---

## 2. Decisions

### Super Admin Check

- **Current:** `checkSuperAdmin()` makes backend call to `/v1/admin/me` (with double `/v1` bug)
- **New:** Read JWT claim `sessionClaims.metadata.systemRole === 'super_admin'`
- **Where:** `select-workspace/page.tsx` (server component), `admin/layout.tsx` (server component)
- `CurrentUser.isSystemAdmin` field removed from type — not needed, JWT claim is the source of truth
- No client-side super admin state needed — admin panel is server-layout guarded

### Spelling

- **American English everywhere** — code, UI text, translations, labels, page titles
- No British English anywhere — `messages/en.json` values updated
- CLAUDE.md rule corrected to match parent convention
- Remove the "Code: American English; UI text: British English" rule entirely

### Proxy Route Path Convention

**Current state is inconsistent:**

- Org routes: `/organizations/members` (no `/v1`)
- Admin routes: `/v1/admin/organizations` (includes `/v1`)
- `NEXT_PUBLIC_BASE_API_URL` includes `/v1` → admin routes double it

**Fix:** Standardize ALL proxy route paths to include `/v1` prefix. Remove `/v1` from `NEXT_PUBLIC_BASE_API_URL`.

- **Env:** `http://localhost:5181` (remove `/v1`)
- **All proxy paths:** `/v1/organizations/members`, `/v1/admin/organizations`, etc.
- **`getMe()` in `auth.ts`:** `/v1/me`
- **Admin routes:** Already have `/v1` — no change needed
- **Org routes:** Add `/v1` prefix to all paths
- **.env.example:** Update to remove `/v1`

**CLAUDE.md rule:** "All proxy route handler paths MUST include the `/v1` API version prefix. `NEXT_PUBLIC_BASE_API_URL` must NOT include a version prefix."

### Hard Delete UX

Two-stage confirmation:

1. **Warning dialog:** "Delete [entity name]? This action is permanent and cannot be undone." → Continue button
2. **Typed confirmation dialog:** User types entity name to confirm → "Permanently Delete" button (destructive)
3. API call sends `X-Confirm-Delete: {publicId}` header

### Admin Org Detail Structure

Tabs structure preserved (Info, Members, Invites):

- **Info tab:** Edit form + status actions (deactivate/reactivate) + danger zone (hard delete)
- **Members tab:** Table with row actions dropdown (deactivate/reactivate/remove) + member name links to `/admin/users/[userId]`. No status column (API limitation).
- **Invites tab:** Table with status badges + "Invite User" button + sheet (email + role picker) + cancel action

### Org-Scoped Invites Structure

Preserved as-is: members table + collapsible pending invites section below. No tabs.

### apiClient Changes

`delete` method gets optional `headers` parameter. Other methods unchanged.

```ts
delete: <T>(path: string, headers?: Record<string, string>) => ...
// TODO: Consider adding headers support to all methods if needed in the future
```

### Proxy Request Header Forwarding

Whitelist approach: `X-Confirm-Delete` header forwarded from incoming request to backend. No other custom headers forwarded. Applied to both `proxyRequest` and `adminProxyRequest`.

---

## 3. Architecture

### New Shared Components

#### `src/components/shared/hard-delete-confirmation.tsx`

Reusable two-stage hard delete dialog:

```tsx
<HardDeleteConfirmation
  entityName="Acme Corp" // Text user must type
  entityPublicId="org_a1b2c3d4e5f6" // X-Confirm-Delete header value
  warningTitle={t('deleteWarningTitle')}
  warningDescription={t('deleteWarningDescription')}
  confirmTitle={t('deleteConfirmTitle')}
  confirmDescription={t('deleteConfirmDescription', { name: org.name })}
  confirmButtonLabel={t('permanentlyDelete')}
  onConfirm={() => mutation.mutate()}
  isPending={mutation.isPending}
  trigger={<Button variant="destructive">{t('deleteOrganization')}</Button>}
/>
```

Props:

- `entityName: string` — display name, user types this to confirm
- `entityPublicId: string` — sent as `X-Confirm-Delete` header
- `warningTitle: string` — stage 1 dialog title (from translations)
- `warningDescription: string` — stage 1 dialog description (from translations)
- `confirmTitle: string` — stage 2 dialog title (from translations)
- `confirmDescription: string` — stage 2 dialog description with entity name (from translations)
- `confirmButtonLabel: string` — stage 2 confirm button text (from translations)
- `onConfirm: () => void` — called after typed confirmation
- `isPending: boolean` — disables buttons during mutation
- `trigger: ReactNode` — button that opens the first dialog

All user-visible text comes from the calling component via props — no hardcoded strings in the shared component.

#### `src/components/shared/danger-zone.tsx`

Wrapper component for destructive actions at bottom of detail pages:

```tsx
<DangerZone>
  <DangerZoneItem
    title={t('dangerZoneTitle')}
    description={t('dangerZoneDescription')}
    action={<HardDeleteConfirmation ... />}
  />
</DangerZone>
```

Red-bordered card, consistent styling across admin detail pages. `title` and `description` props come from translations.

### New Admin Validators

```
src/features/admin/validators/
  create-organization.schema.ts
  update-organization.schema.ts
  invite-user.schema.ts
```

Validation rules match API constraints:

- **Create org:** name (required, max 100), slug (required, max 100, `^[a-z0-9-]+$`), currencyCode (required, exactly 3), timezone (required, max 100), subscriptionPlan (required, enum: starter/pro/enterprise)
- **Update org:** name (required, max 200), contactName, contactEmail (email format), contactPhone (max 50), currencyCode (required, exactly 3), timezone (required)
- **Invite user:** email (required, email format), roleId (required)

### New Proxy Route for Member Roles

Current `api/organizations/members/[id]/route.ts` exports PATCH for generic member update. The roles endpoint needs a separate route:

```
api/organizations/members/[id]/roles/route.ts  → PATCH → /v1/organizations/members/{id}/roles
```

### New Hooks

| Hook                        | File                         | API Endpoint                                                    |
| --------------------------- | ---------------------------- | --------------------------------------------------------------- |
| `useReactivateOrganization` | `use-admin-organizations.ts` | `PATCH /v1/admin/organizations/{id}/reactivate`                 |
| `useDeleteOrganization`     | `use-admin-organizations.ts` | `DELETE /v1/admin/organizations/{id}` with `X-Confirm-Delete`   |
| `useDeleteUser`             | `use-admin-users.ts`         | `DELETE /v1/admin/users/{id}` with `X-Confirm-Delete`           |
| `useAdminDeactivateMember`  | `use-admin-members.ts`       | `PATCH /v1/admin/organizations/{orgId}/members/{id}/deactivate` |
| `useAdminReactivateMember`  | `use-admin-members.ts`       | `PATCH /v1/admin/organizations/{orgId}/members/{id}/reactivate` |
| `useAdminMe`                | `use-admin-me.ts` (new)      | `GET /v1/admin/me`                                              |
| `useMember`                 | `use-members.ts`             | `GET /v1/organizations/members/{id}`                            |

### Cache Invalidation for Delete Hooks

- **`useDeleteOrganization`:** Invalidate `adminKeys.organizations.all()`, `adminKeys.organizations.detail(id)`, `adminKeys.organizations.members(id)`, `adminKeys.organizations.invites(id)`. Redirect to `/admin/organizations` after success.
- **`useDeleteUser`:** Invalidate `adminKeys.users.all()`, `adminKeys.users.detail(id)`, and `adminKeys.organizations.all()` (member counts may change). Redirect to `/admin/users` after success.

### New Proxy Routes

All paths include `/v1` prefix per new convention.

| Route File                                                          | Methods                  | Backend Path                                              |
| ------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------- |
| `api/admin/organizations/[id]/reactivate/route.ts`                  | PATCH                    | `/v1/admin/organizations/{id}/reactivate`                 |
| `api/admin/organizations/[id]/route.ts`                             | DELETE (add to existing) | `/v1/admin/organizations/{id}`                            |
| `api/admin/users/[id]/route.ts`                                     | DELETE (add to existing) | `/v1/admin/users/{id}`                                    |
| `api/admin/organizations/[id]/members/[userId]/deactivate/route.ts` | PATCH                    | `/v1/admin/organizations/{orgId}/members/{id}/deactivate` |
| `api/admin/organizations/[id]/members/[userId]/reactivate/route.ts` | PATCH                    | `/v1/admin/organizations/{orgId}/members/{id}/reactivate` |
| `api/admin/me/route.ts`                                             | GET                      | `/v1/admin/me`                                            |
| `api/admin/invites/[id]/cancel/route.ts`                            | PATCH                    | `/v1/admin/invites/{id}/cancel`                           |
| `api/organizations/members/[id]/roles/route.ts`                     | PATCH                    | `/v1/organizations/members/{id}/roles`                    |

### Proxy Routes to Fix

| Route File                                           | Current                                       | Fix                                    |
| ---------------------------------------------------- | --------------------------------------------- | -------------------------------------- |
| `api/organizations/members/[id]/deactivate/route.ts` | exports `POST`                                | Change to `PATCH`                      |
| `api/organizations/members/[id]/reactivate/route.ts` | exports `POST`                                | Change to `PATCH`                      |
| `api/admin/invites/[id]/route.ts`                    | exports `DELETE` to `/v1/admin/invites/${id}` | Remove — replaced by `cancel/route.ts` |
| All org-scoped proxy routes                          | paths without `/v1`                           | Add `/v1` prefix                       |

### New Admin Types

```ts
// Added to admin.types.ts
export type AdminMe = {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  adminRole: string;
  assignedAt: ISODateTimeString;
};
```

`AdminMe` type matches the `AdminMeResponse` contract from the API (`adminRole` and `assignedAt` fields verified against `Propentro.Contracts.Admin.Me.AdminMeResponse`).

---

## 4. UI Changes

### Admin Organization Detail Page

**Info tab (updated):**

- Status badge + action buttons at top (deactivate if active, reactivate if inactive)
- Edit form with `validationSchema` (Zod)
- Danger zone section at bottom (hard delete) — always visible, API handles state guards

**Members tab (updated):**

- Row actions dropdown per member: Deactivate, Reactivate, Remove (no status column — API limitation)
- Member name links to `/admin/users/[userId]`
- Confirmation dialogs for deactivate/reactivate/remove

**Invites tab (updated):**

- "Invite User" button at top
- Invite sheet: email input + role picker (fetches org's roles)
- Cancel button on pending invites
- Status badge colors: pending=warning, accepted=success, canceled=destructive, expired=muted

### Admin User Detail Page

- Status badge + action buttons (deactivate/reactivate)
- Organizations list (existing)
- Danger zone section at bottom (hard delete)

### Admin Sidebar/Header

- Admin me profile: compact display in sidebar footer or header (name, email, role)

### Translation Updates

All `messages/en.json` values changed from British to American English:

- "Organisation" → "Organization"
- "Colour" → "Color"
- "Favourite" → "Favorite"
- "Cancelled" → "Canceled"
- All other British spellings

New translation keys added for:

- `admin.organizations.reactivate*` — reactivate actions
- `admin.organizations.invite*` — invite from org detail
- `admin.organizations.delete*` — hard delete actions
- `admin.users.delete*` — hard delete actions
- `admin.members.deactivate*`, `admin.members.reactivate*` — member actions
- `admin.me.*` — admin profile
- `common.dangerZone.*` — danger zone component text
- `common.hardDelete.*` — two-stage delete component text

---

## 5. Execution Structure

### Phase 1 — Infrastructure (Sequential, Blocker)

All vertical slices depend on this phase completing first.

1. **Env + proxy path standardization:** Remove `/v1` from `NEXT_PUBLIC_BASE_API_URL`, add `/v1` to all org-scoped proxy route paths. Admin routes already correct.
2. **`getMe()` path fix:** Update `auth.ts` to use `/v1/me`
3. **`apiClient.delete` headers support**
4. **Proxy request `X-Confirm-Delete` header forwarding** (whitelist in both `proxyRequest` and `adminProxyRequest`)
5. **JWT super admin check:** Replace `checkSuperAdmin()` backend call with `sessionClaims.metadata.systemRole` check. Remove `CurrentUser.isSystemAdmin` field.
6. **HTTP method fixes:**
   - `useDeactivateMember` + proxy route: `POST` → `PATCH`
   - `useReactivateMember` + proxy route: `POST` → `PATCH`
   - `useUpdateMemberRoles`: fix path to include `/roles` suffix + add new proxy route
   - `useCancelInvite` (admin): `DELETE` → `PATCH`, fix path to `/cancel`, remove orphaned DELETE route
7. **Return type fixes:**
   - `adminOrgMembersQueryOptions`: `AdminMember[]` → `PagedResult<AdminMember>`
   - `adminOrgInvitesQueryOptions`: `AdminInvite[]` → `PagedResult<AdminInvite>`
8. **Add missing proxy routes** (new endpoints listed in Section 3)
9. **CLAUDE.md updates:** Proxy path convention rule, American English everywhere rule
10. **`messages/en.json` British → American English corrections**
11. **.env.example update:** Remove `/v1` from `NEXT_PUBLIC_BASE_API_URL`

### Phase 2 — Vertical Slices (Parallelizable)

**Dependency:** Phase 1 must complete. Slice G must complete before B and C.

| Slice                         | Scope                                                                        | Depends On  |
| ----------------------------- | ---------------------------------------------------------------------------- | ----------- |
| **G: Shared components**      | HardDeleteConfirmation, DangerZone                                           | Phase 1     |
| **A: Org Members polish**     | Member detail hook, verify all proxy routes correct                          | Phase 1     |
| **B: Admin Org complete**     | Reactivate hook+UI, hard delete hook+UI, invite UI, Zod schemas, danger zone | Phase 1 + G |
| **C: Admin Users complete**   | Hard delete hook+UI, detail page polish, danger zone                         | Phase 1 + G |
| **D: Admin Members complete** | Deactivate/reactivate hooks+UI, row actions dropdown, user detail link       | Phase 1     |
| **E: Admin Invites fix**      | Cancel method fix, global list cancel button, status badge colors            | Phase 1     |
| **F: Admin Me**               | Hook, type, proxy route, sidebar/header profile display                      | Phase 1     |

```
Phase 1 ──→ G ──→ B (admin org complete)
              └──→ C (admin user complete)
Phase 1 ──→ A (org members polish)
Phase 1 ──→ D (admin members complete)
Phase 1 ──→ E (admin invites fix)
Phase 1 ──→ F (admin me)
```

Maximum parallelism after Phase 1: G first, then A+D+E+F immediately, B+C after G completes.
Or: G+A+D+E+F in parallel (G is small), then B+C after G.
