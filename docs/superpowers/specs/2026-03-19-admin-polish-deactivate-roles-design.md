# Admin Polish: Deactivate to Danger Zone & Admin Roles Lookup

**Date:** 2026-03-19
**Scope:** propentro-app (frontend) + propentro-api (backend)

## What

Two changes to bring the admin dashboard closer to production quality:

1. Move deactivate/reactivate from the entity header quick-action into the danger zone for both organization and user detail pages.
2. Create an admin roles lookup endpoint and filter system roles from the invite dialog.

## Why

- The header quick-action button is not visually prominent enough — admins miss it. Danger zone is a natural home for state-changing operations.
- The invite dialog currently shows all roles including system roles. System roles should not be assignable via invite — only custom org roles.

---

## 1. Deactivate/Reactivate → Danger Zone

### Changes

**EntityHeader (`src/features/admin/components/entity-header.tsx`):**
- Make `quickAction` prop optional
- Remove quick-action button rendering when prop is not provided
- Both org-detail and user-detail stop passing `quickAction`

**DangerZone shared component (`src/components/shared/danger-zone.tsx`):**
- Add `divide-y` to `CardContent` so multiple `DangerZoneItem` children get visual separators automatically
- Adjust `DangerZoneItem` padding to work with `divide-y` (replace `space-y-4` with per-item padding)

**Organization Danger Zone (`src/features/admin/organizations/components/organization-danger-zone.tsx`):**
- Add deactivate/reactivate `DangerZoneItem` above the existing delete item
- Move deactivate/reactivate state (`useState`, mutation, confirmation dialog) from `organization-detail.tsx` into this component
- Active → "Deactivate Organization" button (destructive variant) with confirmation dialog
- Inactive → "Reactivate Organization" button (default variant) with confirmation dialog

**User Danger Zone — extract new component (`src/features/admin/users/components/user-danger-zone.tsx`):**
- Extract danger zone from `user-details-tab.tsx` into its own file (matching org pattern: `organization-danger-zone.tsx`)
- Add deactivate/reactivate `DangerZoneItem` above delete
- Move deactivate/reactivate state from `user-detail.tsx` into this component
- `user-details-tab.tsx` renders `<UserDangerZone user={user} />` instead of inline danger zone markup

**Organization Detail (`organization-detail.tsx`):**
- Remove `quickAction` prop from `EntityHeader`
- Remove deactivate/reactivate state, mutations, handlers, and confirmation dialog
- Pass `organization` (full object) to danger zone (it already does)

**User Detail (`user-detail.tsx`):**
- Remove `quickAction` prop from `EntityHeader`
- Remove deactivate/reactivate state, mutations, handlers, and confirmation dialog
- User ID for mutations: use `user.userId` from the `AdminUser` object (same value as the route param `id`)

### Danger Zone Layout

**When entity is active:**
```
┌─ Danger Zone ──────────────────────────────────────────┐
│ Deactivate [Entity]                       [Deactivate]  │
│ "[Active state consequence description]"                │
│ ─────────────────────────────────────────────────────── │
│ Delete [Entity]                       [Delete](disabled)│
│ "Permanently removes this [entity].                     │
│  You must deactivate it first."                         │
└─────────────────────────────────────────────────────────┘
```

**When entity is inactive:**
```
┌─ Danger Zone ──────────────────────────────────────────┐
│ Reactivate [Entity]                      [Reactivate]   │
│ "[Reactivate consequence description]"                  │
│ ─────────────────────────────────────────────────────── │
│ Delete [Entity]                            [Delete]     │
│ "Permanently removes this [entity].                     │
│  This action cannot be undone."                         │
└─────────────────────────────────────────────────────────┘
```

### Behavior Notes

- **Deactivate:** Opens confirmation dialog (destructive action, even though reversible)
- **Reactivate:** Fires immediately, no confirmation dialog (non-destructive, restoring access)
- **Delete:** Existing two-step `HardDeleteConfirmation` (type entity name to confirm)

### Delete Description Logic

- Active → description includes "You must deactivate it first." to explain why button is disabled
- Inactive → description says "This action cannot be undone." (standard destructive warning)

### i18n Keys

Reuse existing `deactivateTitle`, `deactivateDescription`, `reactivateSuccess`, `reactivateError` keys where the text is identical. New keys needed:

- `dangerZone.deactivateDescription` — danger zone-specific description (consequence-focused, e.g., "Members will lose access")
- `dangerZone.reactivateDescription` — danger zone-specific description (e.g., "Restore access for all members")
- `dangerZone.deleteDescriptionActive` — replaces single `dangerZoneDescription`, includes "must deactivate first"
- `dangerZone.deleteDescriptionInactive` — standard "cannot be undone" warning

Remove orphaned `dangerZoneDescription` key after replacement.

---

## 2. Admin Roles Lookup Endpoint

### API (propentro-api)

**Endpoint:** `GET /v1/admin/organizations/{organizationId}/roles`

**Auth:** `RequireSystemAdministratorAttribute` (admin role check only, no granular permissions)

**Query (Dapper):**
```sql
SELECT r.public_id AS role_id, r.name, r.is_system
FROM roles r
WHERE (r.organization_id = @OrgId OR r.is_system = TRUE)
  AND r.is_active = TRUE
ORDER BY r.is_system DESC, r.name ASC
```

System roles first, then custom roles alphabetically.

**Response:** `List<AdminRoleItem>` (not paged)

This is a deliberate deviation from the `PagedResult<T>` convention. Roles are a small bounded dataset (typically <15 per org) used to populate a dropdown select — pagination adds unnecessary complexity.

```csharp
public sealed record AdminRoleItem
{
    public string RoleId { get; init; } = null!;
    public string Name { get; init; } = null!;
    public bool IsSystem { get; init; }
}
```

**Placement:** Add to existing `AdminOrganizationEndpoints.cs` — single endpoint, no need for separate file.

### Frontend (propentro-app)

**Type update (`src/features/admin/types/index.ts`):**
- Add `isSystem: boolean` to `AdminOrgRole` type

**Hook update (`use-admin-org-roles.ts`):**
- Response type changes from `PagedResult<AdminOrgRole>` to `AdminOrgRole[]`

**Proxy route (`src/app/api/admin/organizations/[id]/roles/route.ts`):**
- Already exists, forwards to `/v1/admin/organizations/${id}/roles` — no changes needed (pass-through, transparent to response shape change)

**Invite dialog (`create-invite-dialog.tsx`):**
- Change `rolesData?.items` → `rolesData` (no longer `PagedResult`)
- Filter roles: `rolesData?.filter(r => !r.isSystem)` before rendering select options
- Maintains graceful loading state (optional chaining handles undefined while query loads)

---

## Bug Fixes (already applied)

- `organization-members-table.tsx`: Fixed 3 non-null assertions (`removingMember!.email`, `deactivatingMember!.email`, `reactivatingMember!.email`) → conditional rendering
- `invites-list.tsx`: Fixed non-null assertion (`cancellingInvite!.email`) → conditional rendering
- `organization-detail.tsx`: Removed `organizationId` from header identifiers
- `user-detail.tsx`: Removed `userId` from header identifiers

---

## Out of Scope

- Admin permission system (future work — currently role-based only)
- Role CRUD in admin context (admin can view roles, not manage them yet)
- System role definition/editing
