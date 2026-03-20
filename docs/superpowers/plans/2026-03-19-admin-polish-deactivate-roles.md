# Admin Polish: Deactivate to Danger Zone & Admin Roles Lookup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move deactivate/reactivate from entity header into danger zone for org & user detail pages, and create an admin roles lookup endpoint that filters system roles from the invite dialog.

**Architecture:** Frontend-only changes for danger zone relocation (move state from parent detail components into danger zone components). Backend MediatR query + Dapper for the roles lookup endpoint. Frontend hook/type updates to consume the new response shape.

**Tech Stack:** Next.js 16, React 19, TypeScript, shadcn/ui v4, TanStack Query 5 (frontend) | .NET 10, MediatR, Dapper (backend)

**Spec:** `docs/superpowers/specs/2026-03-19-admin-polish-deactivate-roles-design.md`

---

## File Structure

### Frontend (propentro-app)

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/components/shared/danger-zone.tsx` | Add `divide-y` separator between DangerZoneItems |
| Modify | `src/features/admin/components/entity-header.tsx` | Make `quickAction` optional |
| Modify | `src/features/admin/organizations/components/organization-detail.tsx` | Remove deactivate/reactivate state & dialog |
| Modify | `src/features/admin/organizations/components/organization-danger-zone.tsx` | Add deactivate/reactivate DangerZoneItem |
| Modify | `src/features/admin/users/components/user-detail.tsx` | Remove deactivate/reactivate state & dialog |
| Create | `src/features/admin/users/components/user-danger-zone.tsx` | New: extracted danger zone with deactivate/reactivate |
| Modify | `src/features/admin/users/components/user-details-tab.tsx` | Remove inline danger zone, use UserDangerZone |
| Modify | `src/features/admin/types/index.ts` | Add `isSystem` to `AdminOrgRole` |
| Modify | `src/features/admin/organizations/hooks/use-admin-org-roles.ts` | Change response type to `AdminOrgRole[]` |
| Modify | `src/features/admin/organizations/components/create-invite-dialog.tsx` | Filter system roles, fix `rolesData?.items` |
| Modify | `messages/en.json` | Add/update danger zone translation keys |

### Backend (propentro-api)

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/Propentro.Contracts/Admin/Organizations/AdminOrgRoleResponse.cs` | DTO for role lookup |
| Create | `src/Propentro.Application/Features/Admin/Organizations/Queries/GetOrganizationRoles/GetOrganizationRolesQuery.cs` | MediatR query record |
| Create | `src/Propentro.Application/Features/Admin/Organizations/Queries/GetOrganizationRoles/GetOrganizationRolesHandler.cs` | Dapper query handler |
| Modify | `src/Propentro.Api/Endpoints/Admin/AdminOrganizationEndpoints.cs` | Register roles endpoint |

---

## Task 1: Update shared DangerZone component for separators

**Files:**
- Modify: `src/components/shared/danger-zone.tsx`

- [ ] **Step 1: Update DangerZone to use divide-y**

Replace `space-y-4` with `divide-y` on `CardContent` and add padding to `DangerZoneItem`:

```tsx
// In DangerZone component, change CardContent:
<CardContent className="divide-y pt-2">{children}</CardContent>

// In DangerZoneItem, wrap with padding:
function DangerZoneItem({ title, description, action }: DangerZoneItemProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-2">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}
```

- [ ] **Step 2: Verify type check passes**

Run: `pnpm type:check`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/danger-zone.tsx
git commit -m "refactor: add divide-y separators to DangerZone component"
```

---

## Task 2: Make EntityHeader quickAction optional

**Files:**
- Modify: `src/features/admin/components/entity-header.tsx`

- [ ] **Step 1: Make quickAction optional and conditionally render**

Change the interface:

```tsx
interface EntityHeaderProps {
  name: string;
  isActive: boolean;
  activeLabel: string;
  inactiveLabel: string;
  identifiers: string[];
  backHref: string;
  backLabel: string;
  quickAction?: {  // ← optional now
    label: string;
    onClick: () => void;
    isPending: boolean;
    variant: 'default' | 'destructive';
  };
  children?: ReactNode;
}
```

In the JSX, conditionally render the quick-action button area:

```tsx
<div className="flex shrink-0 items-center gap-2">
  {children}
  {quickAction && (
    <Button
      variant={quickAction.variant}
      size="sm"
      onClick={quickAction.onClick}
      disabled={quickAction.isPending}
    >
      {quickAction.isPending && (
        <LoaderIcon className="animate-spin" />
      )}
      {quickAction.label}
    </Button>
  )}
</div>
```

Note: Only render the wrapper `<div>` if `children` or `quickAction` exists, to avoid empty space:

```tsx
{(children || quickAction) && (
  <div className="flex shrink-0 items-center gap-2">
    {children}
    {quickAction && (
      <Button
        variant={quickAction.variant}
        size="sm"
        onClick={quickAction.onClick}
        disabled={quickAction.isPending}
      >
        {quickAction.isPending && (
          <LoaderIcon className="animate-spin" />
        )}
        {quickAction.label}
      </Button>
    )}
  </div>
)}
```

- [ ] **Step 2: Verify type check passes**

Run: `pnpm type:check`
Expected: No errors (quickAction is still passed from org-detail and user-detail, so no breakage yet)

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/entity-header.tsx
git commit -m "refactor: make EntityHeader quickAction prop optional"
```

---

## Task 3: Add i18n keys for danger zone deactivate/reactivate

**Files:**
- Modify: `messages/en.json`

- [ ] **Step 1: Add new translation keys**

In the `admin.organizations` section, add these keys (after existing `dangerZoneDescription` key at line ~393):

```json
"dangerZoneDeactivateTitle": "Deactivate this organization",
"dangerZoneDeactivateDescription": "Members will lose access to this organization. You can reactivate it at any time.",
"dangerZoneReactivateTitle": "Reactivate this organization",
"dangerZoneReactivateDescription": "Restore access for all members of this organization.",
"dangerZoneDeleteDescriptionActive": "Permanently delete this organization and all its data. You must deactivate it first.",
"dangerZoneDeleteDescriptionInactive": "Permanently delete this organization and all its data. This action cannot be undone."
```

Remove the old `dangerZoneDescription` key from `admin.organizations` — it's replaced by `dangerZoneDeleteDescriptionActive` and `dangerZoneDeleteDescriptionInactive`.

Keep `dangerZoneTitle` as-is (`"Delete this organization"`) — it's still used for the delete item title.

In the `admin.users` section, add these keys (after existing `dangerZoneDescription` key at line ~484):

```json
"dangerZoneDeactivateTitle": "Deactivate this user",
"dangerZoneDeactivateDescription": "This user will lose access to all organizations. You can reactivate them at any time.",
"dangerZoneReactivateTitle": "Reactivate this user",
"dangerZoneReactivateDescription": "Restore access for this user across all their organizations.",
"dangerZoneDeleteDescriptionActive": "Permanently delete this user and all their data. You must deactivate them first.",
"dangerZoneDeleteDescriptionInactive": "Permanently delete this user and all their data. This action cannot be undone."
```

Also remove the old `dangerZoneDescription` key from `admin.users` — replaced by the active/inactive variants.

- [ ] **Step 2: Commit**

```bash
git add messages/en.json
git commit -m "feat: add danger zone deactivate/reactivate translation keys"
```

---

## Task 4: Move deactivate/reactivate into Organization Danger Zone

**Files:**
- Modify: `src/features/admin/organizations/components/organization-danger-zone.tsx`
- Modify: `src/features/admin/organizations/components/organization-detail.tsx`

- [ ] **Step 1: Update OrganizationDangerZone to include deactivate/reactivate**

Rewrite `organization-danger-zone.tsx`. The component needs:
- Import `useDeactivateOrganization`, `useReactivateOrganization` from hooks
- Import `useState` for deactivate confirmation dialog
- Import `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle` for deactivate confirmation
- Import `LoaderIcon` for button loading state
- Add deactivate/reactivate `DangerZoneItem` above existing delete item
- Deactivate shows confirmation dialog; reactivate fires immediately (no dialog)
- Delete description changes based on `organization.isActive`

```tsx
'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { DangerZone, DangerZoneItem } from '@/components/shared/danger-zone';
import { HardDeleteConfirmation } from '@/components/shared/hard-delete-confirmation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { paths } from '@/config/routes';
import { useRouter } from '@/i18n/routing';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type { AdminOrganization } from '../../types';
import {
  useDeactivateOrganization,
  useDeleteOrganization,
  useReactivateOrganization,
} from '../hooks/use-admin-organizations';

interface OrganizationDangerZoneProps {
  organization: AdminOrganization;
}

export function OrganizationDangerZone({
  organization,
}: OrganizationDangerZoneProps) {
  const t = useTranslations('admin.organizations');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const deleteOrg = useDeleteOrganization();
  const deactivateOrg = useDeactivateOrganization();
  const reactivateOrg = useReactivateOrganization();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  function handleDeactivate() {
    deactivateOrg.mutate(organization.organizationId, {
      onSuccess: () => {
        toast.success(t('deactivateSuccess'));
        setDeactivateOpen(false);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('deactivateError')));
      },
    });
  }

  function handleReactivate() {
    reactivateOrg.mutate(organization.organizationId, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <div />
        <DangerZone>
          {/* Deactivate / Reactivate */}
          <DangerZoneItem
            title={
              organization.isActive
                ? t('dangerZoneDeactivateTitle')
                : t('dangerZoneReactivateTitle')
            }
            description={
              organization.isActive
                ? t('dangerZoneDeactivateDescription')
                : t('dangerZoneReactivateDescription')
            }
            action={
              organization.isActive ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeactivateOpen(true)}
                >
                  {t('deactivate')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleReactivate}
                  disabled={reactivateOrg.isPending}
                >
                  {reactivateOrg.isPending && (
                    <LoaderIcon className="animate-spin" />
                  )}
                  {t('reactivate')}
                </Button>
              )
            }
          />

          {/* Delete */}
          <DangerZoneItem
            title={t('dangerZoneTitle')}
            description={
              organization.isActive
                ? t('dangerZoneDeleteDescriptionActive')
                : t('dangerZoneDeleteDescriptionInactive')
            }
            action={
              organization.isActive ? (
                <Button variant="destructive" size="sm" disabled>
                  {t('deleteOrganization')}
                </Button>
              ) : (
                <HardDeleteConfirmation
                  entityName={organization.name}
                  warningTitle={t('deleteWarningTitle')}
                  warningDescription={t('deleteWarningDescription')}
                  confirmTitle={t('deleteConfirmTitle')}
                  confirmDescription={t('deleteConfirmDescription', {
                    name: organization.name,
                  })}
                  confirmButtonLabel={t('deleteButton')}
                  onConfirm={() => {
                    deleteOrg.mutate(
                      { publicId: organization.organizationId },
                      {
                        onSuccess: () => {
                          toast.success(t('deleteSuccess'));
                          router.push(paths.admin.organizations);
                        },
                        onError: (error) =>
                          toast.error(
                            getErrorMessage(error, t('deleteError'))
                          ),
                      }
                    );
                  }}
                  isPending={deleteOrg.isPending}
                  loadingLabel={tCommon('hardDelete.deleting')}
                  trigger={
                    <Button variant="destructive" size="sm">
                      {t('deleteOrganization')}
                    </Button>
                  }
                />
              )
            }
          />
        </DangerZone>
      </div>

      {/* Deactivate confirmation dialog */}
      <Dialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          if (deactivateOrg.isPending) return;
          if (!open) setDeactivateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deactivateTitle')}</DialogTitle>
            <DialogDescription>
              {t('deactivateDescription', { name: organization.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)} disabled={deactivateOrg.isPending}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateOrg.isPending}
            >
              {deactivateOrg.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('deactivate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Clean up OrganizationDetail — remove deactivate/reactivate state**

In `organization-detail.tsx`:

1. Remove imports: `useState`, `LoaderIcon`, `Dialog*` components, `ApiError` type
2. Remove hooks: `useDeactivateOrganization`, `useReactivateOrganization`
3. Remove state: `deactivateOpen`, `setDeactivateOpen`
4. Remove functions: `handleDeactivate`, `handleReactivate`
5. Remove `quickAction` prop from `EntityHeader`
6. Remove the deactivate confirmation `Dialog` JSX block (lines 130-161)

The cleaned `organization-detail.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { parseAsString, useQueryState } from 'nuqs';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/routes';

import { EntityHeader } from '../../components/entity-header';
import { useAdminOrganization } from '../hooks/use-admin-organizations';
import { OrganizationDangerZone } from './organization-danger-zone';
import { OrganizationDetailSkeleton } from './organization-detail-skeleton';
import { OrganizationDetailsForm } from './organization-details-form';
import { OrganizationInvitesTable } from './organization-invites-table';
import { OrganizationMembersTable } from './organization-members-table';

interface OrganizationDetailProps {
  organizationId: string;
}

export function OrganizationDetail({
  organizationId,
}: OrganizationDetailProps) {
  const t = useTranslations('admin.organizations');
  const { data: org, isPending } = useAdminOrganization(organizationId);
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault('details')
  );

  if (isPending) {
    return <OrganizationDetailSkeleton />;
  }

  if (!org) return null;

  return (
    <div className="space-y-6">
      <EntityHeader
        name={org.name}
        isActive={org.isActive}
        activeLabel={t('statusActive')}
        inactiveLabel={t('statusInactive')}
        identifiers={[org.slug, org.currencyCode, org.timezone]}
        backHref={paths.admin.organizations}
        backLabel={t('backToOrganizations')}
      />

      <Tabs value={tab} onValueChange={(val) => void setTab(val)}>
        <TabsList>
          <TabsTrigger value="details">{t('tabDetails')}</TabsTrigger>
          <TabsTrigger value="members">{t('tabMembers')}</TabsTrigger>
          <TabsTrigger value="invites">{t('tabInvites')}</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4 space-y-6">
          <OrganizationDetailsForm organization={org} />
          <OrganizationDangerZone organization={org} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <OrganizationMembersTable organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="invites" className="mt-4">
          <OrganizationInvitesTable organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 3: Verify type check passes**

Run: `pnpm type:check`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/organizations/components/organization-danger-zone.tsx src/features/admin/organizations/components/organization-detail.tsx
git commit -m "feat: move org deactivate/reactivate into danger zone"
```

---

## Task 5: Extract UserDangerZone and move deactivate/reactivate

**Files:**
- Create: `src/features/admin/users/components/user-danger-zone.tsx`
- Modify: `src/features/admin/users/components/user-details-tab.tsx`
- Modify: `src/features/admin/users/components/user-detail.tsx`

- [ ] **Step 1: Create UserDangerZone component**

Create `src/features/admin/users/components/user-danger-zone.tsx` — same pattern as `OrganizationDangerZone` but for users:

```tsx
'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { DangerZone, DangerZoneItem } from '@/components/shared/danger-zone';
import { HardDeleteConfirmation } from '@/components/shared/hard-delete-confirmation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { paths } from '@/config/routes';
import { useRouter } from '@/i18n/routing';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type { AdminUser } from '../../types';
import {
  useDeactivateUser,
  useDeleteUser,
  useReactivateUser,
} from '../hooks/use-admin-users';

interface UserDangerZoneProps {
  user: AdminUser;
}

export function UserDangerZone({ user }: UserDangerZoneProps) {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const deleteUser = useDeleteUser();
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  const displayName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

  function handleDeactivate() {
    deactivateUser.mutate(user.userId, {
      onSuccess: () => {
        toast.success(t('deactivateSuccess'));
        setDeactivateOpen(false);
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('deactivateError')));
      },
    });
  }

  function handleReactivate() {
    reactivateUser.mutate(user.userId, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <div />
        <DangerZone>
          {/* Deactivate / Reactivate */}
          <DangerZoneItem
            title={
              user.isActive
                ? t('dangerZoneDeactivateTitle')
                : t('dangerZoneReactivateTitle')
            }
            description={
              user.isActive
                ? t('dangerZoneDeactivateDescription')
                : t('dangerZoneReactivateDescription')
            }
            action={
              user.isActive ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeactivateOpen(true)}
                >
                  {t('deactivate')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleReactivate}
                  disabled={reactivateUser.isPending}
                >
                  {reactivateUser.isPending && (
                    <LoaderIcon className="animate-spin" />
                  )}
                  {t('reactivate')}
                </Button>
              )
            }
          />

          {/* Delete */}
          <DangerZoneItem
            title={t('dangerZoneTitle')}
            description={
              user.isActive
                ? t('dangerZoneDeleteDescriptionActive')
                : t('dangerZoneDeleteDescriptionInactive')
            }
            action={
              user.isActive ? (
                <Button variant="destructive" size="sm" disabled>
                  {t('deleteUser')}
                </Button>
              ) : (
                <HardDeleteConfirmation
                  entityName={user.email}
                  warningTitle={t('deleteWarningTitle')}
                  warningDescription={t('deleteWarningDescription')}
                  confirmTitle={t('deleteConfirmTitle')}
                  confirmDescription={t('deleteConfirmDescription', {
                    name: user.email,
                  })}
                  confirmButtonLabel={t('deleteButton')}
                  onConfirm={() => {
                    deleteUser.mutate(
                      { publicId: user.userId },
                      {
                        onSuccess: () => {
                          toast.success(t('deleteSuccess'));
                          router.push(paths.admin.users);
                        },
                        onError: (error) =>
                          toast.error(
                            getErrorMessage(error, t('deleteError'))
                          ),
                      }
                    );
                  }}
                  isPending={deleteUser.isPending}
                  loadingLabel={tCommon('hardDelete.deleting')}
                  trigger={
                    <Button variant="destructive" size="sm">
                      {t('deleteUser')}
                    </Button>
                  }
                />
              )
            }
          />
        </DangerZone>
      </div>

      {/* Deactivate confirmation dialog */}
      <Dialog
        open={deactivateOpen}
        onOpenChange={(open) => {
          if (deactivateUser.isPending) return;
          if (!open) setDeactivateOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deactivateTitle')}</DialogTitle>
            <DialogDescription>
              {t('deactivateDescription', { name: displayName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)} disabled={deactivateUser.isPending}>
              {tCommon('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateUser.isPending}
            >
              {deactivateUser.isPending && (
                <LoaderIcon className="animate-spin" />
              )}
              {t('deactivate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 2: Simplify UserDetailsTab — remove inline danger zone**

Replace the danger zone section in `user-details-tab.tsx` with the new component. The file should:

1. Remove imports: `DangerZone`, `DangerZoneItem`, `HardDeleteConfirmation`, `Button`, `paths`, `useRouter`, `getErrorMessage`, `useDeleteUser`, `toast`
2. Remove the `deleteUser` hook and the entire danger zone grid section (lines ~74-122)
3. Import and render `UserDangerZone`:

```tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import type { AdminUser } from '../../types';
import { UserDangerZone } from './user-danger-zone';

interface UserDetailsTabProps {
  user: AdminUser;
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[200px_1fr]">
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function UserDetailsTab({ user }: UserDetailsTabProps) {
  const t = useTranslations('admin.users');
  const format = useFormatter();

  return (
    <div className="max-w-4xl space-y-6">
      {/* Section: User Info (read-only) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">{t('sectionUserInfo')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('sectionUserInfoDescription')}
          </p>
        </div>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <InfoRow label={t('labelEmail')} value={user.email} />
            <InfoRow
              label={t('labelFirstName')}
              value={user.firstName ?? '-'}
            />
            <InfoRow
              label={t('labelLastName')}
              value={user.lastName ?? '-'}
            />
            <InfoRow
              label={t('labelCreatedAt')}
              value={format.dateTime(new Date(user.createdAt), {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Danger Zone */}
      <UserDangerZone user={user} />
    </div>
  );
}
```

- [ ] **Step 3: Clean up UserDetail — remove deactivate/reactivate state**

In `user-detail.tsx`:

1. Remove imports: `useState`, `LoaderIcon`, `Dialog*` components, `ApiError` type, `toast`, `getErrorMessage`
2. Remove hooks: `useDeactivateUser`, `useReactivateUser`
3. Remove state: `deactivateOpen`, `setDeactivateOpen`
4. Remove functions: `handleDeactivate`, `handleReactivate`
5. Remove `quickAction` prop from `EntityHeader`
6. Remove the deactivate confirmation `Dialog` JSX block (lines 125-156)

The cleaned `user-detail.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { parseAsString, useQueryState } from 'nuqs';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/routes';

import { EntityHeader } from '../../components/entity-header';
import { useAdminUser } from '../hooks/use-admin-users';
import { UserDetailSkeleton } from './user-detail-skeleton';
import { UserDetailsTab } from './user-details-tab';
import { UserOrganizationsTable } from './user-organizations-table';

interface UserDetailProps {
  id: string;
}

export function UserDetail({ id }: UserDetailProps) {
  const t = useTranslations('admin.users');
  const { data: user, isPending } = useAdminUser(id);
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault('details')
  );

  if (isPending) {
    return <UserDetailSkeleton />;
  }

  if (!user) return null;

  const displayName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

  return (
    <div className="space-y-6">
      <EntityHeader
        name={displayName}
        isActive={user.isActive}
        activeLabel={t('statusActive')}
        inactiveLabel={t('statusInactive')}
        identifiers={[user.email]}
        backHref={paths.admin.users}
        backLabel={t('backToUsers')}
      />

      <Tabs value={tab} onValueChange={(val) => void setTab(val)}>
        <TabsList>
          <TabsTrigger value="details">{t('tabDetails')}</TabsTrigger>
          <TabsTrigger value="organizations">
            {t('tabOrganizations')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="mt-4">
          <UserDetailsTab user={user} />
        </TabsContent>

        <TabsContent value="organizations" className="mt-4">
          <UserOrganizationsTable organizations={user.organizations} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 4: Verify type check passes**

Run: `pnpm type:check`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/users/components/user-danger-zone.tsx src/features/admin/users/components/user-details-tab.tsx src/features/admin/users/components/user-detail.tsx
git commit -m "feat: extract UserDangerZone, move user deactivate/reactivate into danger zone"
```

---

## Task 6: Create admin roles lookup endpoint (API)

**Files:**
- Create: `../propentro-api/src/Propentro.Contracts/Admin/Organizations/AdminOrgRoleResponse.cs`
- Create: `../propentro-api/src/Propentro.Application/Features/Admin/Organizations/Queries/GetOrganizationRoles/GetOrganizationRolesQuery.cs`
- Create: `../propentro-api/src/Propentro.Application/Features/Admin/Organizations/Queries/GetOrganizationRoles/GetOrganizationRolesHandler.cs`
- Modify: `../propentro-api/src/Propentro.Api/Endpoints/Admin/AdminOrganizationEndpoints.cs`

- [ ] **Step 1: Create the DTO**

Create `../propentro-api/src/Propentro.Contracts/Admin/Organizations/AdminOrgRoleResponse.cs`:

```csharp
namespace Propentro.Contracts.Admin.Organizations;

public sealed record AdminOrgRoleResponse
{
    public string RoleId { get; init; } = null!;
    public string Name { get; init; } = null!;
    public bool IsSystem { get; init; }
}
```

- [ ] **Step 2: Create the MediatR query record**

Create `../propentro-api/src/Propentro.Application/Features/Admin/Organizations/Queries/GetOrganizationRoles/GetOrganizationRolesQuery.cs`:

```csharp
using Propentro.Contracts.Admin.Organizations;

namespace Propentro.Application.Features.Admin.Organizations.Queries.GetOrganizationRoles;

public sealed record GetOrganizationRolesQuery(string OrganizationPublicId)
    : IQuery<List<AdminOrgRoleResponse>>;
```

- [ ] **Step 3: Create the Dapper query handler**

Create `../propentro-api/src/Propentro.Application/Features/Admin/Organizations/Queries/GetOrganizationRoles/GetOrganizationRolesHandler.cs`:

Follow the existing pattern from `GetOrganizationHandler.cs` — use `IDbConnectionFactory`, Dapper, snake_case aliases.

```csharp
using Dapper;
using Propentro.Application.Common.Errors;
using Propentro.Application.Common.Models;
using Propentro.Contracts.Admin.Organizations;

namespace Propentro.Application.Features.Admin.Organizations.Queries.GetOrganizationRoles;

public sealed class GetOrganizationRolesHandler(
    IDbConnectionFactory db) : IQueryHandler<GetOrganizationRolesQuery, List<AdminOrgRoleResponse>>
{
    public async Task<Result<List<AdminOrgRoleResponse>>> Handle(
        GetOrganizationRolesQuery request, CancellationToken cancellationToken)
    {
        await using var connection = db.CreateConnection();
        await connection.OpenAsync(cancellationToken);

        // First resolve the internal org ID from public ID
        const string orgSql = "SELECT id FROM organizations WHERE public_id = @PublicId";
        var orgId = await connection.QueryFirstOrDefaultAsync<Guid?>(
            orgSql, new { PublicId = request.OrganizationPublicId });

        if (orgId is null)
            return OrganizationErrors.NotFound;

        const string sql = """
            SELECT
                r.public_id  AS role_id,
                r.name       AS name,
                r.is_system  AS is_system
            FROM roles r
            WHERE (r.organization_id = @OrgId OR (r.is_system = TRUE AND r.organization_id IS NULL))
              AND r.is_active = TRUE
            ORDER BY r.is_system DESC, r.name ASC
            """;

        var roles = await connection.QueryAsync<AdminOrgRoleResponse>(
            sql, new { OrgId = orgId });

        return roles.ToList();
    }
}
```

Note: Use `OrganizationErrors.NotFound` from `Propentro.Application.Common.Errors` — this is what the existing `GetOrganizationHandler.cs` uses. Do NOT use `AdminOrganizationErrors` (that class only has `SlugTaken`, `AlreadyInactive`, `AlreadyActive`).

- [ ] **Step 4: Register the endpoint**

In `../propentro-api/src/Propentro.Api/Endpoints/Admin/AdminOrganizationEndpoints.cs`, add inside `MapAdminOrganizationEndpoints`:

Add the using statement at the top:
```csharp
using Propentro.Application.Features.Admin.Organizations.Queries.GetOrganizationRoles;
using Propentro.Contracts.Admin.Organizations;
```

Add the endpoint registration after the existing `group.MapDelete` call:

```csharp
group.MapGet("/{id}/roles", GetRolesAsync)
    .WithName("AdminGetOrganizationRoles")
    .WithSummary("Get all roles for an organization (lookup)");
```

Add the handler method at the bottom of the class:

```csharp
private static async Task<IResult> GetRolesAsync(
    string id, ISender sender, CancellationToken ct)
{
    var result = await sender.Send(new GetOrganizationRolesQuery(id), ct);
    return result.ToHttpResult();
}
```

- [ ] **Step 5: Build the API to verify**

Run from `../propentro-api/`:
```bash
dotnet build
```
Expected: Build succeeded

- [ ] **Step 6: Commit**

```bash
cd ../propentro-api
git add src/Propentro.Contracts/Admin/Organizations/AdminOrgRoleResponse.cs src/Propentro.Application/Features/Admin/Organizations/Queries/GetOrganizationRoles/ src/Propentro.Api/Endpoints/Admin/AdminOrganizationEndpoints.cs
git commit -m "feat: add admin roles lookup endpoint GET /v1/admin/organizations/{id}/roles"
```

---

## Task 7: Update frontend to consume new roles response

**Files:**
- Modify: `src/features/admin/organizations/hooks/use-admin-org-roles.ts`
- Modify: `src/features/admin/types/index.ts`
- Modify: `src/features/admin/organizations/components/create-invite-dialog.tsx`

- [ ] **Step 1: Add isSystem to AdminOrgRole type**

In `src/features/admin/types/index.ts`, the `AdminOrgRole` type is not currently defined here — it's defined in the hook file. Check if there's a duplicate. The hook file (`use-admin-org-roles.ts`) defines it locally. Move it to the shared types file or update in place.

Update in `src/features/admin/organizations/hooks/use-admin-org-roles.ts`:

```tsx
import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import { adminKeys } from '../../hooks/admin-query-keys';

export type AdminOrgRole = {
  roleId: string;
  name: string;
  isSystem: boolean;
};

export const adminOrgRolesQueryOptions = (orgPublicId: string) =>
  queryOptions({
    queryKey: adminKeys.organizations.roles(orgPublicId),
    queryFn: () =>
      apiClient.get<AdminOrgRole[]>(
        `/admin/organizations/${orgPublicId}/roles`
      ),
    enabled: !!orgPublicId,
  });

export function useAdminOrgRoles(orgPublicId: string) {
  return useQuery(adminOrgRolesQueryOptions(orgPublicId));
}
```

Changes:
- Added `isSystem: boolean` to `AdminOrgRole`
- Changed `PagedResult<AdminOrgRole>` → `AdminOrgRole[]`
- Removed `PagedResult` import

- [ ] **Step 2: Update invite dialog to filter system roles**

In `src/features/admin/organizations/components/create-invite-dialog.tsx`:

Change line 51 from:
```tsx
const roles = rolesData?.items;
```
To:
```tsx
const roles = rolesData?.filter((r) => !r.isSystem);
```

- [ ] **Step 3: Verify type check passes**

Run: `pnpm type:check`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/organizations/hooks/use-admin-org-roles.ts src/features/admin/organizations/components/create-invite-dialog.tsx
git commit -m "feat: filter system roles from invite dialog, update hook for flat array response"
```

---

## Task 8: Final verification

- [ ] **Step 1: Run full type check**

Run: `pnpm type:check`
Expected: No errors

- [ ] **Step 2: Run lint**

Run: `pnpm lint`
Expected: No new errors (pre-existing errors are documented)

- [ ] **Step 3: Run API build**

Run from `../propentro-api/`: `dotnet build`
Expected: Build succeeded

- [ ] **Step 4: Manual smoke test checklist**

With both API and frontend running:

1. **Org detail page** — verify:
   - No quick-action button in header
   - Danger zone shows deactivate + delete (with separator between them)
   - Deactivate button opens confirmation dialog
   - After deactivating, danger zone shows reactivate + delete (delete enabled)
   - Delete description changes based on active/inactive state
   - Reactivate fires immediately (no dialog)

2. **User detail page** — verify same behavior as org

3. **Invite dialog** — verify:
   - Role dropdown only shows non-system roles
   - System roles are not visible in the dropdown

- [ ] **Step 5: Commit any remaining fixes**

If any issues found during smoke test, fix and commit.
