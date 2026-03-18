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

| Issue | File | Detail |
|-------|------|--------|
| `useDeactivateMember` uses POST | `use-members.ts` | API expects PATCH |
| `useReactivateMember` uses POST | `use-members.ts` | API expects PATCH |
| `useCancelInvite` (admin) uses DELETE | `use-admin-invites.ts` | API expects PATCH to `/admin/invites/{id}/cancel` |
| `checkSuperAdmin()` double `/v1` | `select-workspace/page.tsx` | `${BASE_API_URL}/v1/admin/me` → `/v1/v1/admin/me` |
| Admin create org form has no Zod schema | `organizations-list.tsx` | No validation on submit |
| Admin update org form has no Zod schema | `organization-detail.tsx` | No validation on submit |
| `adminOrgMembersQueryOptions` return type | `use-admin-organizations.ts` | Returns `AdminMember[]`, may need `PagedResult<AdminMember>` |
| British English in UI text | `messages/en.json` | "Organisation" etc. should be "Organization" |
| CLAUDE.md contradicts parent on spelling | `CLAUDE.md` | Says "UI text: British English" but parent says American everywhere |

### What's Missing

| Feature | API Endpoint | Current Frontend Status |
|---------|-------------|------------------------|
| Reactivate org | `PATCH /v1/admin/organizations/{id}/reactivate` | No hook, no UI |
| Hard delete org | `DELETE /v1/admin/organizations/{id}` | No hook, no UI, no proxy route |
| Hard delete user | `DELETE /v1/admin/users/{id}` | No hook, no UI, no proxy route |
| Admin member deactivate | `PATCH /v1/admin/organizations/{orgId}/members/{id}/deactivate` | No hook, no UI, no proxy route |
| Admin member reactivate | `PATCH /v1/admin/organizations/{orgId}/members/{id}/reactivate` | No hook, no UI, no proxy route |
| Admin invite from org detail | `POST /v1/admin/organizations/{orgId}/invites` | Hook exists, no UI |
| Admin me profile | `GET /v1/admin/me` | No hook, no UI |
| Member detail (org-scoped) | `GET /v1/organizations/members/{id}` | No hook |
| `apiClient.delete` headers support | N/A | Cannot send `X-Confirm-Delete` header |
| Proxy header forwarding | N/A | Cannot forward `X-Confirm-Delete` to backend |

---

## 2. Decisions

### Super Admin Check

- **Current:** `checkSuperAdmin()` makes backend call to `/v1/admin/me`
- **New:** Read JWT claim `sessionClaims.metadata.systemRole === 'super_admin'`
- **Where:** `select-workspace/page.tsx` (server component), `admin/layout.tsx` (server component)
- `CurrentUser.isSystemAdmin` field removed — not needed, JWT claim is the source of truth
- No client-side super admin state needed — admin panel is server-layout guarded

### Spelling

- **American English everywhere** — code, UI text, translations, labels, page titles
- No British English anywhere — `messages/en.json` values updated
- CLAUDE.md rule corrected to match parent convention

### Hard Delete UX

Two-stage confirmation:
1. **Warning dialog:** "Delete [entity name]? This action is permanent and cannot be undone."  → Continue button
2. **Typed confirmation dialog:** User types entity name to confirm → "Permanently Delete" button (destructive)
3. API call sends `X-Confirm-Delete: {publicId}` header

### Admin Org Detail Structure

Tabs structure preserved (Info, Members, Invites):
- **Info tab:** Edit form + status actions (deactivate/reactivate) + danger zone (hard delete)
- **Members tab:** Table with status badges + row actions dropdown (deactivate/reactivate/remove) + member name links to `/admin/users/[userId]`
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

Whitelist approach: `X-Confirm-Delete` header forwarded from incoming request to backend. No other custom headers forwarded.

### Proxy Route Path Convention

Route handler paths are written WITHOUT `/v1` prefix. The `/v1` prefix lives in `NEXT_PUBLIC_BASE_API_URL`. CLAUDE.md rule added.

---

## 3. Architecture

### New Shared Components

#### `src/components/shared/hard-delete-confirmation.tsx`

Reusable two-stage hard delete dialog:

```tsx
<HardDeleteConfirmation
  entityName="Acme Corp"              // Text user must type
  entityPublicId="org_a1b2c3d4e5f6"   // X-Confirm-Delete header value
  onConfirm={() => mutation.mutate()}
  isPending={mutation.isPending}
  trigger={<Button variant="destructive">Delete</Button>}
/>
```

Props:
- `entityName: string` — display name, user types this to confirm
- `entityPublicId: string` — sent as `X-Confirm-Delete` header
- `onConfirm: () => void` — called after typed confirmation
- `isPending: boolean` — disables buttons during mutation
- `trigger: ReactNode` — button that opens the first dialog

#### `src/components/shared/danger-zone.tsx`

Wrapper component for destructive actions at bottom of detail pages:

```tsx
<DangerZone>
  <DangerZoneItem
    title="Delete this organization"
    description="Permanently remove this organization and all its data."
    action={<HardDeleteConfirmation ... />}
  />
</DangerZone>
```

Red-bordered card, consistent styling across admin detail pages.

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

### New Hooks

| Hook | File | API Endpoint |
|------|------|-------------|
| `useReactivateOrganization` | `use-admin-organizations.ts` | `PATCH /admin/organizations/{id}/reactivate` |
| `useDeleteOrganization` | `use-admin-organizations.ts` | `DELETE /admin/organizations/{id}` with `X-Confirm-Delete` |
| `useDeleteUser` | `use-admin-users.ts` | `DELETE /admin/users/{id}` with `X-Confirm-Delete` |
| `useAdminDeactivateMember` | `use-admin-members.ts` | `PATCH /admin/organizations/{orgId}/members/{id}/deactivate` |
| `useAdminReactivateMember` | `use-admin-members.ts` | `PATCH /admin/organizations/{orgId}/members/{id}/reactivate` |
| `useAdminMe` | `use-admin-me.ts` (new) | `GET /admin/me` |
| `useMember` | `use-members.ts` | `GET /organizations/members/{id}` |

### New Proxy Routes

| Route File | Methods | Backend Path |
|-----------|---------|-------------|
| `api/admin/organizations/[id]/reactivate/route.ts` | PATCH | `/admin/organizations/{id}/reactivate` |
| `api/admin/organizations/[id]/route.ts` | DELETE (add) | `/admin/organizations/{id}` |
| `api/admin/users/[id]/route.ts` | DELETE (add) | `/admin/users/{id}` |
| `api/admin/organizations/[id]/members/[userId]/deactivate/route.ts` | PATCH | `/admin/organizations/{orgId}/members/{id}/deactivate` |
| `api/admin/organizations/[id]/members/[userId]/reactivate/route.ts` | PATCH | `/admin/organizations/{orgId}/members/{id}/reactivate` |
| `api/admin/me/route.ts` | GET | `/admin/me` |
| `api/admin/invites/[id]/cancel/route.ts` | PATCH | `/admin/invites/{id}/cancel` |

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

---

## 4. UI Changes

### Admin Organization Detail Page

**Info tab (updated):**
- Status badge + action buttons at top (deactivate if active, reactivate if inactive)
- Edit form with `validationSchema` (Zod)
- Danger zone section at bottom (hard delete — only shown for inactive orgs? or always visible)
  - Always visible — API handles the guard, but showing only for inactive is safer UX

**Members tab (updated):**
- Status column added to member rows
- Row actions dropdown: Edit Roles (future), Deactivate/Reactivate, Remove
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
- etc.

New translation keys added for:
- `admin.organizations.reactivate*` — reactivate actions
- `admin.organizations.invite*` — invite from org detail
- `admin.users.delete*` — hard delete actions
- `admin.members.deactivate*`, `admin.members.reactivate*` — member status actions
- `admin.me.*` — admin profile
- `common.dangerZone.*` — danger zone component
- `common.hardDelete.*` — two-stage delete component

---

## 5. Execution Structure

### Phase 1 — Infrastructure (Sequential, Blocker)

All vertical slices depend on this phase completing first.

1. `apiClient.delete` headers support
2. Proxy request `X-Confirm-Delete` header forwarding (whitelist)
3. JWT super admin check (replace `checkSuperAdmin`, remove `CurrentUser.isSystemAdmin`)
4. HTTP method fixes (deactivate/reactivate → PATCH, cancel invite path fix)
5. Proxy route audit + add missing routes
6. CLAUDE.md updates (proxy path convention, American English everywhere)
7. `messages/en.json` British → American English corrections

### Phase 2 — Vertical Slices (Parallelizable)

**Dependency:** Phase 1 must complete. Slice G must complete before B and C.

| Slice | Scope | Depends On |
|-------|-------|-----------|
| **G: Shared components** | HardDeleteConfirmation, DangerZone | Phase 1 |
| **A: Org Members fix** | HTTP method fix in hooks, member detail hook, proxy route fix | Phase 1 |
| **B: Admin Org complete** | Reactivate hook+UI, hard delete hook+UI, invite UI, Zod schemas, danger zone | Phase 1 + G |
| **C: Admin Users complete** | Hard delete hook+UI, detail page polish, danger zone | Phase 1 + G |
| **D: Admin Members complete** | Deactivate/reactivate hooks+UI, status badges, row actions, user link | Phase 1 |
| **E: Admin Invites fix** | Cancel method fix, global list cancel button, status badge colors | Phase 1 |
| **F: Admin Me** | Hook, type, proxy route, sidebar/header profile display | Phase 1 |

```
Phase 1 ──→ G ──→ B (admin org complete)
              └──→ C (admin user complete)
Phase 1 ──→ A (org members fix)
Phase 1 ──→ D (admin members complete)
Phase 1 ──→ E (admin invites fix)
Phase 1 ──→ F (admin me)
```

Maximum parallelism after Phase 1: G first, then A+D+E+F immediately, B+C after G completes.
