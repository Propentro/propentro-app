# PRP-12 Settings PR Fixes — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all bugs and UX issues in the PRP-12 settings PR (organisation settings, members, roles pages) so it can be shipped.

**Architecture:** Bug fixes target existing files in-place. New reusable components (country/currency/timezone pickers, phone input, shared FormField) go to `src/components/ui/` or `src/components/shared/`. Sidebar restructuring touches layout components only.

**Tech Stack:** Next.js 16, React 19, shadcn/ui v4 (Base UI), TanStack Query, react-hook-form + zod v4, next-intl, lucide-react

---

## Chunk 1: Bug Fixes

### Task 1: Fix Form wrapper resetValues causing form reset mid-edit

The `Form` component's `useEffect([resetValues, methods])` fires whenever `resetValues` is a new object reference. In `org-settings-form.tsx`, `toOrgSettingsInput(data)` creates a new object inline every render, so any React Query background refetch resets the form while the user is typing.

**Files:**
- Modify: `src/components/ui/form.tsx:43-47`

- [ ] **Step 1: Add deep-equality guard to Form reset effect**

In `src/components/ui/form.tsx`, replace the `useEffect` with a ref-based deep comparison so `methods.reset()` only fires when the actual values change, not just the reference:

```tsx
import { useEffect, useRef } from 'react';

// Replace the existing useEffect (lines 43-47) with:
const prevResetValues = useRef<TFormValues | null>(null);

useEffect(() => {
  if (!resetValues) return;
  // Only reset if the actual data changed (not just reference)
  if (
    prevResetValues.current !== null &&
    JSON.stringify(prevResetValues.current) === JSON.stringify(resetValues)
  ) {
    return;
  }
  prevResetValues.current = resetValues;
  methods.reset(resetValues);
}, [resetValues, methods]);
```

- [ ] **Step 2: Verify org settings form no longer resets mid-edit**

Run: `pnpm dev`
Navigate to org settings, start typing in a field, wait 5+ minutes or trigger a refetch. Form should NOT reset.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/form.tsx
git commit -m "fix(form): prevent resetValues from resetting form on reference change"
```

---

### Task 2: Fix unsaved changes hook — add soft navigation interception

`useUnsavedChanges` only hooks `beforeunload` (hard nav). Next.js soft navigations (Link clicks, sidebar clicks) are not intercepted. The form also appears to "self-clear" due to the Task 1 bug — once Task 1 is fixed, the clearing stops. But we still need soft nav interception.

**Files:**
- Modify: `src/hooks/use-unsaved-changes.ts`

- [ ] **Step 1: Add router.beforePopState or window confirm on soft navigation**

Next.js App Router doesn't have a built-in "block navigation" API. The pragmatic approach: use `window.onbeforeunload` (already done) + `next/navigation`'s experimental `onBeforeRouteChange` if available, OR use a simpler approach with a confirmation dialog.

For now, the `beforeunload` approach is the standard for App Router. The "self-clearing" behavior is caused by Task 1's bug. After Task 1 is fixed, this hook works correctly for its scope (hard navigation only).

**No code changes needed** — Task 1 fixes the root cause. The hook is correct for its scope.

- [ ] **Step 2: Verify unsaved changes warning works after Task 1 fix**

Run: `pnpm dev`
Navigate to org settings, type something, try closing the tab → browser should show "Leave page?" warning.

---

### Task 3: Fix rows-per-page selector not working in members table

`members-content.tsx` hardcodes `pageSize: 10` in three places. The `DataTablePagination` component calls `table.setPageSize()` which updates TanStack Table's internal state, but the `onPaginationChange` handler always reads `pageSize: 10` from the hardcoded literal.

**Files:**
- Modify: `src/features/settings/members/components/members-content.tsx:65,96,261,265`

- [ ] **Step 1: Add pageSize state and thread it through**

In `members-content.tsx`, add `pageSize` state (default 10) alongside the existing `page` state. Replace all 3 hardcoded `pageSize: 10` with the state variable. Update `onPaginationChange` to also update `pageSize`.

```tsx
// Line 65 — add after `const [page, setPage] = useState(1);`
const [pageSize, setPageSize] = useState(10);

// Line 73-75 — also reset page when pageSize changes:
useEffect(() => {
  setPage(1);
}, [debouncedSearch, status, roleId, pageSize]);

// Line 96 — replace pageSize: 10
pageSize,

// Line 261 — replace pageSize: 10
state: { pagination: { pageIndex: page - 1, pageSize } },

// Line 262-268 — update onPaginationChange:
onPaginationChange: (updater) => {
  const next =
    typeof updater === 'function'
      ? updater({ pageIndex: page - 1, pageSize })
      : updater;
  setPage(next.pageIndex + 1);
  setPageSize(next.pageSize);
},
```

- [ ] **Step 2: Verify rows-per-page selector works**

Run: `pnpm dev`
Navigate to members page, change rows per page dropdown → table should re-fetch with new page size.

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/members/components/members-content.tsx
git commit -m "fix(members): make rows-per-page selector functional"
```

---

### Task 4: Fix edit member roles not pre-selected

In `edit-member-roles-sheet.tsx`, `resetValues` maps `member?.roles.map((r) => r.id)` — these are `OrgRole.id` values. The checkboxes check against `role.roleId` from `OrgRoleItem`. If the API returns the same IDs, the issue is that the `Form` component's `useForm()` starts with empty `defaultValues` and relies on the `useEffect` to call `methods.reset()`. Between mount and effect, `watch('roleIds')` returns `undefined`.

**Files:**
- Modify: `src/features/settings/members/components/edit-member-roles-sheet.tsx:81-85`

- [ ] **Step 1: Pass defaultValues through useFormProps**

Add `useFormProps={{ defaultValues: resetValues }}` to the Form component so the form starts with the correct values immediately, not after an effect cycle:

```tsx
<Form<UpdateMemberRolesInput>
  key={member?.userId ?? 'none'}
  validationSchema={updateMemberRolesSchema}
  resetValues={resetValues}
  useFormProps={{ defaultValues: resetValues }}
  onSubmit={handleSubmit}
  className="flex flex-1 flex-col"
>
```

- [ ] **Step 2: Verify roles are pre-selected when opening edit sheet**

Run: `pnpm dev`
Navigate to members, click "Edit roles" on a member → their assigned roles should be checked immediately.

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/members/components/edit-member-roles-sheet.tsx
git commit -m "fix(members): pre-select roles when opening edit member sheet"
```

---

### Task 5: Fix invite member showing role ID instead of name after selection

In shadcn/ui v4 (Base UI), the `Select` component may render the `value` attribute in the trigger instead of the children text of the selected item. The `SelectValue` component needs to receive the display text explicitly.

**Files:**
- Modify: `src/features/settings/members/components/invite-member-sheet.tsx:96-112`

- [ ] **Step 1: Debug the actual behavior**

First verify the issue by reading the shadcn v4 Select component source to understand how `SelectValue` renders the selected item. If Base UI's Select doesn't auto-populate the trigger with the option label, we need to render the selected role name manually.

- [ ] **Step 2: Fix the Select to show role name**

Replace the Select block with a version that explicitly renders the selected role's name:

```tsx
<Select
  value={watch('roleId')}
  onValueChange={(value) =>
    setValue('roleId', value ?? '', { shouldValidate: true })
  }
>
  <SelectTrigger id="roleId" className="w-full">
    <SelectValue placeholder={t('labelRole')}>
      {roles?.find((r) => r.roleId === watch('roleId'))?.name}
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    {roles?.map((role) => (
      <SelectItem key={role.roleId} value={role.roleId}>
        {role.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

If `SelectValue` doesn't accept children in Base UI, use a conditional render instead:

```tsx
<SelectTrigger id="roleId" className="w-full">
  {watch('roleId')
    ? roles?.find((r) => r.roleId === watch('roleId'))?.name
    : t('labelRole')}
</SelectTrigger>
```

Verify which approach works by checking the shadcn v4 Select component API.

- [ ] **Step 3: Verify role name shows after selection**

Run: `pnpm dev`
Open invite member sheet, select a role → trigger should show role name, not ID.

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/members/components/invite-member-sheet.tsx
git commit -m "fix(members): show role name instead of ID in invite select"
```

---

### Task 6: Fix toast showing raw JSON for API errors

The backend wraps Clerk errors in a Problem Details response where `detail` contains a JSON string (not parsed). The toast blindly shows `error.detail` which renders raw JSON. We need to parse `detail` when it contains JSON and extract the human-readable message.

**Files:**
- Create: `src/lib/parse-api-error.ts`
- Modify: All components that show `error.detail` in toasts (6 files)

- [ ] **Step 1: Create error parser utility**

Create `src/lib/parse-api-error.ts`:

```tsx
import type { ApiError } from '@/types/api.types';

/**
 * Extracts a human-readable message from an ApiError.
 *
 * Handles cases where `detail` is a JSON string (e.g., Clerk error envelope)
 * by extracting the first `long_message` or `message` from the errors array.
 */
export function getErrorMessage(error: ApiError, fallback: string): string {
  const { detail } = error;
  if (!detail) return fallback;

  // If detail looks like JSON, try to extract a readable message
  if (detail.startsWith('{') || detail.startsWith('[')) {
    try {
      const parsed = JSON.parse(detail);

      // Clerk error envelope: { errors: [{ long_message, message }] }
      if (parsed.errors && Array.isArray(parsed.errors)) {
        const firstError = parsed.errors[0];
        return firstError?.long_message ?? firstError?.message ?? fallback;
      }

      // Generic message field
      if (typeof parsed.message === 'string') return parsed.message;
      if (typeof parsed.detail === 'string') return parsed.detail;
    } catch {
      // Not valid JSON — fall through to return detail as-is
    }
  }

  return detail;
}
```

- [ ] **Step 2: Update all toast error handlers to use getErrorMessage**

Replace `error.detail ?? t('fallback')` with `getErrorMessage(error, t('fallback'))` in:

1. `src/features/settings/organization/components/org-settings-form.tsx:325`
2. `src/features/settings/members/components/members-content.tsx:119,129`
3. `src/features/settings/members/components/invite-member-sheet.tsx:56`
4. `src/features/settings/members/components/edit-member-roles-sheet.tsx:62`
5. `src/features/settings/roles/components/roles-content.tsx:67`
6. `src/features/settings/roles/components/role-form-sheet.tsx:69,80`

Each change is the same pattern:
```tsx
// Before:
toast.error(error.detail ?? t('saveError'));
// After:
toast.error(getErrorMessage(error, t('saveError')));
```

Add the import to each file:
```tsx
import { getErrorMessage } from '@/lib/parse-api-error';
```

- [ ] **Step 3: Verify toast shows readable message**

Run: `pnpm dev`
Trigger a Clerk error (e.g., invite an existing member) → toast should show "sufyantaskin@gmail.com is already a member of the organisation." instead of raw JSON.

- [ ] **Step 4: Commit**

```bash
git add src/lib/parse-api-error.ts src/features/settings/organization/components/org-settings-form.tsx src/features/settings/members/components/members-content.tsx src/features/settings/members/components/invite-member-sheet.tsx src/features/settings/members/components/edit-member-roles-sheet.tsx src/features/settings/roles/components/roles-content.tsx src/features/settings/roles/components/role-form-sheet.tsx
git commit -m "fix(errors): parse JSON detail in API errors for readable toast messages"
```

---

### Task 7: Fix mobile sidebar not closing on navigation

`sidebar-nav.tsx` navigates via `Link` but doesn't close the mobile Sheet. Need to call `setOpenMobile(false)` after navigation on mobile.

**Files:**
- Modify: `src/components/layout/sidebar-nav.tsx`

- [ ] **Step 1: Add useSidebar and close on mobile click**

```tsx
// Add import
import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';

// Inside SidebarNav component, add:
const { setOpenMobile, isMobile } = useSidebar();

// Add onClick handler to SidebarMenuButton:
<SidebarMenuButton
  render={<Link href={fullHref} />}
  isActive={isActive}
  tooltip={item.title}
  onClick={() => {
    if (isMobile) setOpenMobile(false);
  }}
>
```

- [ ] **Step 2: Verify sidebar closes on mobile navigation**

Run: `pnpm dev` in mobile viewport (< 768px)
Open sidebar, click Dashboard → sidebar should close.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/sidebar-nav.tsx
git commit -m "fix(sidebar): close mobile sidebar on navigation"
```

---

### Task 8: Fix members filter Clear button hidden when only search is active

`hasFilters` at `members-toolbar.tsx:42` only checks `status !== 'all' || roleId !== 'all'`. When search has text but dropdowns are "all", the Clear button is hidden.

**Files:**
- Modify: `src/features/settings/members/components/members-toolbar.tsx:42`

- [ ] **Step 1: Include search in hasFilters check**

```tsx
// Before:
const hasFilters = status !== 'all' || roleId !== 'all';
// After:
const hasFilters = search !== '' || status !== 'all' || roleId !== 'all';
```

- [ ] **Step 2: Verify Clear button appears with search text**

Run: `pnpm dev`
Navigate to members, type in search field → Clear button should appear.

- [ ] **Step 3: Commit**

```bash
git add src/features/settings/members/components/members-toolbar.tsx
git commit -m "fix(members): show clear button when search filter is active"
```

---

### Task 9: Fix members status filter showing lowercase "activated"

The filter select items use translation keys. In `en.json`, `statusActive` is "Active" and `statusDeactivated` is "Deactivated" — both correctly capitalised. However the filter dropdown "all" option uses `filterStatus` ("Filter by status") which is a long label that looks like a placeholder, not a selected value.

The issue the user reports is about the status filter displaying "activated" (lowercase) after selection. This is likely because the `Select` component in Base UI renders the `value` prop ("active") instead of the children text ("Active").

**Files:**
- Modify: `src/features/settings/members/components/members-toolbar.tsx:62-73`

- [ ] **Step 1: Fix the status Select to properly display labels**

This is the same Base UI Select value rendering issue as Task 5. Investigate and apply the same fix pattern. If `SelectValue` doesn't render children text, render it explicitly:

```tsx
<Select
  value={status}
  onValueChange={(value) => onStatusChange(value ?? 'all')}
>
  <SelectTrigger className="w-36">
    <SelectValue placeholder={t('filterStatus')} />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">{t('filterStatus')}</SelectItem>
    <SelectItem value="active">{t('statusActive')}</SelectItem>
    <SelectItem value="deactivated">{t('statusDeactivated')}</SelectItem>
  </SelectContent>
</Select>
```

If Base UI Select doesn't render the label from children, apply the same manual rendering fix as Task 5. The approach will be determined once Task 5's investigation is complete — apply the same pattern here.

- [ ] **Step 2: Also fix the role filter Select with the same pattern**

Apply the identical fix to the role filter `Select` (lines 76-91).

- [ ] **Step 3: Verify filters show proper labels after selection**

Run: `pnpm dev`
Select "Active" in status filter → trigger should show "Active", not "active".

- [ ] **Step 4: Commit**

```bash
git add src/features/settings/members/components/members-toolbar.tsx
git commit -m "fix(members): show proper labels in filter select triggers"
```

---

### Task 10: Fix revalidateTag wrong signature

`revalidateTag` from `next/cache` takes a single string argument. The current call passes two args.

**Files:**
- Modify: `src/lib/auth.ts:127`

- [ ] **Step 1: Fix the call signature**

```tsx
// Before:
revalidateTag('user-me', 'default');
// After:
revalidateTag('user-me');
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/auth.ts
git commit -m "fix(auth): remove invalid second arg from revalidateTag call"
```

---

### Task 11: Fix Dashboard href hardcoded as '/' in sidebar

`app-sidebar.tsx` line 31 uses `href: '/'` instead of `paths.home`.

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx:31`

- [ ] **Step 1: Replace hardcoded href with paths.home**

```tsx
// Before:
href: '/',
// After:
href: paths.home,
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/app-sidebar.tsx
git commit -m "fix(sidebar): use paths.home constant for dashboard href"
```

---

## Chunk 2: UX Improvements

### Task 12: Restructure sidebar — Dashboard top, Settings bottom

Remove the "Overview" group (redundant label for a single item). Move Dashboard to top without group label. Move Settings to bottom with a separator.

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`
- Modify: `messages/en.json` (remove `layout.sidebar.labels.overview` if no longer used)

- [ ] **Step 1: Restructure sidebar layout**

```tsx
export function AppSidebar(props: ComponentProps<typeof Sidebar>) {
  const t = useTranslations('layout.sidebar');
  const { permissions } = useMe();

  const showSettings = ANY_SETTINGS_READ_PERMISSION.some((p) =>
    permissions.includes(p)
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* Main navigation — no group label needed for single items */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarNav
                item={{
                  title: t('menu.dashboard'),
                  href: paths.home,
                  icon: LayoutDashboard,
                }}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer pushes settings to bottom */}
        <div className="flex-1" />

        {/* Settings at bottom, separated */}
        {showSettings && (
          <SidebarGroup>
            <SidebarSeparator />
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarNav
                  item={{
                    title: t('menu.settings'),
                    href: paths.settings.root,
                    icon: Settings,
                  }}
                />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
```

Add `SidebarSeparator` to the imports.

- [ ] **Step 2: Remove unused translation key**

Remove `layout.sidebar.labels.overview` from `messages/en.json` if no longer used. Keep `layout.sidebar.labels.settings` if still needed elsewhere, otherwise remove it too.

- [ ] **Step 3: Verify sidebar layout**

Run: `pnpm dev`
Dashboard should be at top without "Overview" label. Settings should be at the bottom with a separator line above it.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-sidebar.tsx messages/en.json
git commit -m "fix(sidebar): move dashboard to top, settings to bottom"
```

---

### Task 13: Add breadcrumb + Cmd+K trigger to header

Header is nearly empty. Add: (1) breadcrumb derived from `usePathname()`, (2) Cmd+K search trigger button.

**Files:**
- Modify: `src/components/layout/app-header.tsx`
- Modify: `messages/en.json` (add `layout.header.search` key)

- [ ] **Step 1: Build breadcrumb config**

Create a breadcrumb mapping from path segments to translation keys. This lives inside `app-header.tsx` as a simple lookup — no separate file needed.

```tsx
'use client';

import { SearchIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { UserMenu } from '@/components/layout/user-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { paths } from '@/config/routes';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { Link, usePathname } from '@/i18n/routing';

// Maps path segments to translation keys in `pages.*`
const SEGMENT_KEYS: Record<string, string> = {
  settings: 'settings',
  organization: 'settingsOrganization',
  members: 'settingsMembers',
  roles: 'settingsRoles',
  account: 'account',
  profile: 'accountProfile',
  preferences: 'accountPreferences',
};

export function AppHeader() {
  const pathname = usePathname();
  const t = useTranslations('pages');
  const tLayout = useTranslations('layout.header');

  // Parse breadcrumb from pathname: /orgSlug/settings/members → ["settings", "members"]
  const segments = pathname.split('/').filter(Boolean);
  const orgSlug = segments[0]; // first segment is always orgSlug
  const pathSegments = segments.slice(1); // remaining are page segments

  // Build breadcrumb items
  const breadcrumbs = pathSegments.map((segment, index) => {
    const href = `/${orgSlug}/${pathSegments.slice(0, index + 1).join('/')}`;
    const translationKey = SEGMENT_KEYS[segment];
    const label = translationKey ? t(translationKey) : segment;
    const isLast = index === pathSegments.length - 1;
    return { href, label, isLast };
  });

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      {/* Breadcrumb */}
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href={`/${orgSlug}`} />}>
              {t('dashboard')}
            </BreadcrumbLink>
          </BreadcrumbItem>
          {breadcrumbs.map((crumb) => (
            <BreadcrumbItem key={crumb.href}>
              <BreadcrumbSeparator />
              {crumb.isLast ? (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink render={<Link href={crumb.href} />}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

      {/* Cmd+K search trigger */}
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground hidden gap-2 sm:flex"
        onClick={() => {
          // Dispatch Cmd+K to open existing CommandPalette
          window.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })
          );
        }}
      >
        <SearchIcon className="size-4" />
        <span className="text-xs">{tLayout('search')}</span>
        <kbd className="bg-muted pointer-events-none ml-1 inline-flex h-5 items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <UserMenu />
    </header>
  );
}
```

- [ ] **Step 2: Add translation keys**

Add to `messages/en.json` under `layout.header`:

```json
"header": {
  "logoAria": "Site Logo",
  "search": "Search..."
}
```

- [ ] **Step 3: Verify breadcrumb component exists in shadcn/ui**

Check if `src/components/ui/breadcrumb.tsx` exists. If not, install it:

```bash
npx shadcn@latest add breadcrumb
```

Verify the Breadcrumb component uses `render` prop (Base UI) not `asChild`.

- [ ] **Step 4: Verify header shows breadcrumb and search trigger**

Run: `pnpm dev`
Navigate to Settings > Members → breadcrumb should show "Dashboard > Settings > Members". Click the search button → command palette should open.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/app-header.tsx messages/en.json src/components/ui/breadcrumb.tsx
git commit -m "feat(header): add breadcrumb navigation and Cmd+K search trigger"
```

---

### Task 14: Show permissions read-only for system roles

System roles can't be edited/deleted but users should see what permissions they contain. Add a "View permissions" action that opens a read-only sheet.

**Files:**
- Create: `src/features/settings/roles/components/view-permissions-sheet.tsx`
- Modify: `src/features/settings/roles/components/role-card.tsx`
- Modify: `src/features/settings/roles/components/roles-content.tsx`
- Modify: `messages/en.json` (add `roles.viewPermissions` key)

- [ ] **Step 1: Create ViewPermissionsSheet component**

```tsx
'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { usePermissions } from '../hooks/use-roles';
import type { OrgRoleItem } from '../types';

interface ViewPermissionsSheetProps {
  role: OrgRoleItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewPermissionsSheet({
  role,
  open,
  onOpenChange,
}: ViewPermissionsSheetProps) {
  const t = useTranslations('roles');
  const { data: permissionGroups } = usePermissions();

  if (!role) return null;

  // Filter permission groups to only show permissions this role has
  const rolePermissions = new Set(role.permissionCodes);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[420px] overflow-y-auto sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>{role.name}</SheetTitle>
          <SheetDescription>{t('viewPermissionsDescription')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          {permissionGroups?.map((group) => {
            const groupPerms = group.permissions.filter((p) =>
              rolePermissions.has(p.code)
            );
            if (groupPerms.length === 0) return null;

            return (
              <div key={group.group} className="space-y-2">
                <span className="text-sm font-medium capitalize">
                  {group.group}
                </span>
                <div className="space-y-1 pl-1">
                  {groupPerms.map((permission) => (
                    <div key={permission.code} className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {permission.code}
                      </Badge>
                      {permission.description && (
                        <span className="text-muted-foreground text-xs">
                          {permission.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 2: Make system role card clickable to view permissions**

In `role-card.tsx`, add an `onView` prop and make the system role's lock icon area clickable:

```tsx
interface RoleCardProps {
  role: OrgRoleItem;
  canManage: boolean;
  onEdit: (role: OrgRoleItem) => void;
  onDelete: (role: OrgRoleItem) => void;
  onView: (role: OrgRoleItem) => void;
}
```

Replace the system role's `LockIcon` section:
```tsx
{role.isSystem ? (
  <Button
    variant="ghost"
    size="icon-sm"
    onClick={() => onView(role)}
    aria-label={t('viewPermissions')}
  >
    <LockIcon className="text-muted-foreground size-4" />
  </Button>
) : canManage ? (
  // ... existing dropdown
```

- [ ] **Step 3: Wire up ViewPermissionsSheet in RolesContent**

In `roles-content.tsx`, add state for the view sheet and pass `onView` to each `RoleCard`:

```tsx
const [viewingRole, setViewingRole] = useState<OrgRoleItem | null>(null);

// In RoleCard:
<RoleCard
  key={role.roleId}
  role={role}
  canManage={canManage}
  onEdit={handleEdit}
  onDelete={setDeletingRole}
  onView={setViewingRole}
/>

// After the delete dialog:
<ViewPermissionsSheet
  role={viewingRole}
  open={!!viewingRole}
  onOpenChange={(open) => {
    if (!open) setViewingRole(null);
  }}
/>
```

- [ ] **Step 4: Add translation keys**

Add to `messages/en.json` under `roles`:
```json
"viewPermissions": "View Permissions",
"viewPermissionsDescription": "Permissions assigned to this system role"
```

- [ ] **Step 5: Verify system roles show permissions**

Run: `pnpm dev`
Navigate to roles page, click the lock icon on a system role → sheet should open showing the role's permissions grouped.

- [ ] **Step 6: Commit**

```bash
git add src/features/settings/roles/components/view-permissions-sheet.tsx src/features/settings/roles/components/role-card.tsx src/features/settings/roles/components/roles-content.tsx messages/en.json
git commit -m "feat(roles): add read-only permissions view for system roles"
```

---

### Task 15: Members filter labels — add proper placeholders

The filter selects show "Filter by status" and "Filter by role" as both placeholder AND the "all" option. After selecting "all", it still reads like an unset placeholder. Better: use shorter labels when "all" is selected and clear placeholder text.

**Files:**
- Modify: `src/features/settings/members/components/members-toolbar.tsx`
- Modify: `messages/en.json`

- [ ] **Step 1: Add proper "all" option labels**

Add to `messages/en.json` under `members`:
```json
"allStatuses": "All Statuses",
"allRoles": "All Roles"
```

Update the Select items in `members-toolbar.tsx`:
```tsx
// Status select — "all" option:
<SelectItem value="all">{t('allStatuses')}</SelectItem>

// Role select — "all" option:
<SelectItem value="all">{t('allRoles')}</SelectItem>
```

- [ ] **Step 2: Commit**

```bash
git add src/features/settings/members/components/members-toolbar.tsx messages/en.json
git commit -m "fix(members): use proper labels for 'all' filter options"
```

---

## Chunk 3: Reusable Input Components

### Task 16: Create reusable Country picker (Combobox)

A searchable combobox for selecting a country. Uses ISO 3166-1 alpha-2 codes. Shows flag emoji + country name in dropdown, stores the 2-letter code.

**Files:**
- Create: `src/components/shared/country-picker.tsx`
- Create: `src/lib/data/countries.ts`

- [ ] **Step 1: Research best approach for country data**

Options:
1. **Static data file** with ~250 countries — simple, no dependency, ~10KB
2. **`i18n-iso-countries` package** — full i18n support but adds dependency

For this project: use a static data file. Country names in English are sufficient (the app is English-only for now). Later, if i18n expands, switch to a package.

- [ ] **Step 2: Create countries data file**

Create `src/lib/data/countries.ts` with a typed array of `{ code: string; name: string; flag: string }`. Include all ISO 3166-1 alpha-2 countries. Generate flag emoji from code: `String.fromCodePoint(...code.split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65))`.

```tsx
export type Country = {
  code: string;
  name: string;
  flag: string;
};

function codeToFlag(code: string): string {
  return String.fromCodePoint(
    ...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
  );
}

// Top countries first for convenience, then alphabetical
export const countries: Country[] = [
  { code: 'GB', name: 'United Kingdom', flag: codeToFlag('GB') },
  { code: 'US', name: 'United States', flag: codeToFlag('US') },
  { code: 'TR', name: 'Turkey', flag: codeToFlag('TR') },
  // ... all ISO 3166-1 alpha-2 countries
].sort((a, b) => a.name.localeCompare(b.name));
```

Generate the full list with all ~250 countries.

- [ ] **Step 3: Create CountryPicker component**

Create `src/components/shared/country-picker.tsx` using shadcn's Combobox pattern (Popover + Command):

```tsx
'use client';

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { countries } from '@/lib/data/countries';
import { cn } from '@/lib/utils';

interface CountryPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function CountryPicker({
  value,
  onChange,
  placeholder,
  disabled,
  id,
}: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('common');

  const selected = countries.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          />
        }
      >
        {selected ? (
          <span>
            {selected.flag} {selected.name}
          </span>
        ) : (
          <span className="text-muted-foreground">
            {placeholder ?? t('selectCountry')}
          </span>
        )}
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('searchCountry')} />
          <CommandList>
            <CommandEmpty>{t('noResultFound')}</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code}`}
                  onSelect={() => {
                    onChange(country.code === value ? '' : country.code);
                    setOpen(false);
                  }}
                >
                  <span className="mr-2">{country.flag}</span>
                  {country.name}
                  <CheckIcon
                    className={cn(
                      'ml-auto size-4',
                      value === country.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 4: Add translation keys**

Add to `messages/en.json` under `common`:
```json
"selectCountry": "Select country",
"searchCountry": "Search countries..."
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/data/countries.ts src/components/shared/country-picker.tsx messages/en.json
git commit -m "feat(ui): add reusable CountryPicker combobox component"
```

---

### Task 17: Create reusable Currency picker (Combobox)

Same pattern as CountryPicker. Shows currency code + name + symbol. Stores ISO 4217 code.

**Files:**
- Create: `src/components/shared/currency-picker.tsx`
- Create: `src/lib/data/currencies.ts`

- [ ] **Step 1: Create currencies data file**

Create `src/lib/data/currencies.ts` with common currencies:

```tsx
export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export const currencies: Currency[] = [
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  // ... all major ISO 4217 currencies (~150)
].sort((a, b) => a.name.localeCompare(b.name));
```

Include all commonly used currencies (~150 codes).

- [ ] **Step 2: Create CurrencyPicker component**

Create `src/components/shared/currency-picker.tsx` — same Popover + Command pattern as CountryPicker. Display format: `USD — US Dollar ($)`. Search by code, name, or symbol.

- [ ] **Step 3: Add translation keys**

Add to `messages/en.json` under `common`:
```json
"selectCurrency": "Select currency",
"searchCurrency": "Search currencies..."
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/data/currencies.ts src/components/shared/currency-picker.tsx messages/en.json
git commit -m "feat(ui): add reusable CurrencyPicker combobox component"
```

---

### Task 18: Create reusable Timezone picker (Combobox)

Uses `Intl.supportedValuesOf('timeZone')` to get the browser's supported IANA timezones. No static data needed.

**Files:**
- Create: `src/components/shared/timezone-picker.tsx`

- [ ] **Step 1: Create TimezonePicker component**

```tsx
'use client';

import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TimezonePickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function TimezonePicker({
  value,
  onChange,
  placeholder,
  disabled,
  id,
}: TimezonePickerProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('common');

  const timezones = useMemo(() => {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch {
      // Fallback for older browsers
      return [];
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal"
          />
        }
      >
        {value ? (
          <span className="truncate">{value.replace(/_/g, ' ')}</span>
        ) : (
          <span className="text-muted-foreground">
            {placeholder ?? t('selectTimezone')}
          </span>
        )}
        <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('searchTimezone')} />
          <CommandList>
            <CommandEmpty>{t('noResultFound')}</CommandEmpty>
            <CommandGroup>
              {timezones.map((tz) => (
                <CommandItem
                  key={tz}
                  value={tz}
                  onSelect={() => {
                    onChange(tz === value ? '' : tz);
                    setOpen(false);
                  }}
                >
                  {tz.replace(/_/g, ' ')}
                  <CheckIcon
                    className={cn(
                      'ml-auto size-4',
                      value === tz ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

- [ ] **Step 2: Add translation keys**

Add to `messages/en.json` under `common`:
```json
"selectTimezone": "Select timezone",
"searchTimezone": "Search timezones..."
```

- [ ] **Step 3: Commit**

```bash
git add src/components/shared/timezone-picker.tsx messages/en.json
git commit -m "feat(ui): add reusable TimezonePicker combobox component"
```

---

### Task 19: Create reusable Phone input with country code

A phone input with a country code dropdown (flag + dial code) and formatted number field. Uses `libphonenumber-js` (already a dependency) for validation and formatting.

**Files:**
- Create: `src/components/shared/phone-input.tsx`
- Create: `src/lib/data/phone-codes.ts`

- [ ] **Step 1: Create phone codes data**

Create `src/lib/data/phone-codes.ts` — derive from the countries data, adding dial codes:

```tsx
export type PhoneCountry = {
  code: string;  // ISO alpha-2
  name: string;
  flag: string;
  dialCode: string;
};

export const phoneCountries: PhoneCountry[] = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90' },
  // ... all countries with dial codes
];
```

- [ ] **Step 2: Create PhoneInput component**

Create `src/components/shared/phone-input.tsx`:

```tsx
'use client';

import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { ChevronsUpDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { phoneCountries, type PhoneCountry } from '@/lib/data/phone-codes';

interface PhoneInputProps {
  value: string;  // E.164 format or empty
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function PhoneInput({
  value,
  onChange,
  placeholder,
  disabled,
  id,
}: PhoneInputProps) {
  const t = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<PhoneCountry>(
    phoneCountries.find((c) => c.code === 'GB') ?? phoneCountries[0]
  );
  const [nationalNumber, setNationalNumber] = useState('');

  // Parse initial value into country + national number
  useEffect(() => {
    if (!value) return;
    const parsed = parsePhoneNumberFromString(value);
    if (parsed) {
      const matchedCountry = phoneCountries.find(
        (c) => c.code === parsed.country
      );
      if (matchedCountry) setCountry(matchedCountry);
      setNationalNumber(parsed.nationalNumber);
    }
  }, []); // Only on mount

  const handleCountryChange = useCallback(
    (newCountry: PhoneCountry) => {
      setCountry(newCountry);
      setOpen(false);
      // Re-format with new country code
      if (nationalNumber) {
        const full = `${newCountry.dialCode}${nationalNumber}`;
        const parsed = parsePhoneNumberFromString(full, newCountry.code as any);
        onChange(parsed?.format('E.164') ?? full);
      }
    },
    [nationalNumber, onChange]
  );

  const handleNumberChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const num = e.target.value.replace(/[^\d]/g, '');
      setNationalNumber(num);
      if (num) {
        const full = `${country.dialCode}${num}`;
        const parsed = parsePhoneNumberFromString(full, country.code as any);
        onChange(parsed?.format('E.164') ?? full);
      } else {
        onChange('');
      }
    },
    [country, onChange]
  );

  return (
    <div className="flex gap-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              disabled={disabled}
              className="w-[100px] shrink-0 justify-between px-2 font-normal"
            />
          }
        >
          <span>{country.flag} {country.dialCode}</span>
          <ChevronsUpDownIcon className="ml-1 size-3 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder={t('searchCountry')} />
            <CommandList>
              <CommandEmpty>{t('noResultFound')}</CommandEmpty>
              <CommandGroup>
                {phoneCountries.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.code} ${c.dialCode}`}
                    onSelect={() => handleCountryChange(c)}
                  >
                    <span className="mr-2">{c.flag}</span>
                    {c.name}
                    <span className="text-muted-foreground ml-auto text-xs">
                      {c.dialCode}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        id={id}
        type="tel"
        value={nationalNumber}
        onChange={handleNumberChange}
        placeholder={placeholder ?? t('phoneNumber')}
        disabled={disabled}
        className="flex-1"
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/data/phone-codes.ts src/components/shared/phone-input.tsx
git commit -m "feat(ui): add reusable PhoneInput with country code picker"
```

---

### Task 20: Create shared FormField component

Extract the `FormField` pattern used in `org-settings-form.tsx` into a shared component. Make it generic so it works with any form schema, not just `OrgSettingsInput`.

**Files:**
- Create: `src/components/shared/form-field.tsx`
- Modify: `src/features/settings/organization/components/org-settings-form.tsx` (use shared component)

- [ ] **Step 1: Create shared FormField**

```tsx
'use client';

import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FormFieldProps<T extends FieldValues> {
  label: string;
  name: Path<T>;
  placeholder?: string;
  methods: UseFormReturn<T>;
  disabled?: boolean;
  type?: string;
  children?: React.ReactNode; // For custom inputs (pickers, phone, etc.)
}

export function FormField<T extends FieldValues>({
  label,
  name,
  placeholder,
  methods,
  disabled,
  type = 'text',
  children,
}: FormFieldProps<T>) {
  const error = methods.formState.errors[name];

  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      {children ?? (
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          {...methods.register(name)}
        />
      )}
      {error?.message && (
        <p className="text-destructive mt-1 text-xs">
          {String(error.message)}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Replace local FormField in org-settings-form.tsx**

Remove the local `FormField` function (lines 53-85) and import from shared:

```tsx
import { FormField } from '@/components/shared/form-field';
```

All existing `<FormField>` usages in the form should work as-is since the API is the same.

- [ ] **Step 3: Verify org settings form still works**

Run: `pnpm dev`
Navigate to org settings, verify all fields render correctly, validation works.

- [ ] **Step 4: Commit**

```bash
git add src/components/shared/form-field.tsx src/features/settings/organization/components/org-settings-form.tsx
git commit -m "refactor(ui): extract shared FormField component"
```

---

### Task 21: Integrate pickers into org settings form

Replace plain text inputs for country, currency, timezone, and phone fields with the new picker components.

**Files:**
- Modify: `src/features/settings/organization/components/org-settings-form.tsx`

- [ ] **Step 1: Replace countryCode field with CountryPicker**

Replace the `<FormField>` for `countryCode` with a `FormField` that uses the `children` prop:

```tsx
<FormField
  label={t('countryCode')}
  name="countryCode"
  methods={methods}
  disabled={disabled}
>
  <CountryPicker
    id="countryCode"
    value={methods.watch('countryCode')}
    onChange={(val) => methods.setValue('countryCode', val, { shouldValidate: true, shouldDirty: true })}
    placeholder={t('countryCodePlaceholder')}
    disabled={disabled}
  />
</FormField>
```

Do the same for `taxCountry`.

- [ ] **Step 2: Replace currencyCode field with CurrencyPicker**

```tsx
<FormField
  label={t('currencyCode')}
  name="currencyCode"
  methods={methods}
  disabled={disabled}
>
  <CurrencyPicker
    id="currencyCode"
    value={methods.watch('currencyCode')}
    onChange={(val) => methods.setValue('currencyCode', val, { shouldValidate: true, shouldDirty: true })}
    placeholder={t('currencyCodePlaceholder')}
    disabled={disabled}
  />
</FormField>
```

- [ ] **Step 3: Replace timezone field with TimezonePicker**

```tsx
<FormField
  label={t('timezone')}
  name="timezone"
  methods={methods}
  disabled={disabled}
>
  <TimezonePicker
    id="timezone"
    value={methods.watch('timezone')}
    onChange={(val) => methods.setValue('timezone', val, { shouldValidate: true, shouldDirty: true })}
    placeholder={t('timezonePlaceholder')}
    disabled={disabled}
  />
</FormField>
```

- [ ] **Step 4: Replace contactPhone field with PhoneInput**

```tsx
<FormField
  label={t('contactPhone')}
  name="contactPhone"
  methods={methods}
  disabled={disabled}
>
  <PhoneInput
    id="contactPhone"
    value={methods.watch('contactPhone')}
    onChange={(val) => methods.setValue('contactPhone', val, { shouldValidate: true, shouldDirty: true })}
    placeholder={t('contactPhonePlaceholder')}
    disabled={disabled}
  />
</FormField>
```

- [ ] **Step 5: Add imports at top of file**

```tsx
import { CountryPicker } from '@/components/shared/country-picker';
import { CurrencyPicker } from '@/components/shared/currency-picker';
import { PhoneInput } from '@/components/shared/phone-input';
import { TimezonePicker } from '@/components/shared/timezone-picker';
```

- [ ] **Step 6: Verify all picker fields work in org settings form**

Run: `pnpm dev`
Navigate to org settings:
- Country fields → should show searchable dropdown with flags
- Currency → searchable dropdown with code + name + symbol
- Timezone → searchable dropdown with all IANA timezones
- Phone → country code picker + formatted input

- [ ] **Step 7: Commit**

```bash
git add src/features/settings/organization/components/org-settings-form.tsx
git commit -m "feat(org-settings): integrate country/currency/timezone/phone pickers"
```

---

## Chunk 4: Final Verification

### Task 22: Run lint, type-check, and verify build

- [ ] **Step 1: Run lint**

```bash
pnpm lint
```

Fix any new lint errors introduced by our changes.

- [ ] **Step 2: Run type check**

```bash
pnpm type:check
```

Fix any type errors.

- [ ] **Step 3: Run build**

```bash
pnpm build
```

Ensure production build succeeds.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: lint and type-check fixes"
```

---

## Summary of All Changes

### Files Created (7)
- `src/lib/parse-api-error.ts` — error message parser
- `src/features/settings/roles/components/view-permissions-sheet.tsx` — read-only permissions view
- `src/components/shared/country-picker.tsx` — country combobox
- `src/components/shared/currency-picker.tsx` — currency combobox
- `src/components/shared/timezone-picker.tsx` — timezone combobox
- `src/components/shared/phone-input.tsx` — phone input with country code
- `src/components/shared/form-field.tsx` — shared form field wrapper
- `src/lib/data/countries.ts` — country data
- `src/lib/data/currencies.ts` — currency data
- `src/lib/data/phone-codes.ts` — phone dial codes

### Files Modified (14)
- `src/components/ui/form.tsx` — deep equality guard for resetValues
- `src/features/settings/members/components/members-content.tsx` — pageSize state
- `src/features/settings/members/components/members-toolbar.tsx` — filter fixes
- `src/features/settings/members/components/edit-member-roles-sheet.tsx` — defaultValues
- `src/features/settings/members/components/invite-member-sheet.tsx` — role name display
- `src/features/settings/organization/components/org-settings-form.tsx` — picker integration + shared FormField
- `src/features/settings/roles/components/role-card.tsx` — onView prop
- `src/features/settings/roles/components/roles-content.tsx` — view permissions sheet
- `src/features/settings/roles/components/role-form-sheet.tsx` — error parsing
- `src/components/layout/app-sidebar.tsx` — restructured layout
- `src/components/layout/app-header.tsx` — breadcrumb + cmd+k
- `src/components/layout/sidebar-nav.tsx` — mobile close
- `src/lib/auth.ts` — revalidateTag fix
- `messages/en.json` — new translation keys
