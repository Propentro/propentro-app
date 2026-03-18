# Settings Feature Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the three settings sections (Organisation, Members, Roles & Permissions) with shared navigation infrastructure, permission gating, and production-grade UX.

**Architecture:** Vertical slice per section. Shared infra first (permissions, sidebar, nav), then each section independently. All hooks/types/schemas/i18n already exist — this plan covers UI components only. Each section is a self-contained client component receiving `canManage`/`canEdit` as props from server page components.

**Tech Stack:** Next.js 16 (App Router), React 19, shadcn/ui v4 (Base UI), TanStack React Table, react-hook-form + zod v4, TanStack Query, next-intl, sonner toasts.

**Spec:** `docs/superpowers/specs/2026-03-14-settings-feature-design.md`

**Note:** This project has no test infrastructure. Steps focus on implementation + type-check + lint verification. Add tests when test tooling is set up.

---

## Chunk 1: Shared Infrastructure

### Task 1: Add missing shadcn/ui components

**Files:**

- Create: `src/components/ui/checkbox.tsx` (via shadcn CLI)

The roles permission form needs checkboxes. No checkbox component exists yet.

- [ ] **Step 1: Install checkbox component**

```bash
pnpm dlx shadcn@latest add checkbox
```

- [ ] **Step 2: Verify it was created**

```bash
ls src/components/ui/checkbox.tsx
```

- [ ] **Step 3: Run type check**

```bash
pnpm type:check
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/checkbox.tsx
git commit -m "chore: add shadcn checkbox component"
```

---

### Task 2: Create permission constants

**Files:**

- Create: `src/config/permissions.ts`

**Reference:** `src/types/user.types.ts` (Permission type)

- [ ] **Step 1: Create permission constants file**

Create `src/config/permissions.ts`:

```typescript
import type { Permission } from '@/types/user.types';

export const PERMISSIONS = {
  settings: {
    read: 'org:settings:read' as Permission,
    update: 'org:settings:update' as Permission,
  },
  members: {
    read: 'org:members:read' as Permission,
    manage: 'org:members:manage' as Permission,
  },
  roles: {
    read: 'org:roles:read' as Permission,
    manage: 'org:roles:manage' as Permission,
  },
} as const;

/** All read permissions used to determine if Settings sidebar link is visible. */
export const ANY_SETTINGS_READ_PERMISSION: Permission[] = [
  PERMISSIONS.settings.read,
  PERMISSIONS.members.read,
  PERMISSIONS.roles.read,
];
```

- [ ] **Step 2: Update page files to use constants**

Update `src/app/[locale]/[orgSlug]/settings/organization/page.tsx` — replace string literals with `PERMISSIONS.settings.read` and `PERMISSIONS.settings.update`.

Do the same for `members/page.tsx` (use `PERMISSIONS.members`) and `roles/page.tsx` (use `PERMISSIONS.roles`).

- [ ] **Step 3: Run type check + lint**

```bash
pnpm type:check && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add src/config/permissions.ts src/app/[locale]/[orgSlug]/settings/
git commit -m "feat: add centralised permission constants"
```

---

### Task 3: Add Settings link to sidebar

**Files:**

- Modify: `src/components/layout/app-sidebar.tsx`

**Reference:** Existing sidebar structure uses `SidebarGroup` + `SidebarGroupLabel` + `SidebarNav` for each nav item. Permission check via `useHasPermission()` from `src/hooks/use-me.ts`.

- [ ] **Step 1: Add Settings group to sidebar**

In `app-sidebar.tsx`, add a new `SidebarGroup` after the existing "Overview" group:

- Import `Settings` icon from `lucide-react`
- Import `Settings` icon from `lucide-react`
- Import `ANY_SETTINGS_READ_PERMISSION` from `@/config/permissions`
- Import `useMe` from `@/hooks/use-me`
- Import `paths` from `@/config/routes`
- Get user via `const { permissions } = useMe()`
- Check visibility: `const showSettings = ANY_SETTINGS_READ_PERMISSION.some(p => permissions.includes(p))`
- If `showSettings`, render a Settings group with one item: `{ title: t('menu.settings'), href: paths.settings.organization, icon: Settings }`
- Use the existing `SidebarNav` component for the item
- **Do NOT use `useHasPermission` in a loop** — it's a hook and cannot be called conditionally. Use `permissions.includes()` instead.

The group label should use `t('layout.sidebar.settings')` — add this i18n key.

- [ ] **Step 2: Add missing i18n keys**

In `messages/en.json`, add under `layout.sidebar`:

```json
"settings": "Settings"
```

And add a `menu.settings` key if the sidebar uses `menu.*` namespace — check existing nav items for the exact namespace.

- [ ] **Step 3: Run type check + lint + dev server visual check**

```bash
pnpm type:check && pnpm lint
```

Start dev server and verify the Settings link appears in the sidebar.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-sidebar.tsx messages/en.json
git commit -m "feat: add settings link to sidebar with permission gating"
```

---

### Task 4: Enhance settings-nav with permission filtering

**Files:**

- Modify: `src/features/settings/components/settings-nav.tsx`

**Reference:** Current settings-nav renders all 3 tabs unconditionally. Needs to filter based on permissions.

- [ ] **Step 1: Add permission filtering to settings-nav**

In `settings-nav.tsx`:

- Import `useHasPermission` from `@/hooks/use-me`
- Import `PERMISSIONS` from `@/config/permissions`
- Define tab items as an array with permission requirement:
  ```typescript
  const tabs = [
    {
      key: 'settingsOrganization',
      href: paths.settings.organization,
      permission: PERMISSIONS.settings.read,
    },
    {
      key: 'settingsMembers',
      href: paths.settings.members,
      permission: PERMISSIONS.members.read,
    },
    {
      key: 'settingsRoles',
      href: paths.settings.roles,
      permission: PERMISSIONS.roles.read,
    },
  ];
  ```
- Get permissions: `const { permissions } = useMe()`
- Filter tabs: `tabs.filter(tab => permissions.includes(tab.permission))`
- **Do NOT use `useHasPermission` in a loop** — use `useMe()` + `permissions.includes()` for array filtering

- [ ] **Step 2: Run type check + lint**

```bash
pnpm type:check && pnpm lint
```

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/components/settings-nav.tsx
git commit -m "feat: permission-gate settings navigation tabs"
```

---

### Task 5: Add /settings redirect page

**Files:**

- Create: `src/app/[locale]/[orgSlug]/settings/page.tsx`

When user navigates to `/settings`, redirect to the first accessible tab.

- [ ] **Step 1: Create settings index page with redirect**

Create `src/app/[locale]/[orgSlug]/settings/page.tsx`:

```typescript
import { redirect } from '@/i18n/routing';

import { PERMISSIONS } from '@/config/permissions';
import { paths } from '@/config/routes';
import { hasPermission } from '@/lib/auth';

interface Props {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function SettingsPage({ params }: Props) {
  const { locale, orgSlug } = await params;

  // Redirect to first accessible settings tab
  const permissionToPath = [
    {
      permission: PERMISSIONS.settings.read,
      path: paths.settings.organization,
    },
    { permission: PERMISSIONS.members.read, path: paths.settings.members },
    { permission: PERMISSIONS.roles.read, path: paths.settings.roles },
  ];

  for (const { permission, path } of permissionToPath) {
    if (await hasPermission(permission)) {
      redirect({ href: `/${orgSlug}${path}`, locale });
    }
  }

  // No settings permissions at all — redirect to access denied
  redirect({ href: '/access-denied', locale });
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm type:check
```

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/[orgSlug]/settings/page.tsx
git commit -m "feat: add /settings redirect to first accessible tab"
```

---

### Task 6: Create useUnsavedChanges hook

**Files:**

- Create: `src/hooks/use-unsaved-changes.ts`

Tracks form dirty state and warns on page leave / tab navigation.

- [ ] **Step 1: Create the hook**

Create `src/hooks/use-unsaved-changes.ts`:

```typescript
'use client';

import { useEffect } from 'react';

/**
 * Warns user before leaving the page when there are unsaved changes.
 * Uses the browser's native `beforeunload` event.
 */
export function useUnsavedChanges(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);
}
```

- [ ] **Step 2: Run type check**

```bash
pnpm type:check
```

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-unsaved-changes.ts
git commit -m "feat: add useUnsavedChanges hook for form dirty state guard"
```

---

## Chunk 2: Organisation Settings

### Task 7: Create organisation settings skeleton

**Files:**

- Create: `src/features/settings/organization/components/org-settings-skeleton.tsx`

- [ ] **Step 1: Create skeleton component**

Create `src/features/settings/organization/components/org-settings-skeleton.tsx`:

```typescript
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton for 5-section org settings form. */
export function OrgSettingsSkeleton() {
  return (
    <div className="max-w-3xl space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-64" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/settings/organization/components/org-settings-skeleton.tsx
git commit -m "feat: add organisation settings skeleton"
```

---

### Task 8: Build organisation settings form

**Files:**

- Create: `src/features/settings/organization/components/org-settings-form.tsx`

**Reference:**

- Schema: `src/features/settings/organization/validators/org-settings.schema.ts`
- Hooks: `src/features/settings/organization/hooks/use-org-settings.ts` — `useOrgSettings()`, `useUpdateOrgSettings()`, `toOrgSettingsInput()`
- i18n: `settings.organization.*` in `messages/en.json`
- Form wrapper: `src/components/ui/form.tsx` — render prop pattern: `<Form<T> validationSchema={schema} resetValues={data} onSubmit={handler}>{(methods) => ...}</Form>`
- Components: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` from `@/components/ui/card`

This is the largest single component. It's a form with 5 card sections.

- [ ] **Step 1: Create the form component**

Create `src/features/settings/organization/components/org-settings-form.tsx`:

```typescript
'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes';

import {
  toOrgSettingsInput,
  useOrgSettings,
  useUpdateOrgSettings,
} from '../hooks/use-org-settings';
import {
  orgSettingsDefaults,
  orgSettingsSchema,
  type OrgSettingsInput,
} from '../validators/org-settings.schema';
import { OrgSettingsSkeleton } from './org-settings-skeleton';

interface OrgSettingsFormProps {
  canEdit: boolean;
}

export function OrgSettingsForm({ canEdit }: OrgSettingsFormProps) {
  const t = useTranslations('settings.organization');
  const { data, isLoading } = useOrgSettings();
  const { mutate, isPending } = useUpdateOrgSettings();

  const resetValues = data ? toOrgSettingsInput(data) : orgSettingsDefaults;

  if (isLoading) return <OrgSettingsSkeleton />;

  const handleSubmit = (values: OrgSettingsInput) => {
    // Zod transforms run at runtime via resolver, producing OrgSettingsOutput.
    // TypeScript sees OrgSettingsInput here, but the actual data matches OrgSettingsOutput.
    const payload = orgSettingsSchema.parse(values);
    mutate(payload, {
      onSuccess: () => toast.success(t('saveSuccess')),
      onError: (error) => toast.error(error.detail ?? t('saveError')),
    });
  };

  return (
    <Form<OrgSettingsInput>
      validationSchema={orgSettingsSchema}
      resetValues={resetValues}
      onSubmit={handleSubmit}
      className="max-w-3xl space-y-4"
    >
      {(methods) => {
        const { register, formState } = methods;
        const { errors, isDirty } = formState;
        const disabled = !canEdit || isPending;

        // eslint-disable-next-line react-hooks/rules-of-hooks
        useUnsavedChanges(isDirty);

        return (
          <>
            {/* Read-only banner */}
            {!canEdit && (
              <div className="bg-muted text-muted-foreground rounded-md border p-3 text-sm">
                {t('readOnlyNotice')}
              </div>
            )}

            {/* Section 1: Organisation Profile */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sectionProfile')}</CardTitle>
                <CardDescription>
                  {t('sectionProfileDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="name">{t('name')} *</Label>
                  <Input
                    id="name"
                    placeholder={t('namePlaceholder')}
                    disabled={disabled}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-destructive mt-1 text-xs">
                      {errors.name.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Primary Contact */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sectionContact')}</CardTitle>
                <CardDescription>
                  {t('sectionContactDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contactName">{t('contactName')}</Label>
                  <Input
                    id="contactName"
                    placeholder={t('contactNamePlaceholder')}
                    disabled={disabled}
                    {...register('contactName')}
                  />
                </div>
                <div>
                  <Label htmlFor="contactEmail">{t('contactEmail')}</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder={t('contactEmailPlaceholder')}
                    disabled={disabled}
                    {...register('contactEmail')}
                  />
                  {errors.contactEmail && (
                    <p className="text-destructive mt-1 text-xs">
                      {errors.contactEmail.message}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="contactPhone">{t('contactPhone')}</Label>
                  <Input
                    id="contactPhone"
                    placeholder={t('contactPhonePlaceholder')}
                    disabled={disabled}
                    {...register('contactPhone')}
                  />
                  {errors.contactPhone && (
                    <p className="text-destructive mt-1 text-xs">
                      {errors.contactPhone.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section 3: Address */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sectionAddress')}</CardTitle>
                <CardDescription>
                  {t('sectionAddressDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="addressLine1">{t('addressLine1')}</Label>
                  <Input
                    id="addressLine1"
                    placeholder={t('addressLine1Placeholder')}
                    disabled={disabled}
                    {...register('addressLine1')}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="addressLine2">{t('addressLine2')}</Label>
                  <Input
                    id="addressLine2"
                    placeholder={t('addressLine2Placeholder')}
                    disabled={disabled}
                    {...register('addressLine2')}
                  />
                </div>
                <div>
                  <Label htmlFor="city">{t('city')}</Label>
                  <Input
                    id="city"
                    placeholder={t('cityPlaceholder')}
                    disabled={disabled}
                    {...register('city')}
                  />
                </div>
                <div>
                  <Label htmlFor="region">{t('region')}</Label>
                  <Input
                    id="region"
                    placeholder={t('regionPlaceholder')}
                    disabled={disabled}
                    {...register('region')}
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">{t('postalCode')}</Label>
                  <Input
                    id="postalCode"
                    placeholder={t('postalCodePlaceholder')}
                    disabled={disabled}
                    {...register('postalCode')}
                  />
                </div>
                <div>
                  <Label htmlFor="countryCode">{t('countryCode')}</Label>
                  <Input
                    id="countryCode"
                    placeholder={t('countryCodePlaceholder')}
                    disabled={disabled}
                    {...register('countryCode')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Legal & Tax */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sectionLegal')}</CardTitle>
                <CardDescription>
                  {t('sectionLegalDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="legalName">{t('legalName')}</Label>
                  <Input
                    id="legalName"
                    placeholder={t('legalNamePlaceholder')}
                    disabled={disabled}
                    {...register('legalName')}
                  />
                </div>
                <div>
                  <Label htmlFor="taxNumber">{t('taxNumber')}</Label>
                  <Input
                    id="taxNumber"
                    placeholder={t('taxNumberPlaceholder')}
                    disabled={disabled}
                    {...register('taxNumber')}
                  />
                </div>
                <div>
                  <Label htmlFor="taxCountry">{t('taxCountry')}</Label>
                  <Input
                    id="taxCountry"
                    placeholder={t('taxCountryPlaceholder')}
                    disabled={disabled}
                    {...register('taxCountry')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Regional Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t('sectionRegional')}</CardTitle>
                <CardDescription>
                  {t('sectionRegionalDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="currencyCode">{t('currencyCode')}</Label>
                  <Input
                    id="currencyCode"
                    placeholder={t('currencyCodePlaceholder')}
                    disabled={disabled}
                    {...register('currencyCode')}
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">{t('timezone')}</Label>
                  <Input
                    id="timezone"
                    placeholder={t('timezonePlaceholder')}
                    disabled={disabled}
                    {...register('timezone')}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Action buttons — only when canEdit */}
            {canEdit && (
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isDirty || isPending}
                  onClick={() => methods.reset()}
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={!isDirty || isPending}>
                  {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {t('save')}
                </Button>
              </div>
            )}
          </>
        );
      }}
    </Form>
  );
}
```

**Important notes:**

- Country, Currency, Timezone fields start as plain `Input` for now. A searchable combobox can be added as an enhancement in a follow-up task — plain input is functional and matches the schema.
- The `useUnsavedChanges` call is inside the render prop. To avoid hooks-in-callback issues, **extract the form body into a separate `OrgSettingsFormFields` component** that receives `methods`, `canEdit`, `isPending` as props and calls `useUnsavedChanges` at its top level. This avoids the eslint-disable workaround.
- The `orgSettingsSchema.parse(values)` call in handleSubmit ensures the zod transforms are applied and the mutation receives the correct `OrgSettingsOutput` type.

- [ ] **Step 1b: Add missing i18n keys for card descriptions**

In `messages/en.json` under `settings.organization`, add:

```json
"sectionProfileDescription": "Basic information about your organisation",
"sectionContactDescription": "Main point of contact for this organisation",
"sectionAddressDescription": "Registered business address",
"sectionLegalDescription": "Legal entity and tax registration details",
"sectionRegionalDescription": "Currency and timezone for this organisation"
```

- [ ] **Step 2: Wire into the page**

Update `src/app/[locale]/[orgSlug]/settings/organization/page.tsx`:

- Import `OrgSettingsForm`
- Replace placeholder content with `<OrgSettingsForm canEdit={canEdit} />`

- [ ] **Step 3: Run type check + lint**

```bash
pnpm type:check && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/organization/components/ src/app/[locale]/[orgSlug]/settings/organization/page.tsx
git commit -m "feat: build organisation settings form with 5 card sections"
```

---

## Chunk 3: Members

### Task 9: Create members skeleton

**Files:**

- Create: `src/features/settings/members/components/members-skeleton.tsx`

- [ ] **Step 1: Create skeleton component**

Create `src/features/settings/members/components/members-skeleton.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton';

/** Table skeleton: header row + 5 shimmer rows. */
export function MembersSkeleton() {
  return (
    <div className="space-y-4">
      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>
      {/* Table skeleton */}
      <div className="rounded-md border">
        <div className="border-b p-3">
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border-b p-3 last:border-0">
            <div className="grid grid-cols-5 items-center gap-4">
              <div className="flex items-center gap-2">
                <Skeleton className="size-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-4 w-4 justify-self-end" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/settings/members/components/members-skeleton.tsx
git commit -m "feat: add members table skeleton"
```

---

### Task 10: Create members empty state

**Files:**

- Create: `src/features/settings/members/components/members-empty-state.tsx`

- [ ] **Step 1: Create empty state component**

Create `src/features/settings/members/components/members-empty-state.tsx`:

```typescript
import { Plus, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

interface MembersEmptyStateProps {
  canManage: boolean;
  onInvite: () => void;
}

export function MembersEmptyState({
  canManage,
  onInvite,
}: MembersEmptyStateProps) {
  const t = useTranslations('members');

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <Users className="text-muted-foreground size-6" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold">{t('emptyTitle')}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('emptyDescription')}
        </p>
      </div>
      {canManage && (
        <Button onClick={onInvite}>
          <Plus className="mr-2 size-4" />
          {t('addMember')}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add missing i18n keys**

In `messages/en.json` under `members`, add:

```json
"emptyTitle": "No members yet",
"emptyDescription": "Invite team members to collaborate on managing your properties"
```

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/members/components/members-empty-state.tsx messages/en.json
git commit -m "feat: add members empty state component"
```

---

### Task 11: Create invite member sheet

**Files:**

- Create: `src/features/settings/members/components/invite-member-sheet.tsx`

**Reference:**

- Schema: `inviteMemberSchema`, `inviteMemberDefaults` from `../validators/create-user.schema`
- Hook: `useInviteMember()` from `../hooks/use-members`
- Roles: `useRoles()` from `../../roles/hooks/use-roles` (populates role select)

- [ ] **Step 1: Create invite member sheet**

Create `src/features/settings/members/components/invite-member-sheet.tsx`:

```typescript
'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { useRoles } from '../../roles/hooks/use-roles';
import { useInviteMember } from '../hooks/use-members';
import {
  inviteMemberDefaults,
  inviteMemberSchema,
  type InviteMemberInput,
} from '../validators/create-user.schema';

interface InviteMemberSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberSheet({
  open,
  onOpenChange,
}: InviteMemberSheetProps) {
  const t = useTranslations('members');
  const { mutate, isPending } = useInviteMember();
  const { data: rolesData } = useRoles();

  const handleSubmit = (values: InviteMemberInput) => {
    mutate(values, {
      onSuccess: () => {
        toast.success(t('inviteSuccess'));
        onOpenChange(false);
      },
      onError: (error) => {
        toast.error(error.detail ?? t('inviteError'));
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('inviteTitle')}</SheetTitle>
          <SheetDescription>
            {t('inviteDescription')}
          </SheetDescription>
        </SheetHeader>
        <Form<InviteMemberInput>
          validationSchema={inviteMemberSchema}
          resetValues={inviteMemberDefaults}
          onSubmit={handleSubmit}
        >
          {(methods) => (
            <>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="email">{t('labelEmail')} *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('placeholderEmail')}
                    disabled={isPending}
                    {...methods.register('email')}
                  />
                  {methods.formState.errors.email && (
                    <p className="text-destructive mt-1 text-xs">
                      {methods.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="roleId">{t('labelRole')} *</Label>
                  <Select
                    value={methods.watch('roleId')}
                    onValueChange={(val) => methods.setValue('roleId', val, { shouldValidate: true })}
                    disabled={isPending}
                  >
                    <SelectTrigger id="roleId">
                      <SelectValue placeholder={t('labelRole')} />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesData?.map((role) => (
                        <SelectItem key={role.roleId} value={role.roleId}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {methods.formState.errors.roleId && (
                    <p className="text-destructive mt-1 text-xs">
                      {methods.formState.errors.roleId.message}
                    </p>
                  )}
                </div>
              </div>
              <SheetFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                >
                  {t('cancel')}
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  {t('sendInvitation')}
                </Button>
              </SheetFooter>
            </>
          )}
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

**Note:** The `useRoles()` hook returns `OrgRoleItem[]` — check the exact return shape. If it returns `PagedResult<OrgRoleItem>`, use `rolesData?.items` instead.

- [ ] **Step 2: Add missing i18n key**

In `messages/en.json` under `members`, add:

```json
"inviteDescription": "Send an email invitation to join this organisation"
```

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/members/components/invite-member-sheet.tsx messages/en.json
git commit -m "feat: add invite member sheet"
```

---

### Task 12: Create edit member roles sheet

**Files:**

- Create: `src/features/settings/members/components/edit-member-roles-sheet.tsx`

**Reference:**

- Schema: `updateMemberRolesSchema` from `../validators/create-user.schema`
- Hook: `useUpdateMemberRoles()` from `../hooks/use-members`
- Types: `OrgMember` from `../types`

- [ ] **Step 1: Create edit roles sheet**

Create `src/features/settings/members/components/edit-member-roles-sheet.tsx`:

```typescript
'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { useRoles } from '../../roles/hooks/use-roles';
import { useUpdateMemberRoles } from '../hooks/use-members';
import type { OrgMember } from '../types';
import {
  updateMemberRolesSchema,
  type UpdateMemberRolesInput,
} from '../validators/create-user.schema';

interface EditMemberRolesSheetProps {
  member: OrgMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditMemberRolesSheet({
  member,
  open,
  onOpenChange,
}: EditMemberRolesSheetProps) {
  const t = useTranslations('members');
  const { mutate, isPending } = useUpdateMemberRoles();
  const { data: rolesData } = useRoles();

  const defaultRoleIds = member?.roles.map((r) => r.id) ?? [];

  const handleSubmit = (values: UpdateMemberRolesInput) => {
    if (!member) return;
    mutate(
      { userId: member.userId, ...values },
      {
        onSuccess: () => {
          toast.success(t('rolesUpdateSuccess'));
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.detail ?? t('rolesUpdateError'));
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('editRolesTitle')}</SheetTitle>
          {member && (
            <SheetDescription>
              {member.firstName} {member.lastName} &middot; {member.email}
            </SheetDescription>
          )}
        </SheetHeader>
        <Form<UpdateMemberRolesInput>
          validationSchema={updateMemberRolesSchema}
          resetValues={{ roleIds: defaultRoleIds }}
          onSubmit={handleSubmit}
        >
          {(methods) => {
            const roleIds = methods.watch('roleIds');

            const toggleRole = (roleId: string) => {
              const current = methods.getValues('roleIds');
              const next = current.includes(roleId)
                ? current.filter((id) => id !== roleId)
                : [...current, roleId];
              methods.setValue('roleIds', next, { shouldValidate: true });
            };

            return (
              <>
                <div className="space-y-3 py-4">
                  {rolesData?.map((role) => (
                    <label
                      key={role.roleId}
                      className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent"
                    >
                      <Checkbox
                        checked={roleIds.includes(role.roleId)}
                        onCheckedChange={() => toggleRole(role.roleId)}
                        disabled={isPending}
                      />
                      <span className="text-sm font-medium">{role.name}</span>
                    </label>
                  ))}
                  {methods.formState.errors.roleIds && (
                    <p className="text-destructive text-xs">
                      {methods.formState.errors.roleIds.message}
                    </p>
                  )}
                </div>
                <SheetFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                  >
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {t('saveRoles')}
                  </Button>
                </SheetFooter>
              </>
            );
          }}
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/settings/members/components/edit-member-roles-sheet.tsx
git commit -m "feat: add edit member roles sheet"
```

---

### Task 13: Create members toolbar

**Files:**

- Create: `src/features/settings/members/components/members-toolbar.tsx`

- [ ] **Step 1: Create toolbar component**

Create `src/features/settings/members/components/members-toolbar.tsx`:

```typescript
'use client';

import { Plus, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import type { OrgRoleItem } from '../../roles/types';

interface MembersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  roleId: string;
  onRoleIdChange: (value: string) => void;
  roles: OrgRoleItem[];
  canManage: boolean;
  onInvite: () => void;
}

export function MembersToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  roleId,
  onRoleIdChange,
  roles,
  canManage,
  onInvite,
}: MembersToolbarProps) {
  const t = useTranslations('members');

  const hasFilters = status !== 'all' || roleId !== 'all' || search !== '';

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute left-2.5 top-2.5 size-4" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterStatus')}</SelectItem>
            <SelectItem value="active">{t('statusActive')}</SelectItem>
            <SelectItem value="deactivated">
              {t('statusDeactivated')}
            </SelectItem>
          </SelectContent>
        </Select>
        <Select value={roleId} onValueChange={onRoleIdChange}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder={t('filterRole')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filterRole')}</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.roleId} value={role.roleId}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onSearchChange('');
              onStatusChange('all');
              onRoleIdChange('all');
            }}
          >
            <X className="mr-1 size-3" />
            {t('clear')}
          </Button>
        )}
      </div>
      {canManage && (
        <Button onClick={onInvite}>
          <Plus className="mr-2 size-4" />
          {t('addMember')}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/settings/members/components/members-toolbar.tsx
git commit -m "feat: add members toolbar with search and filters"
```

---

### Task 14: Create members content (main orchestrator)

**Files:**

- Create: `src/features/settings/members/components/members-content.tsx`

This is the main component that wires together: toolbar, table, sheets, empty state, skeleton. It manages local state for filters, sheet open/close, and selected member.

**Reference:**

- `useMembers(params)` from `../hooks/use-members`
- `useDeactivateMember()`, `useReactivateMember()` from `../hooks/use-members`
- `useRoles()` from `../../roles/hooks/use-roles`
- `DataTable` from `@/components/table/data-table`
- `DataTablePagination` from `@/components/table/data-table-pagination`
- `ConfirmPopover` from `@/components/ui/confirm-popover`
- TanStack Table: `createColumnHelper`, `useReactTable`, `getCoreRowModel`, `getSortingRowModel`

- [ ] **Step 1: Create members-content component**

Create `src/features/settings/members/components/members-content.tsx`. This is the largest members component:

Key implementation details:

**State:**

- `search`, `debouncedSearch` (use `useEffect` with 300ms timeout for debounce)
- `status` (default: `'all'`), `roleId` (default: `'all'`), `page` (default: 1)
- `inviteOpen` (boolean), `editRolesOpen` (boolean), `editRolesMember` (`OrgMember | null`)
- `deactivatingMember` (`OrgMember | null`) — for deactivation confirmation dialog

**Queries/Mutations:**

- `useMembers({ search: debouncedSearch, status: status === 'all' ? undefined : status, roleId: roleId === 'all' ? undefined : roleId, page })`
- `useRoles()` for filter + invite role options
- `useDeactivateMember()` and `useReactivateMember()` for row actions

**Column definitions** via `createColumnHelper<OrgMember>()`:

```typescript
const columnHelper = createColumnHelper<OrgMember>();

const columns = useMemo(() => [
  columnHelper.accessor('firstName', {
    header: t('columnName'),
    cell: ({ row }) => {
      const m = row.original;
      const initials = `${m.firstName[0]}${m.lastName[0]}`.toUpperCase();
      return (
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-full text-xs font-semibold">
            {initials}
          </div>
          <div>
            <div className="font-medium">{m.firstName} {m.lastName}</div>
            <div className="text-muted-foreground text-xs">{m.email}</div>
          </div>
        </div>
      );
    },
  }),
  columnHelper.accessor('roles', {
    header: t('columnRole'),
    cell: ({ getValue }) => {
      const roles = getValue();
      const shown = roles.slice(0, 2);
      const extra = roles.length - 2;
      return (
        <div className="flex flex-wrap gap-1">
          {shown.map((r) => (
            <Badge key={r.id} variant="secondary">{r.name}</Badge>
          ))}
          {extra > 0 && (
            <Badge variant="outline">+{extra}</Badge>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor('joinedAt', {
    header: t('columnJoined'),
    cell: ({ getValue }) => (
      <FormattedDate value={getValue()} />
    ),
  }),
], [t, canManage]);

// Helper component to use useFormatter() hook legally inside a cell:
function FormattedDate({ value }: { value: string }) {
  const format = useFormatter();
  return <>{format.dateTime(new Date(value), { dateStyle: 'medium' })}</>;
}

// (The above columns array closes before this helper — place FormattedDate
// as a separate component in the same file, outside the main component.
// The closing `], [t, canManage]);` above is a duplicate — remove it from the
// actual column array definition below where it originally appeared.)
  columnHelper.accessor('status', {
    header: t('columnStatus'),
    cell: ({ getValue }) => {
      const status = getValue();
      return (
        <Badge variant={status === 'active' ? 'default' : 'destructive'}>
          {status === 'active' ? t('statusActive') : t('statusDeactivated')}
        </Badge>
      );
    },
  }),
  // Actions column — only if canManage
  ...(canManage ? [columnHelper.display({
    id: 'actions',
    cell: ({ row }) => {
      const m = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <MoreHorizontal className="text-muted-foreground size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditRolesMember(m); setEditRolesOpen(true); }}>
              {t('editRolesAriaLabel')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {m.status === 'active' ? (
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeactivatingMember(m)}
              >
                {t('deactivateAriaLabel')}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleReactivate(m.userId)}>
                {t('reactivateAriaLabel')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  })] : []),
], [t, canManage]);
```

**Deactivation confirmation:** Use `ConfirmPopover` is NOT suitable here (popover needs an anchor and the dropdown closes). Instead, use a controlled confirmation pattern:

- Set `deactivatingMember` state when user clicks "Deactivate" in dropdown
- Render a `Dialog` (AlertDialog) that opens when `deactivatingMember` is set:

```typescript
<Dialog open={!!deactivatingMember} onOpenChange={(open) => !open && setDeactivatingMember(null)}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{t('deactivateTitle')}</DialogTitle>
      <DialogDescription>{t('deactivateDescription')}</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline" onClick={() => setDeactivatingMember(null)}>
        {t('cancel')}
      </Button>
      <Button variant="destructive" onClick={() => handleDeactivate(deactivatingMember!.userId)} disabled={deactivateMutation.isPending}>
        {deactivateMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        {t('confirm')}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Reactivate handler:** Direct mutation, no confirmation needed:

```typescript
const handleReactivate = (userId: string) => {
  reactivateMutation.mutate(userId, {
    onSuccess: () => toast.success(t('reactivateSuccess')),
    onError: (error) => toast.error(error.detail ?? t('reactivateError')),
  });
};
```

**Deactivated rows:** Use TanStack Table's `meta` or row className to dim:

```typescript
<TableRow className={cn(row.original.status === 'deactivated' && 'opacity-60')}>
```

Note: This requires either modifying `DataTable` to accept a `rowClassName` prop, or using the table's row model to add conditional styling. Simplest approach: pass a `rowClassName` callback to `DataTable`.

**Render order:** `MembersToolbar` → (`MembersEmptyState` if no data, else `DataTable` + `DataTablePagination`) → `InviteMemberSheet` → `EditMemberRolesSheet` → Deactivation `Dialog`

- [ ] **Step 2: Wire into the page**

Update `src/app/[locale]/[orgSlug]/settings/members/page.tsx`:

- Import `MembersContent`
- Replace placeholder with `<MembersContent canManage={canManage} />`

- [ ] **Step 3: Run type check + lint**

```bash
pnpm type:check && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/members/components/members-content.tsx src/app/[locale]/[orgSlug]/settings/members/page.tsx
git commit -m "feat: build members table with toolbar, actions, and sheets"
```

---

## Chunk 4: Roles & Permissions

### Task 15: Create roles skeleton

**Files:**

- Create: `src/features/settings/roles/components/roles-skeleton.tsx`

- [ ] **Step 1: Create skeleton component**

Create `src/features/settings/roles/components/roles-skeleton.tsx`:

```typescript
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** 4 skeleton cards in 2x2 grid. */
export function RolesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-4 w-14" />
            </div>
            <Skeleton className="h-3 w-48" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/settings/roles/components/roles-skeleton.tsx
git commit -m "feat: add roles card grid skeleton"
```

---

### Task 16: Create roles empty state

**Files:**

- Create: `src/features/settings/roles/components/roles-empty-state.tsx`

- [ ] **Step 1: Create empty state component**

Create `src/features/settings/roles/components/roles-empty-state.tsx`:

```typescript
import { Plus, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';

interface RolesEmptyStateProps {
  canManage: boolean;
  onCreate: () => void;
}

export function RolesEmptyState({ canManage, onCreate }: RolesEmptyStateProps) {
  const t = useTranslations('roles');

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <div className="bg-muted flex size-12 items-center justify-center rounded-full">
        <ShieldCheck className="text-muted-foreground size-6" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold">{t('emptyTitle')}</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('emptyDescription')}
        </p>
      </div>
      {canManage && (
        <Button onClick={onCreate}>
          <Plus className="mr-2 size-4" />
          {t('addRole')}
        </Button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add missing i18n keys**

In `messages/en.json` under `roles`, add:

```json
"emptyTitle": "No custom roles",
"emptyDescription": "Create custom roles to define specific permissions for your team members"
```

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/roles/components/roles-empty-state.tsx messages/en.json
git commit -m "feat: add roles empty state component"
```

---

### Task 17: Create role card component

**Files:**

- Create: `src/features/settings/roles/components/role-card.tsx`

- [ ] **Step 1: Create role card**

Create `src/features/settings/roles/components/role-card.tsx`:

```typescript
'use client';

import { Lock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import type { OrgRoleItem } from '../types';

interface RoleCardProps {
  role: OrgRoleItem;
  canManage: boolean;
  onEdit: (role: OrgRoleItem) => void;
  onDelete: (role: OrgRoleItem) => void;
}

export function RoleCard({ role, canManage, onEdit, onDelete }: RoleCardProps) {
  const t = useTranslations('roles');

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{role.name}</CardTitle>
            {role.isSystem && (
              <Badge variant="secondary" className="text-xs">
                {t('systemRole')}
              </Badge>
            )}
          </div>
          {role.description && (
            <CardDescription>{role.description}</CardDescription>
          )}
        </div>
        {role.isSystem ? (
          <Lock className="text-muted-foreground size-4" />
        ) : canManage ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <MoreHorizontal className="text-muted-foreground size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(role)}>
                <Pencil className="mr-2 size-4" />
                {t('editRole')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(role)}
              >
                <Trash2 className="mr-2 size-4" />
                {t('deleteRole')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground flex gap-4 text-sm">
          <span>{t('memberCount', { count: role.memberCount })}</span>
          <span>
            {t('permissionCount', { count: role.permissionCodes.length })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/features/settings/roles/components/role-card.tsx
git commit -m "feat: add role card component with system/custom distinction"
```

---

### Task 18: Create role form sheet with grouped permissions

**Files:**

- Create: `src/features/settings/roles/components/role-form-sheet.tsx`

**Reference:**

- Schema: `createRoleSchema`, `createRoleDefaults` from `../validators/role.schema`
- Hooks: `useCreateRole()`, `useUpdateRole()`, `usePermissions()` from `../hooks/use-roles`
- Types: `OrgRoleItem`, `PermissionGroup` from `../types`

- [ ] **Step 1: Create role form sheet**

Create `src/features/settings/roles/components/role-form-sheet.tsx`:

```typescript
'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';

import { useCreateRole, usePermissions, useUpdateRole } from '../hooks/use-roles';
import type { OrgRoleItem } from '../types';
import {
  createRoleDefaults,
  createRoleSchema,
  type CreateRoleInput,
} from '../validators/role.schema';

interface RoleFormSheetProps {
  role: OrgRoleItem | null; // null = create, non-null = edit
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RoleFormSheet({ role, open, onOpenChange }: RoleFormSheetProps) {
  const t = useTranslations('roles');
  const { data: permissionGroups } = usePermissions();
  const createMutation = useCreateRole();
  const updateMutation = useUpdateRole();

  const isEdit = !!role;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const resetValues: CreateRoleInput = role
    ? {
        name: role.name,
        description: role.description ?? '',
        permissionCodes: role.permissionCodes,
      }
    : createRoleDefaults;

  const handleSubmit = (values: CreateRoleInput) => {
    if (isEdit) {
      updateMutation.mutate(
        { roleId: role.roleId, ...values },
        {
          onSuccess: () => {
            toast.success(t('updateSuccess'));
            onOpenChange(false);
          },
          onError: (error) => {
            toast.error(error.detail ?? t('updateError'));
          },
        }
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => {
          toast.success(t('createSuccess'));
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.detail ?? t('createError'));
        },
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] overflow-y-auto sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>{isEdit ? t('editTitle') : t('createTitle')}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? t('editDescription')
              : t('createDescription')}
          </SheetDescription>
        </SheetHeader>
        <Form<CreateRoleInput>
          validationSchema={createRoleSchema}
          resetValues={resetValues}
          onSubmit={handleSubmit}
        >
          {(methods) => {
            const permissionCodes = methods.watch('permissionCodes');

            const togglePermission = (code: string) => {
              const current = methods.getValues('permissionCodes');
              const next = current.includes(code)
                ? current.filter((c) => c !== code)
                : [...current, code];
              methods.setValue('permissionCodes', next, {
                shouldValidate: true,
              });
            };

            const toggleGroup = (groupCodes: string[]) => {
              const current = methods.getValues('permissionCodes');
              const allSelected = groupCodes.every((c) =>
                current.includes(c)
              );
              const next = allSelected
                ? current.filter((c) => !groupCodes.includes(c))
                : [...new Set([...current, ...groupCodes])];
              methods.setValue('permissionCodes', next, {
                shouldValidate: true,
              });
            };

            return (
              <>
                <div className="space-y-4 py-4">
                  {/* Name */}
                  <div>
                    <Label htmlFor="roleName">{t('labelName')} *</Label>
                    <Input
                      id="roleName"
                      placeholder={t('placeholderName')}
                      disabled={isPending}
                      {...methods.register('name')}
                    />
                    {methods.formState.errors.name && (
                      <p className="text-destructive mt-1 text-xs">
                        {methods.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="roleDescription">
                      {t('labelDescription')}
                    </Label>
                    <Textarea
                      id="roleDescription"
                      placeholder={t('placeholderDescription')}
                      disabled={isPending}
                      {...methods.register('description')}
                    />
                  </div>

                  {/* Permissions grouped */}
                  <div>
                    <Label>{t('labelPermissions')} *</Label>
                    {methods.formState.errors.permissionCodes && (
                      <p className="text-destructive mt-1 text-xs">
                        {methods.formState.errors.permissionCodes.message}
                      </p>
                    )}
                    <div className="mt-3 space-y-6">
                      {permissionGroups?.map((group) => {
                        const groupCodes = group.permissions.map(
                          (p) => p.code
                        );
                        const allSelected = groupCodes.every((c) =>
                          permissionCodes.includes(c)
                        );

                        return (
                          <div key={group.group}>
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-semibold">
                                {group.group}
                              </span>
                              <button
                                type="button"
                                className="text-primary text-xs hover:underline"
                                onClick={() => toggleGroup(groupCodes)}
                                disabled={isPending}
                              >
                                {allSelected
                                  ? t('deselectAll')
                                  : t('selectAll')}
                              </button>
                            </div>
                            <div className="space-y-2 pl-1">
                              {group.permissions.map((perm) => (
                                <label
                                  key={perm.code}
                                  className="flex cursor-pointer items-start gap-3"
                                >
                                  <Checkbox
                                    checked={permissionCodes.includes(
                                      perm.code
                                    )}
                                    onCheckedChange={() =>
                                      togglePermission(perm.code)
                                    }
                                    disabled={isPending}
                                    className="mt-0.5"
                                  />
                                  <div>
                                    <div className="text-sm">
                                      {perm.code}
                                    </div>
                                    {perm.description && (
                                      <div className="text-muted-foreground text-xs">
                                        {perm.description}
                                      </div>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <SheetFooter className="border-t pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isPending}
                  >
                    {t('cancel')}
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {isEdit ? t('saveButton') : t('createButton')}
                  </Button>
                </SheetFooter>
              </>
            );
          }}
        </Form>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Add missing i18n keys**

In `messages/en.json` under `roles`, add:

```json
"createDescription": "Define the role name and select permissions",
"editDescription": "Update the role name and permissions",
"selectAll": "Select all",
"deselectAll": "Deselect all",
"pageDescription": "Manage roles and their permissions for your organisation"
```

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/roles/components/role-form-sheet.tsx messages/en.json
git commit -m "feat: add role form sheet with grouped permissions"
```

---

### Task 19: Create roles content (main orchestrator)

**Files:**

- Create: `src/features/settings/roles/components/roles-content.tsx`

This wires together: role cards, form sheet, delete dialog, empty state, skeleton.

**Reference:**

- `useRoles()` from `../hooks/use-roles`
- `useDeleteRole()` from `../hooks/use-roles`

- [ ] **Step 1: Create roles-content component**

Create `src/features/settings/roles/components/roles-content.tsx`:

Key implementation details:

**State:**

- `formOpen` (boolean), `editingRole` (`OrgRoleItem | null`) — null = create mode, non-null = edit mode
- `deletingRole` (`OrgRoleItem | null`) — for delete confirmation dialog

**Queries/Mutations:**

- `useRoles()` for role list
- `useDeleteRole()` for delete

**Render structure:**

```typescript
'use client';

import { Loader2, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

import { useDeleteRole, useRoles } from '../hooks/use-roles';
import type { OrgRoleItem } from '../types';
import { RoleCard } from './role-card';
import { RoleFormSheet } from './role-form-sheet';
import { RolesEmptyState } from './roles-empty-state';
import { RolesSkeleton } from './roles-skeleton';

interface RolesContentProps {
  canManage: boolean;
}

export function RolesContent({ canManage }: RolesContentProps) {
  const t = useTranslations('roles');
  const { data: roles, isLoading } = useRoles();
  const deleteMutation = useDeleteRole();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<OrgRoleItem | null>(null);
  const [deletingRole, setDeletingRole] = useState<OrgRoleItem | null>(null);

  if (isLoading) return <RolesSkeleton />;

  const hasCustomRoles = roles?.some((r) => !r.isSystem);

  const handleEdit = (role: OrgRoleItem) => {
    setEditingRole(role);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deletingRole) return;
    deleteMutation.mutate(deletingRole.roleId, {
      onSuccess: () => {
        toast.success(t('deleteSuccess'));
        setDeletingRole(null);
      },
      onError: (error) => {
        toast.error(error.detail ?? t('deleteError'));
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {t('pageDescription')}
        </p>
        {canManage && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 size-4" />
            {t('addRole')}
          </Button>
        )}
      </div>

      {/* Card grid or empty state */}
      {/* Always render role cards (system roles are always present) */}
      {roles && roles.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {roles.map((role) => (
            <RoleCard
              key={role.roleId}
              role={role}
              canManage={canManage}
              onEdit={handleEdit}
              onDelete={setDeletingRole}
            />
          ))}
        </div>
      )}

      {/* Empty state shown below system cards when no custom roles exist */}
      {!hasCustomRoles && (
        <RolesEmptyState canManage={canManage} onCreate={handleCreate} />
      )}

      {/* Create/Edit Sheet */}
      <RoleFormSheet
        role={editingRole}
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingRole}
        onOpenChange={(open) => !open && setDeletingRole(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteTitle')}</DialogTitle>
            <DialogDescription>{t('deleteDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingRole(null)}
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {t('confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Note:** System role cards are always rendered. The empty state ("No custom roles") appears below the system cards when no custom roles exist, encouraging the user to create their first custom role.

- [ ] **Step 2: Wire into the page**

Update `src/app/[locale]/[orgSlug]/settings/roles/page.tsx`:

- Import `RolesContent`
- Replace placeholder with `<RolesContent canManage={canManage} />`

- [ ] **Step 3: Run type check + lint**

```bash
pnpm type:check && pnpm lint
```

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/roles/components/roles-content.tsx src/app/[locale]/[orgSlug]/settings/roles/page.tsx
git commit -m "feat: build roles card grid with create, edit, and delete"
```

---

### Task 20: Final verification and cleanup

- [ ] **Step 1: Run full type check**

```bash
pnpm type:check
```

- [ ] **Step 2: Run lint with fix**

```bash
pnpm lint:fix
```

- [ ] **Step 3: Run production build**

```bash
pnpm build
```

Fix any build errors.

- [ ] **Step 4: Manual smoke test**

Start dev server (`pnpm dev`) and verify:

- [ ] Settings link appears in sidebar (with correct permission)
- [ ] Clicking Settings goes to Organisation tab
- [ ] Tab navigation works between all 3 sections
- [ ] Tabs are hidden when permission missing
- [ ] `/settings` redirects to first accessible tab
- [ ] Organisation form loads data, saves, shows dirty state
- [ ] Members table loads, search/filter works
- [ ] Invite member sheet opens, submits, closes
- [ ] Edit roles sheet opens, toggles roles, saves
- [ ] Deactivate/reactivate works with confirmation
- [ ] Roles card grid loads
- [ ] Create/edit role sheet works with grouped permissions
- [ ] Delete role works with confirmation
- [ ] Empty states show when no data
- [ ] All text is from i18n (no hardcoded strings)

- [ ] **Step 5: Final commit if any fixes**

Stage only the specific files that were changed, then commit:

```bash
git add src/ messages/en.json
git commit -m "fix: address lint and build issues"
```
