# Admin Dashboard v1.0.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit, harden, and polish the existing admin dashboard to production-ready v1.0.0 quality — no new features, only consistency, completeness, and best-practice UX patterns.

**Architecture:** Refactor existing admin pages (organizations, users, invites) to enforce three UX patterns: two-column section forms, entity header + tabs, URL-synced list pages. Create a shared `EntityHeader` component. Restructure organization detail into sectioned form, user detail into read-only display + tabs, and standardize all badge variants and page sizes.

**Tech Stack:** Next.js 16, React 19, TypeScript, shadcn/ui v4, TanStack Query, nuqs, next-intl, Zod v4, react-hook-form

**Spec:** `docs/superpowers/specs/2026-03-19-admin-dashboard-v1-design.md`

---

## Prerequisites / Backend Blockers

The following fields are in the DB but NOT yet in the admin API response/request contracts. **Tasks that depend on these are marked with `[BLOCKED:API]`** and should be deferred until the backend is updated.

1. **`AdminOrganizationResponse`** — missing: `addressLine1`, `addressLine2`, `city`, `region`, `postalCode`, `countryCode`, `legalName`, `taxNumber`, `taxCountry`
2. **`UpdateOrganizationRequest`** — missing: `slug`, `addressLine1`, `addressLine2`, `city`, `region`, `postalCode`, `countryCode`, `legalName`, `taxNumber`, `taxCountry`
3. **`UserOrganizationInfo`** (in `AdminUserResponse`) — missing: `status` (membership status), `joinedAt`

All non-blocked tasks can proceed immediately with the current backend.

---

## File Structure

### New Files

| File | Responsibility |
|---|---|
| `src/features/admin/components/entity-header.tsx` | Reusable entity header (name, status badge, identifiers, quick actions, back link) |
| `src/features/admin/organizations/components/organization-details-form.tsx` | Two-column section form replacing `organization-info-form.tsx` |
| `src/features/admin/users/components/user-details-tab.tsx` | Read-only user info display + danger zone |
| `src/features/admin/users/components/user-organizations-table.tsx` | User's organization memberships table (extracted from user-detail.tsx) |

### Modified Files

| File | Changes |
|---|---|
| `src/features/admin/types/index.ts` | Add address/legal/tax fields to `AdminOrganization` + `UpdateOrganizationInput`; add `status`/`joinedAt` to `UserOrganizationInfo`; fix `inviteStatusVariant` |
| `src/features/admin/components/admin-sidebar.tsx` | Remove Dashboard nav item |
| `src/features/admin/organizations/components/organizations-list.tsx` | pageSize 10→25, full row click, outline badge for inactive |
| `src/features/admin/organizations/components/organization-detail.tsx` | Add EntityHeader, rename tab `info`→`details`, move deactivate to header |
| `src/features/admin/organizations/components/organization-danger-zone.tsx` | Remove deactivate/reactivate, keep only hard delete (disabled when active) |
| `src/features/admin/organizations/components/organization-members-table.tsx` | Fix badge variant for deactivated members (secondary→outline) |
| `src/features/admin/organizations/components/organization-invites-table.tsx` | Add invitedBy + createdAt columns |
| `src/features/admin/organizations/validators/update-organization.schema.ts` | Add slug + address + legal/tax fields |
| `src/features/admin/users/components/users-list.tsx` | pageSize 10→25, full row click, outline badge, reorder columns (Name first) |
| `src/features/admin/users/components/user-detail.tsx` | Restructure to EntityHeader + tabs |
| `src/features/admin/invites/components/invites-list.tsx` | pageSize 10→25, add "Expired" filter option, fix status label display |
| `src/app/[locale]/admin/organizations/[id]/page.tsx` | Remove PageHeader (entity header handles it) |
| `src/app/[locale]/admin/users/[publicId]/page.tsx` | Remove PageHeader |
| `src/features/admin/organizations/components/organization-detail-skeleton.tsx` | Update to match new layout with entity header |
| `src/features/admin/users/components/user-detail-skeleton.tsx` | Create/update to match new layout |
| `messages/en.json` | Add new translation keys for entity header, sections, etc. |

### Deleted Files

| File | Reason |
|---|---|
| `src/features/admin/organizations/components/organization-info-form.tsx` | Replaced by `organization-details-form.tsx` |
| `src/features/admin/users/components/user-info-form.tsx` | User detail becomes read-only (SSO source of truth) |
| `src/features/admin/users/validators/update-user.schema.ts` | No longer needed — user edit form removed |

---

## Tasks

### Task 1: Add `warning` Badge Variant + Fix `inviteStatusVariant` Helper

**Files:**
- Modify: `src/components/ui/badge.tsx:11-22`
- Modify: `src/features/admin/types/index.ts:134-149`

The `Badge` component currently has no `warning` variant (only `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`). The spec requires `warning` (yellow) for pending invites. Additionally, `inviteStatusVariant` uses wrong variants: `outline` for pending (should be `warning`), `destructive` for canceled (should be `outline`), `secondary` for expired (should be `outline`).

- [ ] **Step 1: Add `warning` variant to Badge component**

In `src/components/ui/badge.tsx`, add `warning` to the `variant` object inside `badgeVariants`:

```typescript
warning:
  'bg-warning/10 text-warning focus-visible:ring-warning/20 dark:bg-warning/20 dark:focus-visible:ring-warning/40 [a]:hover:bg-warning/20',
```

Add it after the `destructive` variant entry. This follows the same pattern as `destructive` but uses the `warning` CSS variable (yellow/amber semantic). If `--warning` is not defined in the theme CSS, check `src/app/globals.css` and add appropriate warning color tokens (e.g., amber-500/amber-600).

- [ ] **Step 2: Update the `inviteStatusVariant` function**

In `src/features/admin/types/index.ts`, replace the function:

```typescript
export function inviteStatusVariant(
  status: string
): 'default' | 'warning' | 'outline' {
  switch (status.toLowerCase()) {
    case 'accepted':
      return 'default';
    case 'pending':
      return 'warning';
    case 'canceled':
    case 'expired':
      return 'outline';
    default:
      return 'outline';
  }
}
```

- [ ] **Step 3: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/badge.tsx src/features/admin/types/index.ts
git commit -m "fix(admin): add warning badge variant, correct invite status badge mappings"
```

---

### Task 2: Remove Dashboard Item from Admin Sidebar

**Files:**
- Modify: `src/features/admin/components/admin-sidebar.tsx:41-46`

The spec says the hub redirects to organizations — no Dashboard nav item needed.

- [ ] **Step 1: Remove the Dashboard nav item**

In `admin-sidebar.tsx`, remove the `AdminSidebarNav` block for Dashboard (lines 41-46) and the `LayoutDashboard` import from lucide-react.

Remove this block:
```tsx
<AdminSidebarNav
  item={{
    title: t('menu.dashboard'),
    href: '/admin',
    icon: LayoutDashboard,
  }}
/>
```

- [ ] **Step 2: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/admin-sidebar.tsx
git commit -m "fix(admin): remove Dashboard nav item from admin sidebar"
```

---

### Task 3: Add New i18n Translation Keys

**Files:**
- Modify: `messages/en.json`

Add all new translation keys needed for entity headers, two-column sections, tab renames, and new UI elements. This task adds the keys upfront so subsequent tasks can reference them.

- [ ] **Step 1: Add entity header translations**

Under `admin.organizations`, add/update:
```json
"backToOrganizations": "Back to Organizations",
"tabDetails": "Details",
"sectionGeneral": "General",
"sectionGeneralDescription": "Basic organization information",
"sectionContact": "Contact",
"sectionContactDescription": "Primary contact details for this organization",
"sectionAddress": "Address",
"sectionAddressDescription": "Physical address of the organization",
"sectionLegalTax": "Legal & Tax",
"sectionLegalTaxDescription": "Legal entity and tax registration details",
"sectionRegional": "Regional Settings",
"sectionRegionalDescription": "Currency and timezone configuration",
"labelSlug": "Slug",
"placeholderSlug": "organization-slug",
"slugWarning": "Changing the slug may affect Clerk organization sync",
"labelAddressLine1": "Address Line 1",
"placeholderAddressLine1": "Street address",
"labelAddressLine2": "Address Line 2",
"placeholderAddressLine2": "Apartment, suite, etc.",
"labelCity": "City",
"placeholderCity": "City",
"labelRegion": "Region",
"placeholderRegion": "State / Province",
"labelPostalCode": "Postal Code",
"placeholderPostalCode": "Postal code",
"labelCountryCode": "Country",
"labelLegalName": "Legal Name",
"placeholderLegalName": "Registered business name",
"labelTaxNumber": "Tax Number",
"placeholderTaxNumber": "Tax identification number",
"labelTaxCountry": "Tax Country",
"deleteDisabledTooltip": "Organization must be deactivated before it can be deleted"
```

Under `admin.users`, add/update:
```json
"backToUsers": "Back to Users",
"tabDetails": "Details",
"tabOrganizations": "Organizations",
"sectionUserInfo": "User Information",
"sectionUserInfoDescription": "Read-only user details from the authentication provider",
"labelEmail": "Email",
"labelFirstName": "First Name",
"labelLastName": "Last Name",
"labelCreatedAt": "Created At",
"columnMembershipStatus": "Membership Status",
"columnJoinedAt": "Joined At",
"statusDeactivated": "Deactivated",
"deleteDisabledTooltip": "User must be deactivated before they can be deleted"
```

Under `admin.invites`, add:
```json
"statusExpired": "Expired"
```

Under `admin.organizations`, add member status translation:
```json
"memberStatusActive": "Active",
"memberStatusDeactivated": "Deactivated"
```

- [ ] **Step 2: Verify no duplicate keys**

Run: `pnpm type:check`

- [ ] **Step 3: Commit**

```bash
git add messages/en.json
git commit -m "i18n(admin): add translation keys for entity headers, sections, and new UI elements"
```

---

### Task 4: Create EntityHeader Shared Component

**Files:**
- Create: `src/features/admin/components/entity-header.tsx`

Reusable component for organization and user detail pages. Shows name, status badge, key identifiers, quick action button, and back link.

- [ ] **Step 1: Create the EntityHeader component**

```tsx
'use client';

import { ArrowLeft, LoaderIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';

interface EntityHeaderProps {
  name: string;
  isActive: boolean;
  activeLabel: string;
  inactiveLabel: string;
  identifiers: string[];
  backHref: string;
  backLabel: string;
  quickAction: {
    label: string;
    onClick: () => void;
    isPending: boolean;
    variant: 'default' | 'destructive';
  };
  children?: ReactNode;
}

export function EntityHeader({
  name,
  isActive,
  activeLabel,
  inactiveLabel,
  identifiers,
  backHref,
  backLabel,
  quickAction,
  children,
}: EntityHeaderProps) {
  return (
    <div className="space-y-4">
      <Link
        href={backHref}
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
      >
        <ArrowLeft className="size-4" />
        {backLabel}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{name}</h1>
            <Badge variant={isActive ? 'default' : 'outline'}>
              {isActive ? activeLabel : inactiveLabel}
            </Badge>
          </div>
          {identifiers.length > 0 && (
            <p className="text-muted-foreground truncate text-sm">
              {identifiers.join(' · ')}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {children}
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
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/components/entity-header.tsx
git commit -m "feat(admin): create reusable EntityHeader component for detail pages"
```

---

### Task 5: Add `onRowClick` to DataTable + Organizations List Fixes

**Files:**
- Modify: `src/components/table/data-table.tsx` (add `onRowClick` prop)
- Modify: `src/features/admin/organizations/components/organizations-list.tsx`

Four changes: (0) add `onRowClick` support to shared DataTable, (1) `defaultPageSize: 10` → `25`, (2) full row click instead of name-column-only link, (3) inactive badge `destructive` → `outline`.

- [ ] **Step 1: Add `onRowClick` prop to DataTable**

In `src/components/table/data-table.tsx`, update the interface and component:

```tsx
import type { Row } from '@tanstack/react-table';
```

Update the interface:
```typescript
interface DataTableProps<TData> {
  table: ReactTableType<TData>;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: Row<TData>) => void;
}
```

Update the function signature:
```typescript
export function DataTable<TData>({
  table,
  isLoading = false,
  emptyMessage,
  className,
  onRowClick,
}: DataTableProps<TData>) {
```

Update the `<TableRow>` in the body (the one rendering data rows, not the empty/header row):
```tsx
<TableRow
  key={row.id}
  data-state={row.getIsSelected() ? 'selected' : undefined}
  onClick={() => onRowClick?.(row)}
  className={cn(onRowClick && 'cursor-pointer')}
>
```

- [ ] **Step 2: Update organizations-list.tsx — defaultPageSize**

Change line 67:
```typescript
} = useListParams({ defaultPageSize: 25 });
```

- [ ] **Step 3: Change name column from Link to plain text**

The name column currently renders a `<Link>`. Since the whole row will be clickable, change to plain text:

```typescript
columnHelper.accessor('name', {
  header: t('columnName'),
  cell: ({ getValue }) => (
    <span className="font-medium">{getValue()}</span>
  ),
}),
```

Remove the `Link` import from `@/i18n/routing` if no longer used elsewhere in this file.

- [ ] **Step 4: Fix inactive badge variant**

Change the `isActive` column cell:
```typescript
columnHelper.accessor('isActive', {
  header: t('columnStatus'),
  cell: ({ getValue }) => (
    <Badge variant={getValue() ? 'default' : 'outline'}>
      {getValue() ? t('statusActive') : t('statusInactive')}
    </Badge>
  ),
}),
```

- [ ] **Step 5: Add row click handler**

Add `useRouter` import and usage:
```tsx
import { useRouter } from '@/i18n/routing';
// ...inside the component:
const router = useRouter();
```

In the render section, update:
```tsx
<DataTable
  table={table}
  onRowClick={(row) => {
    router.push(`${paths.admin.organizations}/${row.original.organizationId}`);
  }}
/>
```

- [ ] **Step 6: Verify type-check passes and visual check**

Run: `pnpm type:check`
Run: `pnpm dev` — navigate to `/admin/organizations`, verify:
- Page loads with 25 rows per page default
- Clicking any row navigates to the org detail
- Inactive orgs show outline (muted) badge, not red

- [ ] **Step 7: Commit**

```bash
git add src/components/table/data-table.tsx src/features/admin/organizations/components/organizations-list.tsx
git commit -m "feat(admin): add DataTable onRowClick, org list — pageSize 25, row click, outline badge"
```

---

### Task 6: Users List — pageSize, Row Click, Badge Fix, Column Order

**Files:**
- Modify: `src/features/admin/users/components/users-list.tsx`

Same pattern as Task 5 plus reorder columns: Name (first+last), Email, User Status, Organization Count, Created At.

- [ ] **Step 1: Update defaultPageSize**

Change line 57:
```typescript
} = useListParams({ defaultPageSize: 25 });
```

- [ ] **Step 2: Reorder columns — Name first, Email second**

Swap the column order so Name comes first:
```typescript
columnHelper.accessor('firstName', {
  header: t('columnName'),
  cell: ({ row }) => {
    const { firstName, lastName } = row.original;
    return (
      <span className="font-medium">
        {`${firstName ?? ''} ${lastName ?? ''}`.trim() || '-'}
      </span>
    );
  },
}),
columnHelper.accessor('email', {
  header: t('columnEmail'),
}),
```

Remove the `Link` wrapping from the email column since the row will be clickable.

- [ ] **Step 3: Fix inactive badge variant**

```typescript
columnHelper.accessor('isActive', {
  header: t('columnStatus'),
  cell: ({ getValue }) => (
    <Badge variant={getValue() ? 'default' : 'outline'}>
      {getValue() ? t('statusActive') : t('statusInactive')}
    </Badge>
  ),
}),
```

- [ ] **Step 4: Add row click handler**

```tsx
import { useRouter } from '@/i18n/routing';
// ...
const router = useRouter();
// ...
<DataTable
  table={table}
  onRowClick={(row) => {
    router.push(`${paths.admin.users}/${row.original.userId}`);
  }}
/>
```

- [ ] **Step 5: Verify type-check and visual check**

Run: `pnpm type:check`

- [ ] **Step 6: Commit**

```bash
git add src/features/admin/users/components/users-list.tsx
git commit -m "fix(admin): users list — pageSize 25, full row click, outline badge, name-first column order"
```

---

### Task 7: Invites List — pageSize, Expired Filter

**Files:**
- Modify: `src/features/admin/invites/components/invites-list.tsx`

Three changes: (1) pageSize 10→25, (2) add "Expired" to status filter, (3) fix the status label display in `SelectValue` to handle expired.

- [ ] **Step 1: Update defaultPageSize**

Change line 66:
```typescript
} = useListParams({ defaultPageSize: 25 });
```

- [ ] **Step 2: Add "Expired" to filter options**

Update the `SelectValue` display logic (lines 228-234):
```tsx
<SelectValue placeholder={t('filterStatus')}>
  {status === 'all'
    ? t('allStatuses')
    : status === 'pending'
      ? t('statusPending')
      : status === 'accepted'
        ? t('statusAccepted')
        : status === 'expired'
          ? t('statusExpired')
          : t('statusCanceled')}
</SelectValue>
```

Add `expired` option to `SelectContent` (after canceled):
```tsx
<SelectItem value="expired">{t('statusExpired')}</SelectItem>
```

- [ ] **Step 3: Verify type-check and visual check**

Run: `pnpm type:check`

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/invites/components/invites-list.tsx
git commit -m "fix(admin): invites list — pageSize 25, add expired filter option"
```

---

### Task 8: Restructure Organization Danger Zone — Delete Only

**Files:**
- Modify: `src/features/admin/organizations/components/organization-danger-zone.tsx`

Remove deactivate/reactivate from danger zone (moves to entity header in Task 9). Keep only hard delete, disabled when org is active.

- [ ] **Step 1: Simplify to delete-only danger zone**

Rewrite the component:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { DangerZone, DangerZoneItem } from '@/components/shared/danger-zone';
import { HardDeleteConfirmation } from '@/components/shared/hard-delete-confirmation';
import { Button } from '@/components/ui/button';
import { paths } from '@/config/routes';
import { useRouter } from '@/i18n/routing';
import { getErrorMessage } from '@/lib/parse-api-error';

import type { AdminOrganization } from '../../types';
import { useDeleteOrganization } from '../hooks/use-admin-organizations';

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

  return (
    <div className="max-w-4xl">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <div />
        <DangerZone>
          <DangerZoneItem
            title={t('dangerZoneTitle')}
            description={t('dangerZoneDescription')}
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
                          toast.error(getErrorMessage(error, t('deleteError'))),
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
    </div>
  );
}
```

Key changes:
- Removed `useDeactivateOrganization`, `useReactivateOrganization` imports and hooks
- Removed deactivate/reactivate `DangerZoneItem` blocks and confirmation dialog
- Delete button is disabled when `organization.isActive === true`
- After successful delete → redirect to organizations list

- [ ] **Step 2: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/organizations/components/organization-danger-zone.tsx
git commit -m "refactor(admin): org danger zone — delete only, disabled when active, redirect after delete"
```

---

### Task 9: Restructure Organization Detail — Entity Header + Tabs + Two-Column Form

**Files:**
- Modify: `src/features/admin/organizations/components/organization-detail.tsx` (full rewrite)
- Modify: `src/app/[locale]/admin/organizations/[id]/page.tsx`
- Create: `src/features/admin/organizations/components/organization-details-form.tsx`
- Delete: `src/features/admin/organizations/components/organization-info-form.tsx`

Major restructure: add EntityHeader with deactivate/reactivate quick action, rename tab `info`→`details`, remove PageHeader from page.tsx, replace flat card form with two-column section layout. Tasks 9 and 10 from the original plan are merged here because they modify the same file (`organization-detail.tsx`).

- [ ] **Step 1: Update the page.tsx to remove PageHeader**

```tsx
import { getTranslations } from 'next-intl/server';

import { OrganizationDetail } from '@/features/admin/organizations/components/organization-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations('admin.organizations');
  return { title: `${t('detailTitle')} ${id} | Platform Admin | Propentro` };
}

export default async function AdminOrganizationDetailPage({ params }: Props) {
  const { id } = await params;

  return <OrganizationDetail organizationId={id} />;
}
```

- [ ] **Step 2: Create the two-column section form (organization-details-form.tsx)**

```tsx
'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { CurrencyPicker } from '@/components/shared/currency-picker';
import { FormField } from '@/components/shared/form-field';
import { PhoneInput } from '@/components/shared/phone-input';
import { TimezonePicker } from '@/components/shared/timezone-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import type { AdminOrganization, UpdateOrganizationInput } from '../../types';
import { useUpdateOrganization } from '../hooks/use-admin-organizations';
import { updateOrganizationSchema } from '../validators/update-organization.schema';

interface OrganizationDetailsFormProps {
  organization: AdminOrganization;
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

export function OrganizationDetailsForm({
  organization,
}: OrganizationDetailsFormProps) {
  const t = useTranslations('admin.organizations');
  const updateOrg = useUpdateOrganization(organization.organizationId);

  function handleUpdate(values: UpdateOrganizationInput) {
    updateOrg.mutate(values, {
      onSuccess: () => {
        toast.success(t('updateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('updateError')));
      },
    });
  }

  return (
    <div className="max-w-4xl">
      <Form<UpdateOrganizationInput>
        validationSchema={updateOrganizationSchema}
        onSubmit={handleUpdate}
        resetValues={{
          name: organization.name,
          contactName: organization.contactName ?? '',
          contactEmail: organization.contactEmail ?? '',
          contactPhone: organization.contactPhone ?? '',
          currencyCode: organization.currencyCode,
          timezone: organization.timezone,
        }}
      >
        {(methods) => {
          useUnsavedChanges(methods.formState.isDirty);

          return (
            <div className="space-y-6">
              {/* Section: General */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
                <SectionHeader
                  title={t('sectionGeneral')}
                  description={t('sectionGeneralDescription')}
                />
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FormField<UpdateOrganizationInput>
                          label={t('labelName')}
                          name="name"
                          placeholder={t('placeholderName')}
                          methods={methods}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Section: Contact */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
                <SectionHeader
                  title={t('sectionContact')}
                  description={t('sectionContactDescription')}
                />
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <FormField<UpdateOrganizationInput>
                          label={t('labelContactName')}
                          name="contactName"
                          placeholder={t('placeholderContactName')}
                          methods={methods}
                        />
                      </div>
                      <FormField<UpdateOrganizationInput>
                        label={t('labelContactEmail')}
                        name="contactEmail"
                        placeholder={t('placeholderContactEmail')}
                        methods={methods}
                        type="email"
                      />
                      <FormField<UpdateOrganizationInput>
                        label={t('labelContactPhone')}
                        name="contactPhone"
                        methods={methods}
                      >
                        <PhoneInput
                          value={methods.watch('contactPhone')}
                          onChange={(val) =>
                            methods.setValue('contactPhone', val, {
                              shouldDirty: true,
                            })
                          }
                        />
                      </FormField>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Section: Regional Settings */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
                <SectionHeader
                  title={t('sectionRegional')}
                  description={t('sectionRegionalDescription')}
                />
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField<UpdateOrganizationInput>
                        label={t('labelCurrency')}
                        name="currencyCode"
                        methods={methods}
                      >
                        <CurrencyPicker
                          value={methods.watch('currencyCode')}
                          onChange={(val) =>
                            methods.setValue('currencyCode', val, {
                              shouldDirty: true,
                            })
                          }
                        />
                      </FormField>
                      <FormField<UpdateOrganizationInput>
                        label={t('labelTimezone')}
                        name="timezone"
                        methods={methods}
                      >
                        <TimezonePicker
                          value={methods.watch('timezone')}
                          onChange={(val) =>
                            methods.setValue('timezone', val, {
                              shouldDirty: true,
                            })
                          }
                        />
                      </FormField>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Save button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={updateOrg.isPending}>
                  {updateOrg.isPending && (
                    <LoaderIcon className="animate-spin" />
                  )}
                  {t('saveChanges')}
                </Button>
              </div>
            </div>
          );
        }}
      </Form>
    </div>
  );
}
```

Key changes from old `organization-info-form.tsx`:
- Two-column section layout with `SectionHeader` + `Card` per section
- `max-w-4xl` container
- `useUnsavedChanges` hook for dirty form detection
- Properly typed `handleUpdate` (no unsafe casting)
- `PhoneInput` component for contact phone (was plain text input)
- `shouldDirty: true` on picker `setValue` calls

- [ ] **Step 3: Rewrite organization-detail.tsx with EntityHeader + new form import**

```tsx
'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/routes';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { EntityHeader } from '../../components/entity-header';
import {
  useAdminOrganization,
  useDeactivateOrganization,
  useReactivateOrganization,
} from '../hooks/use-admin-organizations';
import { OrganizationDangerZone } from './organization-danger-zone';
import { OrganizationDetailsForm } from './organization-details-form';
import { OrganizationDetailSkeleton } from './organization-detail-skeleton';
import { OrganizationInvitesTable } from './organization-invites-table';
import { OrganizationMembersTable } from './organization-members-table';

interface OrganizationDetailProps {
  organizationId: string;
}

export function OrganizationDetail({
  organizationId,
}: OrganizationDetailProps) {
  const t = useTranslations('admin.organizations');
  const tCommon = useTranslations('common');
  const { data: org, isPending } = useAdminOrganization(organizationId);
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault('details')
  );
  const deactivateOrg = useDeactivateOrganization();
  const reactivateOrg = useReactivateOrganization();
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  if (isPending) {
    return <OrganizationDetailSkeleton />;
  }

  if (!org) return null;

  function handleDeactivate() {
    deactivateOrg.mutate(org!.organizationId, {
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
    reactivateOrg.mutate(org!.organizationId, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  return (
    <div className="space-y-6">
      <EntityHeader
        name={org.name}
        isActive={org.isActive}
        activeLabel={t('statusActive')}
        inactiveLabel={t('statusInactive')}
        identifiers={[org.organizationId, org.slug, org.currencyCode, org.timezone]}
        backHref={paths.admin.organizations}
        backLabel={t('backToOrganizations')}
        quickAction={
          org.isActive
            ? {
                label: t('deactivate'),
                onClick: () => setDeactivateOpen(true),
                isPending: false,
                variant: 'destructive',
              }
            : {
                label: t('reactivate'),
                onClick: handleReactivate,
                isPending: reactivateOrg.isPending,
                variant: 'default',
              }
        }
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
              {t('deactivateDescription', { name: org.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>
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

- [ ] **Step 4: Delete the old info form**

Delete `src/features/admin/organizations/components/organization-info-form.tsx`.

- [ ] **Step 5: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 6: Commit**

```bash
git add src/features/admin/organizations/components/organization-detail.tsx src/features/admin/organizations/components/organization-details-form.tsx src/app/[locale]/admin/organizations/[id]/page.tsx
git rm src/features/admin/organizations/components/organization-info-form.tsx
git commit -m "refactor(admin): org detail — entity header, two-column form, deactivate in header, tab info→details"
```

---

### Task 10: Organization Members Table — Badge Variant Fix

**Files:**
- Modify: `src/features/admin/organizations/components/organization-members-table.tsx:146-153`

Fix membership status badge: `secondary` → `outline` for deactivated.

- [ ] **Step 1: Fix the status column badge**

Change line 149:
```typescript
memberColumnHelper.accessor('status', {
  header: t('memberColumnStatus'),
  cell: ({ getValue }) => (
    <Badge variant={getValue() === 'active' ? 'default' : 'outline'}>
      {getValue() === 'active'
        ? t('memberStatusActive')
        : t('memberStatusDeactivated')}
    </Badge>
  ),
}),
```

- [ ] **Step 2: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 3: Commit**

```bash
git add src/features/admin/organizations/components/organization-members-table.tsx
git commit -m "fix(admin): member status badge — secondary→outline for deactivated"
```

---

### Task 11: Organization Invites Table — Add Missing Columns

**Files:**
- Modify: `src/features/admin/organizations/components/organization-invites-table.tsx`

Add `invitedBy` and `createdAt` columns per spec.

- [ ] **Step 1: Add invitedBy and createdAt columns**

After the `status` column accessor, add:

```typescript
inviteColumnHelper.accessor('invitedBy', {
  header: t('inviteColumnInvitedBy'),
  cell: ({ getValue }) => getValue() ?? '-',
}),
inviteColumnHelper.accessor('createdAt', {
  header: t('inviteColumnCreated'),
  cell: ({ getValue }) => <RelativeTime date={getValue()} />,
}),
```

Ensure `RelativeTime` is imported (it already is in this file).

- [ ] **Step 2: Add missing translation keys if needed**

Check `messages/en.json` for `admin.organizations.inviteColumnInvitedBy` and `admin.organizations.inviteColumnCreated`. If missing, add them:

```json
"inviteColumnInvitedBy": "Invited By",
"inviteColumnCreated": "Created"
```

- [ ] **Step 3: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/organizations/components/organization-invites-table.tsx messages/en.json
git commit -m "feat(admin): org invites table — add invitedBy and createdAt columns"
```

---

### Task 12: Restructure User Detail — Entity Header + Tabs

**Files:**
- Modify: `src/features/admin/users/components/user-detail.tsx` (full rewrite)
- Create: `src/features/admin/users/components/user-details-tab.tsx`
- Create: `src/features/admin/users/components/user-organizations-table.tsx`
- Delete: `src/features/admin/users/components/user-info-form.tsx`
- Delete: `src/features/admin/users/validators/update-user.schema.ts`
- Modify: `src/app/[locale]/admin/users/[publicId]/page.tsx`

Major restructure: EntityHeader + tabs (Details, Organizations). Details tab shows read-only user info + danger zone. Organizations tab shows memberships table.

- [ ] **Step 1: Create user-details-tab.tsx (read-only info + danger zone)**

```tsx
'use client';

import { useFormatter, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { DangerZone, DangerZoneItem } from '@/components/shared/danger-zone';
import { HardDeleteConfirmation } from '@/components/shared/hard-delete-confirmation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { paths } from '@/config/routes';
import { useRouter } from '@/i18n/routing';
import { getErrorMessage } from '@/lib/parse-api-error';

import type { AdminUser } from '../../types';
import { useDeleteUser } from '../hooks/use-admin-users';

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
  const tCommon = useTranslations('common');
  const format = useFormatter();
  const router = useRouter();
  const deleteUser = useDeleteUser();

  const displayName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
        <div />
        <DangerZone>
          <DangerZoneItem
            title={t('dangerZoneTitle')}
            description={t('dangerZoneDescription')}
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
    </div>
  );
}
```

- [ ] **Step 2: Create user-organizations-table.tsx**

```tsx
'use client';

import {
  type ColumnDef,
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import { DataTable } from '@/components/table/data-table';
import { Badge } from '@/components/ui/badge';
import { paths } from '@/config/routes';
import { useRouter } from '@/i18n/routing';

import type { MemberRoleInfo, UserOrganizationInfo } from '../../types';

const columnHelper = createColumnHelper<UserOrganizationInfo>();

interface UserOrganizationsTableProps {
  organizations: UserOrganizationInfo[];
}

export function UserOrganizationsTable({
  organizations,
}: UserOrganizationsTableProps) {
  const t = useTranslations('admin.users');
  const router = useRouter();

  const columns = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: ColumnDef<UserOrganizationInfo, any>[] = [
      columnHelper.accessor('name', {
        header: t('columnOrgName'),
        cell: ({ getValue }) => (
          <span className="font-medium">{getValue()}</span>
        ),
      }),
      columnHelper.display({
        id: 'roles',
        header: t('columnRole'),
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.map((role: MemberRoleInfo) => (
              <Badge key={role.id} variant="secondary">
                {role.name}
              </Badge>
            ))}
          </div>
        ),
      }),
    ];
    return cols;
  }, [t]);

  const table = useReactTable({
    data: organizations,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (organizations.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t('noOrganizations')}
      </p>
    );
  }

  return (
    <DataTable
      table={table}
      onRowClick={(row) => {
        router.push(
          `${paths.admin.organizations}/${row.original.organizationId}`
        );
      }}
    />
  );
}
```

> **Note:** When the backend adds `status` and `joinedAt` to `UserOrganizationInfo`, add the Membership Status and Joined At columns here (see Task 17).

- [ ] **Step 3: Rewrite user-detail.tsx with EntityHeader + tabs**

```tsx
'use client';

import { LoaderIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { parseAsString, useQueryState } from 'nuqs';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { paths } from '@/config/routes';
import { getErrorMessage } from '@/lib/parse-api-error';
import type { ApiError } from '@/types/api.types';

import { EntityHeader } from '../../components/entity-header';
import {
  useAdminUser,
  useDeactivateUser,
  useReactivateUser,
} from '../hooks/use-admin-users';
import { UserDetailSkeleton } from './user-detail-skeleton';
import { UserDetailsTab } from './user-details-tab';
import { UserOrganizationsTable } from './user-organizations-table';

interface UserDetailProps {
  id: string;
}

export function UserDetail({ id }: UserDetailProps) {
  const t = useTranslations('admin.users');
  const tCommon = useTranslations('common');
  const { data: user, isPending } = useAdminUser(id);
  const deactivateUser = useDeactivateUser();
  const reactivateUser = useReactivateUser();
  const [tab, setTab] = useQueryState(
    'tab',
    parseAsString.withDefault('details')
  );
  const [deactivateOpen, setDeactivateOpen] = useState(false);

  if (isPending) {
    return <UserDetailSkeleton />;
  }

  if (!user) return null;

  const displayName =
    `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;

  function handleDeactivate() {
    deactivateUser.mutate(id, {
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
    reactivateUser.mutate(id, {
      onSuccess: () => {
        toast.success(t('reactivateSuccess'));
      },
      onError: (error: ApiError) => {
        toast.error(getErrorMessage(error, t('reactivateError')));
      },
    });
  }

  return (
    <div className="space-y-6">
      <EntityHeader
        name={displayName}
        isActive={user.isActive}
        activeLabel={t('statusActive')}
        inactiveLabel={t('statusInactive')}
        identifiers={[user.userId, user.email]}
        backHref={paths.admin.users}
        backLabel={t('backToUsers')}
        quickAction={
          user.isActive
            ? {
                label: t('deactivate'),
                onClick: () => setDeactivateOpen(true),
                isPending: false,
                variant: 'destructive',
              }
            : {
                label: t('reactivate'),
                onClick: handleReactivate,
                isPending: reactivateUser.isPending,
                variant: 'default',
              }
        }
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
            <Button variant="outline" onClick={() => setDeactivateOpen(false)}>
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

- [ ] **Step 4: Update page.tsx to remove PageHeader**

```tsx
import { getTranslations } from 'next-intl/server';

import { UserDetail } from '@/features/admin/users/components/user-detail';

interface Props {
  params: Promise<{ publicId: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { publicId } = await params;
  const t = await getTranslations('admin.users');
  return {
    title: `${t('detailTitle')} ${publicId} | Platform Admin | Propentro`,
  };
}

export default async function AdminUserDetailPage({ params }: Props) {
  const { publicId } = await params;

  return <UserDetail id={publicId} />;
}
```

- [ ] **Step 5: Delete obsolete files**

Delete:
- `src/features/admin/users/components/user-info-form.tsx`
- `src/features/admin/users/validators/update-user.schema.ts`

- [ ] **Step 6: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/users/components/user-detail.tsx src/features/admin/users/components/user-details-tab.tsx src/features/admin/users/components/user-organizations-table.tsx src/app/[locale]/admin/users/[publicId]/page.tsx
git rm src/features/admin/users/components/user-info-form.tsx src/features/admin/users/validators/update-user.schema.ts
git commit -m "refactor(admin): user detail — entity header + tabs, read-only info, danger zone with redirect"
```

---

### Task 13: Update Skeleton Components for New Layouts

**Files:**
- Modify: `src/features/admin/organizations/components/organization-detail-skeleton.tsx`
- Modify: `src/features/admin/users/components/user-detail-skeleton.tsx`

Update skeleton UI to match the new entity header + tabs layout.

- [ ] **Step 1: Read current skeleton files**

Read both skeleton files to understand their current structure.

- [ ] **Step 2: Update organization-detail-skeleton.tsx**

Replace with a skeleton that matches the entity header + tabs layout:

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function OrganizationDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Skeleton className="h-4 w-40" />

      {/* Entity header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-80" />

      {/* Content area */}
      <div className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
        <Skeleton className="h-px w-full" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update user-detail-skeleton.tsx**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function UserDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <Skeleton className="h-4 w-32" />

      {/* Entity header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-64" />

      {/* Content area */}
      <div className="max-w-4xl space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/organizations/components/organization-detail-skeleton.tsx src/features/admin/users/components/user-detail-skeleton.tsx
git commit -m "fix(admin): update detail page skeletons to match entity header + tabs layout"
```

---

### Task 14 [BLOCKED:API]: Add Address + Legal/Tax Fields to Organization Types, Schema, and Form

**Blocked by:** Backend must add `addressLine1`, `addressLine2`, `city`, `region`, `postalCode`, `countryCode`, `legalName`, `taxNumber`, `taxCountry` to `AdminOrganizationResponse` and `slug` + those fields to `UpdateOrganizationRequest`.

**Files:**
- Modify: `src/features/admin/types/index.ts` — add fields to `AdminOrganization` and `UpdateOrganizationInput`
- Modify: `src/features/admin/organizations/validators/update-organization.schema.ts` — add slug + address + legal/tax fields
- Modify: `src/features/admin/organizations/components/organization-details-form.tsx` — add Address and Legal & Tax sections

- [ ] **Step 1: Update AdminOrganization type**

Add to `AdminOrganization`:
```typescript
export type AdminOrganization = {
  // ... existing fields ...
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  legalName?: string;
  taxNumber?: string;
  taxCountry?: string;
};
```

- [ ] **Step 2: Update UpdateOrganizationInput type**

Add slug and new fields:
```typescript
export type UpdateOrganizationInput = {
  name: string;
  slug: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  countryCode?: string;
  legalName?: string;
  taxNumber?: string;
  taxCountry?: string;
  currencyCode: string;
  timezone: string;
};
```

- [ ] **Step 3: Update the Zod schema**

```typescript
import { z } from 'zod';

import {
  currencyCodeSchema,
  nullableCountryCode,
  nullableEmail,
  nullablePhone,
  nullableString,
  requiredString,
  slugSchema,
  timezoneSchema,
} from '@/lib/validators';

export const updateOrganizationSchema = z.object({
  name: requiredString('Name').max(200),
  slug: slugSchema,
  contactName: nullableString(),
  contactEmail: nullableEmail(),
  contactPhone: nullablePhone(),
  addressLine1: nullableString(),
  addressLine2: nullableString(),
  city: nullableString(),
  region: nullableString(),
  postalCode: nullableString(),
  countryCode: nullableCountryCode(),
  legalName: nullableString(),
  taxNumber: nullableString(),
  taxCountry: nullableCountryCode(),
  currencyCode: currencyCodeSchema,
  timezone: timezoneSchema,
});

export type UpdateOrganizationFormValues = z.input<
  typeof updateOrganizationSchema
>;
```

- [ ] **Step 4: Add sections to organization-details-form.tsx**

Add slug field to General section. Add Address section and Legal & Tax section between Contact and Regional Settings.

In the `resetValues`, add all new fields:
```typescript
resetValues={{
  name: organization.name,
  slug: organization.slug,
  contactName: organization.contactName ?? '',
  contactEmail: organization.contactEmail ?? '',
  contactPhone: organization.contactPhone ?? '',
  addressLine1: organization.addressLine1 ?? '',
  addressLine2: organization.addressLine2 ?? '',
  city: organization.city ?? '',
  region: organization.region ?? '',
  postalCode: organization.postalCode ?? '',
  countryCode: organization.countryCode ?? '',
  legalName: organization.legalName ?? '',
  taxNumber: organization.taxNumber ?? '',
  taxCountry: organization.taxCountry ?? '',
  currencyCode: organization.currencyCode,
  timezone: organization.timezone,
}}
```

Add slug field in General section (with warning):
```tsx
<FormField<UpdateOrganizationInput>
  label={t('labelSlug')}
  name="slug"
  placeholder={t('placeholderSlug')}
  methods={methods}
/>
<p className="text-warning text-xs">{t('slugWarning')}</p>
```

Add Address section:
```tsx
<Separator />
<div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
  <SectionHeader
    title={t('sectionAddress')}
    description={t('sectionAddressDescription')}
  />
  <Card>
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField<UpdateOrganizationInput>
            label={t('labelAddressLine1')}
            name="addressLine1"
            placeholder={t('placeholderAddressLine1')}
            methods={methods}
          />
        </div>
        <div className="sm:col-span-2">
          <FormField<UpdateOrganizationInput>
            label={t('labelAddressLine2')}
            name="addressLine2"
            placeholder={t('placeholderAddressLine2')}
            methods={methods}
          />
        </div>
        <FormField<UpdateOrganizationInput>
          label={t('labelCity')}
          name="city"
          placeholder={t('placeholderCity')}
          methods={methods}
        />
        <FormField<UpdateOrganizationInput>
          label={t('labelRegion')}
          name="region"
          placeholder={t('placeholderRegion')}
          methods={methods}
        />
        <FormField<UpdateOrganizationInput>
          label={t('labelPostalCode')}
          name="postalCode"
          placeholder={t('placeholderPostalCode')}
          methods={methods}
        />
        <FormField<UpdateOrganizationInput>
          label={t('labelCountryCode')}
          name="countryCode"
          methods={methods}
        >
          <CountryPicker
            value={methods.watch('countryCode')}
            onChange={(val) =>
              methods.setValue('countryCode', val, { shouldDirty: true })
            }
          />
        </FormField>
      </div>
    </CardContent>
  </Card>
</div>
```

Add Legal & Tax section:
```tsx
<Separator />
<div className="grid grid-cols-1 gap-6 md:grid-cols-[250px_1fr]">
  <SectionHeader
    title={t('sectionLegalTax')}
    description={t('sectionLegalTaxDescription')}
  />
  <Card>
    <CardContent className="pt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <FormField<UpdateOrganizationInput>
            label={t('labelLegalName')}
            name="legalName"
            placeholder={t('placeholderLegalName')}
            methods={methods}
          />
        </div>
        <FormField<UpdateOrganizationInput>
          label={t('labelTaxNumber')}
          name="taxNumber"
          placeholder={t('placeholderTaxNumber')}
          methods={methods}
        />
        <FormField<UpdateOrganizationInput>
          label={t('labelTaxCountry')}
          name="taxCountry"
          methods={methods}
        >
          <CountryPicker
            value={methods.watch('taxCountry')}
            onChange={(val) =>
              methods.setValue('taxCountry', val, { shouldDirty: true })
            }
          />
        </FormField>
      </div>
    </CardContent>
  </Card>
</div>
```

Add `CountryPicker` import:
```typescript
import { CountryPicker } from '@/components/shared/country-picker';
```

- [ ] **Step 5: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 6: Commit**

```bash
git add src/features/admin/types/index.ts src/features/admin/organizations/validators/update-organization.schema.ts src/features/admin/organizations/components/organization-details-form.tsx
git commit -m "feat(admin): org detail — add slug, address, legal/tax fields to form"
```

---

### Task 15 [BLOCKED:API]: Add Membership Status + JoinedAt to User Organizations Table

**Blocked by:** Backend must add `status` and `joinedAt` to `UserOrganizationInfo` in `AdminUserResponse`.

**Files:**
- Modify: `src/features/admin/types/index.ts` — add `status` and `joinedAt` to `UserOrganizationInfo`
- Modify: `src/features/admin/users/components/user-organizations-table.tsx` — add columns

- [ ] **Step 1: Update UserOrganizationInfo type**

```typescript
export type UserOrganizationInfo = {
  organizationId: string;
  name: string;
  roles: MemberRoleInfo[];
  status: string; // 'active' | 'deactivated'
  joinedAt: ISODateTimeString;
};
```

- [ ] **Step 2: Add columns to user-organizations-table.tsx**

After the `roles` column, add:

```typescript
columnHelper.accessor('status', {
  header: t('columnMembershipStatus'),
  cell: ({ getValue }) => (
    <Badge variant={getValue() === 'active' ? 'default' : 'outline'}>
      {getValue() === 'active'
        ? t('statusActive')
        : t('statusDeactivated')}
    </Badge>
  ),
}),
columnHelper.accessor('joinedAt', {
  header: t('columnJoinedAt'),
  cell: ({ getValue }) => <RelativeTime date={getValue()} />,
}),
```

Add imports:
```typescript
import { RelativeTime } from '@/components/shared/relative-time';
```

- [ ] **Step 3: Verify type-check passes**

Run: `pnpm type:check`

- [ ] **Step 4: Commit**

```bash
git add src/features/admin/types/index.ts src/features/admin/users/components/user-organizations-table.tsx
git commit -m "feat(admin): user orgs table — add membership status and joinedAt columns"
```

---

### Task 16: Final Audit Pass

**Files:** All admin files

Run through the audit checklist from the spec for each of the 6 pages. This task is a verification pass, not implementation — fix any issues found.

- [ ] **Step 1: Verify loading states**

Check that every route has a `loading.tsx` that renders the correct skeleton:
- `src/app/[locale]/admin/organizations/loading.tsx` → `OrganizationsListSkeleton`
- `src/app/[locale]/admin/organizations/[id]/loading.tsx` → `OrganizationDetailSkeleton`
- `src/app/[locale]/admin/users/loading.tsx` → `UsersListSkeleton`
- `src/app/[locale]/admin/users/[publicId]/loading.tsx` → `UserDetailSkeleton`
- `src/app/[locale]/admin/invites/loading.tsx` → `InvitesListSkeleton`

- [ ] **Step 2: Verify error boundaries**

Check that `error.tsx` exists for admin routes:
- `src/app/[locale]/admin/error.tsx` — should exist with i18n text

- [ ] **Step 3: Verify not-found pages**

- `src/app/[locale]/admin/organizations/[id]/not-found.tsx`
- `src/app/[locale]/admin/users/[publicId]/not-found.tsx`

- [ ] **Step 4: Verify empty states**

All list pages should show icon + title + description + CTA (where applicable).

- [ ] **Step 5: Verify status badges are correct**

Across ALL admin pages, verify:
- Org Status: `default` (green) for active, `outline` for inactive — NEVER `destructive`
- User Status: same
- Membership Status: `default` for active, `outline` for deactivated
- Invite Status: `warning` for pending, `default` for accepted, `outline` for expired/canceled

- [ ] **Step 6: Verify pagination defaults**

All list pages should use `defaultPageSize: 25`.

- [ ] **Step 7: Verify dates use formatters**

All dates should use `<RelativeTime>` or `useFormatter().dateTime()`, never raw strings.

- [ ] **Step 8: Verify post-delete redirects**

- Org hard delete → redirect to `/admin/organizations`
- User hard delete → redirect to `/admin/users`

- [ ] **Step 9: Run full type-check and lint**

```bash
pnpm type:check && pnpm lint
```

Fix any issues found.

- [ ] **Step 10: Commit any fixes**

```bash
git add -A
git commit -m "fix(admin): final audit pass — fix issues found during comprehensive review"
```

---

## Execution Order

Tasks 1-13 can be executed in order as listed. They have minimal cross-dependencies:

1. **Task 1** — Add warning badge variant + fix inviteStatusVariant (foundation for badge consistency)
2. **Task 2** — Remove Dashboard from sidebar
3. **Task 3** — Add i18n keys (needed by subsequent tasks)
4. **Task 4** — Create EntityHeader (needed by Tasks 9 and 13)
5. **Task 5** — Add DataTable onRowClick + organizations list fixes
6. **Task 6** — Users list fixes (depends on Task 5 for DataTable onRowClick)
7. **Task 7** — Invites list fixes
8. **Task 8** — Organization danger zone restructure
9. **Task 9** — Organization detail restructure + two-column form (depends on Tasks 4, 8)
10. **Task 10** — Organization members badge fix
11. **Task 11** — Organization invites table columns
12. **Task 12** — User detail restructure (depends on Task 4)
13. **Task 13** — Update skeletons
14. **Task 14** — [BLOCKED:API] Org address/legal/tax fields
15. **Task 15** — [BLOCKED:API] User org membership status/joinedAt
16. **Task 16** — Final audit pass (after all other tasks)

**Parallelizable groups:**
- Tasks 1, 2 (independent foundation fixes)
- Tasks 5, 7 (list page fixes — Task 6 depends on 5 for DataTable change)
- Tasks 10, 11 (org sub-tables — independent)
- Tasks 14, 15 (both blocked, both independent)

**Note on invites list:** The invites list has no detail page to navigate to, so no `onRowClick` is added — this is intentional per the spec (row actions only for cancel).

**Hub page verification:** During the final audit (Task 16), verify that `src/app/[locale]/admin/page.tsx` still correctly redirects to `/admin/organizations`.
