# API Feature Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring propentro-app frontend to full API feature parity — fix infrastructure bugs, add missing CRUD operations, standardize proxy paths, and correct spelling to American English everywhere.

**Architecture:** Phase 1 fixes all infrastructure blockers (env, proxy paths, auth, HTTP methods, return types). Phase 2 adds vertical feature slices in parallel — shared components first (HardDeleteConfirmation, DangerZone), then admin org/user/member/invite completions and admin me profile.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, TanStack Query 5, shadcn/ui v4, Zod 4, next-intl, pnpm

**Spec:** `docs/superpowers/specs/2026-03-18-api-feature-parity-design.md`

---

## File Map

### Infrastructure (Phase 1)

| Action | File                                                                        | Responsibility                                                                 |
| ------ | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Modify | `.env.example`                                                              | Remove `/v1` from `NEXT_PUBLIC_BASE_API_URL`                                   |
| Modify | `src/lib/auth.ts:38`                                                        | Change `/me` → `/v1/me`                                                        |
| Modify | `src/lib/api-client.ts:70`                                                  | Add optional `headers` param to `delete` method                                |
| Modify | `src/lib/proxy-request.ts:57-64`                                            | Forward `X-Confirm-Delete` header                                              |
| Modify | `src/lib/admin-proxy-request.ts:49-56`                                      | Forward `X-Confirm-Delete` header                                              |
| Modify | `src/app/[locale]/select-workspace/page.tsx:13-27,42`                       | Replace `checkSuperAdmin()` with JWT claim check                               |
| Modify | `src/app/[locale]/admin/layout.tsx:17`                                      | Replace `user.isSystemAdmin` with JWT claim check                              |
| Modify | `src/types/user.types.ts:25`                                                | Remove `isSystemAdmin` field from `CurrentUser`                                |
| Modify | `src/hooks/use-session.ts:19`                                               | Add `isSystemAdmin` from JWT `sessionClaims`                                   |
| Modify | `src/components/layout/app-sidebar.tsx:29,79`                               | Replace `useMe().isSystemAdmin` with `useSession().isSystemAdmin`              |
| Modify | `src/app/api/me/route.ts`                                                   | Add `/v1` prefix to path                                                       |
| Modify | `src/app/api/organizations/settings/route.ts`                               | Add `/v1` prefix                                                               |
| Modify | `src/app/api/organizations/permissions/route.ts`                            | Add `/v1` prefix                                                               |
| Modify | `src/app/api/organizations/roles/route.ts`                                  | Add `/v1` prefix                                                               |
| Modify | `src/app/api/organizations/roles/[id]/route.ts`                             | Add `/v1` prefix                                                               |
| Modify | `src/app/api/organizations/members/route.ts`                                | Add `/v1` prefix                                                               |
| Modify | `src/app/api/organizations/members/[id]/route.ts`                           | Add `/v1` prefix                                                               |
| Modify | `src/app/api/organizations/members/[id]/deactivate/route.ts`                | `POST` → `PATCH` + add `/v1` prefix                                            |
| Modify | `src/app/api/organizations/members/[id]/reactivate/route.ts`                | `POST` → `PATCH` + add `/v1` prefix                                            |
| Modify | `src/app/api/organizations/invites/route.ts`                                | Add `/v1` prefix                                                               |
| Modify | `src/app/api/organizations/invites/[id]/route.ts`                           | Add `/v1` prefix                                                               |
| Create | `src/app/api/organizations/members/[id]/roles/route.ts`                     | New proxy: `PATCH /v1/organizations/members/{id}/roles`                        |
| Modify | `src/features/settings/members/hooks/use-members.ts:83`                     | Fix path to `/organizations/members/${userId}/roles`                           |
| Modify | `src/features/settings/members/hooks/use-members.ts:101`                    | `apiClient.post` → `apiClient.patch`                                           |
| Modify | `src/features/settings/members/hooks/use-members.ts:114`                    | `apiClient.post` → `apiClient.patch`                                           |
| Modify | `src/features/admin/hooks/use-admin-invites.ts:84`                          | `apiClient.delete` → `apiClient.patch` with path `/admin/invites/${id}/cancel` |
| Delete | `src/app/api/admin/invites/[id]/route.ts`                                   | Remove orphaned DELETE route                                                   |
| Create | `src/app/api/admin/invites/[id]/cancel/route.ts`                            | New proxy: `PATCH /v1/admin/invites/{id}/cancel`                               |
| Modify | `src/features/admin/hooks/use-admin-organizations.ts:56`                    | `AdminMember[]` → `PagedResult<AdminMember>`                                   |
| Modify | `src/features/admin/hooks/use-admin-invites.ts:37`                          | `AdminInvite[]` → `PagedResult<AdminInvite>`                                   |
| Create | `src/app/api/admin/organizations/[id]/reactivate/route.ts`                  | New proxy: `PATCH /v1/admin/organizations/{id}/reactivate`                     |
| Modify | `src/app/api/admin/organizations/[id]/route.ts`                             | Add `DELETE` export                                                            |
| Modify | `src/app/api/admin/users/[id]/route.ts`                                     | Add `DELETE` export                                                            |
| Create | `src/app/api/admin/organizations/[id]/members/[userId]/deactivate/route.ts` | New proxy                                                                      |
| Create | `src/app/api/admin/organizations/[id]/members/[userId]/reactivate/route.ts` | New proxy                                                                      |
| Create | `src/app/api/admin/me/route.ts`                                             | New proxy: `GET /v1/admin/me`                                                  |
| Modify | `CLAUDE.md`                                                                 | Fix spelling rule + add proxy path convention                                  |
| Modify | `messages/en.json`                                                          | British → American English corrections                                         |

### Phase 2 — Vertical Slices

| Action | File                                                          | Responsibility                                                     |
| ------ | ------------------------------------------------------------- | ------------------------------------------------------------------ |
| Create | `src/components/shared/hard-delete-confirmation.tsx`          | Two-stage delete dialog (Slice G)                                  |
| Create | `src/components/shared/danger-zone.tsx`                       | Red-bordered danger section (Slice G)                              |
| Modify | `src/features/settings/members/hooks/use-members.ts`          | Add `useMember` detail hook (Slice A)                              |
| Modify | `src/features/admin/hooks/use-admin-organizations.ts`         | Add `useReactivateOrganization`, `useDeleteOrganization` (Slice B) |
| Create | `src/features/admin/validators/create-organization.schema.ts` | Zod schema (Slice B)                                               |
| Create | `src/features/admin/validators/update-organization.schema.ts` | Zod schema (Slice B)                                               |
| Modify | `src/features/admin/components/organization-detail.tsx`       | Reactivate UI, DangerZone, invite sheet, Zod forms (Slice B)       |
| Modify | `src/features/admin/hooks/use-admin-users.ts`                 | Add `useDeleteUser` (Slice C)                                      |
| Modify | `src/features/admin/components/user-detail.tsx`               | DangerZone, fix cancel button key (Slice C)                        |
| Create | `src/features/admin/hooks/use-admin-members.ts` (extend)      | Add deactivate/reactivate hooks (Slice D)                          |
| Modify | `src/features/admin/components/organization-detail.tsx`       | Row actions dropdown, user links (Slice D)                         |
| Modify | `src/features/admin/hooks/use-admin-invites.ts`               | Fix cancel method (done in Phase 1) (Slice E)                      |
| Modify | `src/features/admin/components/invites-list.tsx`              | Cancel button, status badge colors (Slice E)                       |
| Modify | `src/features/admin/components/organization-detail.tsx`       | Cancel button on invites tab (Slice E)                             |
| Modify | `src/features/admin/types/admin.types.ts`                     | Add `AdminMe` type (Slice F)                                       |
| Create | `src/features/admin/hooks/use-admin-me.ts`                    | `useAdminMe` hook (Slice F)                                        |
| Modify | `src/features/admin/components/admin-sidebar.tsx`             | Admin profile footer (Slice F)                                     |
| Modify | `messages/en.json`                                            | New translation keys for all slices                                |

---

## Phase 1 — Infrastructure

> **IMPORTANT:** Tasks 1.1 and 1.2 MUST be done together in a single commit. Running 1.1 alone breaks `getMe()` (path becomes `http://localhost:5181/me` instead of `/v1/me`). Running 1.2 alone creates double `/v1`. After completing both, the developer MUST manually update their `.env.local` to remove `/v1` from `NEXT_PUBLIC_BASE_API_URL` — the dev server will be broken until this is done.

### Task 1.1: Env + Proxy Path Standardization

**Files:**

- Modify: `.env.example`
- Modify: `src/app/api/me/route.ts`
- Modify: `src/app/api/organizations/settings/route.ts`
- Modify: `src/app/api/organizations/permissions/route.ts`
- Modify: `src/app/api/organizations/roles/route.ts`
- Modify: `src/app/api/organizations/roles/[id]/route.ts`
- Modify: `src/app/api/organizations/members/route.ts`
- Modify: `src/app/api/organizations/members/[id]/route.ts`
- Modify: `src/app/api/organizations/invites/route.ts`
- Modify: `src/app/api/organizations/invites/[id]/route.ts`

**Context:** `NEXT_PUBLIC_BASE_API_URL` currently includes `/v1` (e.g., `http://localhost:5181/v1`). Admin proxy routes already hardcode `/v1` in their paths, causing double `/v1/v1/admin/...`. Fix: remove `/v1` from env, add `/v1` prefix to ALL org-scoped proxy route paths. Admin routes already have `/v1` — no change needed for them.

- [ ] **Step 1: Update `.env.example`**

Change `NEXT_PUBLIC_BASE_API_URL=http://localhost:5181/v1` to `NEXT_PUBLIC_BASE_API_URL=http://localhost:5181`

```
NEXT_PUBLIC_BASE_API_URL=http://localhost:5181
```

- [ ] **Step 2: Update `src/app/api/me/route.ts`**

Change path from `/me` to `/v1/me`:

```ts
import { proxyRequest } from '@/lib/proxy-request';

export const GET = (req: Request) => proxyRequest(req, '/v1/me');
```

- [ ] **Step 3: Add `/v1` prefix to all org-scoped proxy routes**

For each file, add `/v1` prefix to the path string passed to `proxyRequest()`:

**`src/app/api/organizations/settings/route.ts`:** `/organizations/settings` → `/v1/organizations/settings` (both GET and PATCH)

**`src/app/api/organizations/permissions/route.ts`:** `/organizations/permissions` → `/v1/organizations/permissions`

**`src/app/api/organizations/roles/route.ts`:** `/organizations/roles` → `/v1/organizations/roles` (both GET and POST)

**`src/app/api/organizations/roles/[id]/route.ts`:** `/organizations/roles/${id}` → `/v1/organizations/roles/${id}` (both PATCH and DELETE)

**`src/app/api/organizations/members/route.ts`:** `/organizations/members` → `/v1/organizations/members`

**`src/app/api/organizations/members/[id]/route.ts`:** `/organizations/members/${id}` → `/v1/organizations/members/${id}`

**`src/app/api/organizations/invites/route.ts`:** `/organizations/invites` → `/v1/organizations/invites` (both GET and POST)

**`src/app/api/organizations/invites/[id]/route.ts`:** `/organizations/invites/${id}/cancel` → `/v1/organizations/invites/${id}/cancel`

- [ ] **Step 4: Update local `.env.local`**

Remind user: update local `.env.local` to remove `/v1` from `NEXT_PUBLIC_BASE_API_URL`.

- [ ] **Step 5: Verify**

Run: `pnpm type:check`
Expected: PASS (no type errors from path string changes)

- [ ] **Step 6: Fix `getMe()` path in `src/lib/auth.ts`**

This MUST be done in the same commit as the env change. In `src/lib/auth.ts`, line 38, change:

```ts
const res = await fetch(`${env.NEXT_PUBLIC_BASE_API_URL}/me`, {
```

to:

```ts
const res = await fetch(`${env.NEXT_PUBLIC_BASE_API_URL}/v1/me`, {
```

- [ ] **Step 7: Verify**

Run: `pnpm type:check`
Expected: PASS (no type errors from path string changes)

- [ ] **Step 8: Commit**

```bash
git add .env.example src/app/api/me/route.ts src/app/api/organizations/ src/lib/auth.ts
git commit -m "fix: standardize proxy paths with /v1 prefix, remove /v1 from env, fix getMe() path"
```

---

### Task 1.2: `apiClient.delete` Headers Support

**Files:**

- Modify: `src/lib/api-client.ts:28-56,70`

**Context:** `apiClient.delete` currently takes only a `path` parameter. Hard delete operations need to send `X-Confirm-Delete` header. Add optional `headers` param to `delete` only. The `apiFetch` function needs to accept and merge custom headers.

- [ ] **Step 1: Update `apiFetch` to accept custom headers**

In `src/lib/api-client.ts`, update `FetchOptions` type (line 12) and `apiFetch` function:

```ts
type FetchOptions = {
  method?: string;
  body?: unknown;
  params?: QueryParams;
  headers?: Record<string, string>;
};
```

In `apiFetch` (line 35-41), merge custom headers:

```ts
const res = await fetch(`${BASE}${buildUrl(path, params)}`, {
  method,
  headers: {
    ...(hasBody && { 'Content-Type': 'application/json' }),
    ...options.headers,
  },
  body: hasBody ? JSON.stringify(body) : undefined,
  signal: AbortSignal.timeout(TIMEOUT_MS),
});
```

- [ ] **Step 2: Update `delete` method signature**

Change line 70 from:

```ts
delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
```

to:

```ts
// TODO: Consider adding headers support to all methods if needed in the future
delete: <T>(path: string, headers?: Record<string, string>) =>
  apiFetch<T>(path, { method: 'DELETE', headers }),
```

- [ ] **Step 3: Verify**

Run: `pnpm type:check`
Expected: PASS (existing `apiClient.delete` calls without headers still work)

- [ ] **Step 4: Commit**

```bash
git add src/lib/api-client.ts
git commit -m "feat: add optional headers param to apiClient.delete for X-Confirm-Delete"
```

---

### Task 1.3: Proxy Request `X-Confirm-Delete` Header Forwarding

**Files:**

- Modify: `src/lib/proxy-request.ts:57-64`
- Modify: `src/lib/admin-proxy-request.ts:49-56`

**Context:** Backend requires `X-Confirm-Delete` header for hard delete operations. Whitelist approach: forward only this specific header from the incoming request to the backend.

- [ ] **Step 1: Update `proxyRequest` in `src/lib/proxy-request.ts`**

Add header extraction before the fetch call (after line 52, before the try block), and include it in the fetch headers:

```ts
// ── Custom header forwarding (whitelist) ──────────────────────────────
const confirmDeleteHeader = request.headers.get('X-Confirm-Delete');

try {
  const res = await fetch(backendUrl.toString(), {
    method,
    headers: {
      ...(hasBody && { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...(confirmDeleteHeader && { 'X-Confirm-Delete': confirmDeleteHeader }),
    },
    body: hasBody ? await request.text() : undefined,
  });
```

- [ ] **Step 2: Update `adminProxyRequest` in `src/lib/admin-proxy-request.ts`**

Apply the same change — add header extraction and forwarding:

```ts
// ── Custom header forwarding (whitelist) ──────────────────────────────
const confirmDeleteHeader = request.headers.get('X-Confirm-Delete');

try {
  const res = await fetch(backendUrl.toString(), {
    method,
    headers: {
      ...(hasBody && { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...(confirmDeleteHeader && { 'X-Confirm-Delete': confirmDeleteHeader }),
    },
    body: hasBody ? await request.text() : undefined,
  });
```

- [ ] **Step 3: Verify**

Run: `pnpm type:check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/proxy-request.ts src/lib/admin-proxy-request.ts
git commit -m "feat: forward X-Confirm-Delete header through proxy layer"
```

---

### Task 1.4: JWT Super Admin Check

**Files:**

- Modify: `src/app/[locale]/select-workspace/page.tsx:13-27,42`
- Modify: `src/app/[locale]/admin/layout.tsx:12-19`
- Modify: `src/types/user.types.ts:25`
- Modify: `src/hooks/use-session.ts:19`
- Modify: `src/components/layout/app-sidebar.tsx:29,79`

**Context:** Currently `checkSuperAdmin()` makes a backend call to `/v1/admin/me` (with a double `/v1` bug). Replace with JWT claim: `sessionClaims.metadata.systemRole === 'super_admin'`. Remove `CurrentUser.isSystemAdmin` field — JWT is the source of truth. The sidebar also reads `isSystemAdmin` from `useMe()` — move this to `useSession()` which reads from Clerk's `sessionClaims`.

- [ ] **Step 1: Update `select-workspace/page.tsx`**

Remove the `checkSuperAdmin` function (lines 13-27). Replace with JWT claim check:

```ts
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { routes } from '@/config/routes';
import { WorkspaceList } from '@/features/select-workspace/components/workspace-list';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SelectWorkspacePage({ params }: Props) {
  const { locale } = await params;
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect(routes.signIn(locale));
  }

  const isSuperAdmin =
    (sessionClaims?.metadata as { systemRole?: string } | undefined)
      ?.systemRole === 'super_admin';

  const [t, client] = await Promise.all([
    getTranslations('workspace'),
    clerkClient(),
  ]);

  const memberships = await client.users.getOrganizationMembershipList({
    userId,
  });

  const orgs = memberships.data.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug!,
    imageUrl: m.organization.imageUrl,
  }));

  // 0 orgs and not super admin — show message
  if (orgs.length === 0 && !isSuperAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">{t('noWorkspaces')}</h1>
        <p className="text-muted-foreground">{t('noWorkspacesDescription')}</p>
      </div>
    );
  }

  // 1 org and not super admin — auto redirect
  if (orgs.length === 1 && !isSuperAdmin) {
    redirect(routes.home(locale, orgs[0].slug));
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">{t('selectWorkspace')}</h1>
        <p className="text-muted-foreground mt-2">{t('selectDescription')}</p>
      </div>
      <WorkspaceList
        orgs={orgs}
        locale={locale}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
```

Key changes: removed `checkSuperAdmin()` function, removed `getToken()`, removed `env` import, read `sessionClaims` from `auth()`, cast metadata and check `systemRole`.

- [ ] **Step 2: Update `admin/layout.tsx`**

Replace `user.isSystemAdmin` check with JWT claim:

```ts
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { routes } from '@/config/routes';
import { AdminLayout } from '@/features/admin/components/admin-layout';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AdminRootLayout({ children, params }: Props) {
  const { locale } = await params;
  const { sessionClaims } = await auth();

  const isSuperAdmin =
    (sessionClaims?.metadata as { systemRole?: string } | undefined)
      ?.systemRole === 'super_admin';

  if (!isSuperAdmin) {
    redirect(routes.selectWorkspace(locale));
  }

  return <AdminLayout>{children}</AdminLayout>;
}
```

Key changes: removed `getMeOrRedirect` import and call, added `auth()` import, check JWT claim instead of `user.isSystemAdmin`.

- [ ] **Step 3: Remove `isSystemAdmin` from `CurrentUser` type**

In `src/types/user.types.ts`, remove line 25 (`isSystemAdmin: boolean;`):

```ts
export type CurrentUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
  organization: Organization;
  roles: string[];
  permissions: Permission[];
};
```

- [ ] **Step 4: Add `isSystemAdmin` to `useSession()` hook**

In `src/hooks/use-session.ts`, extend to read `sessionClaims` from `useAuth()` and expose `isSystemAdmin`:

```ts
'use client';

import { useAuth } from '@clerk/nextjs';

export function useSession() {
  const { orgId, userId, isLoaded, isSignedIn, sessionClaims } = useAuth();

  const isSystemAdmin =
    (sessionClaims?.metadata as { systemRole?: string } | undefined)
      ?.systemRole === 'super_admin';

  return {
    clerkOrgId: orgId,
    clerkUserId: userId,
    isLoaded,
    isSignedIn,
    isSystemAdmin,
  };
}
```

Note: `useAuth()` from `@clerk/nextjs` v7 returns `sessionClaims` which includes the JWT custom claims. The `metadata` field maps to `publicMetadata` set in Clerk dashboard.

- [ ] **Step 5: Update `app-sidebar.tsx` to use `useSession().isSystemAdmin`**

In `src/components/layout/app-sidebar.tsx`:

Line 29 — change:

```ts
const { permissions, isSystemAdmin } = useMe();
```

to:

```ts
const { permissions } = useMe();
const { isSystemAdmin } = useSession();
```

Add import at top:

```ts
import { useSession } from '@/hooks/use-session';
```

The rest of the sidebar code (line 79: `{isSystemAdmin && (`) stays the same — it now reads from `useSession()` instead of `useMe()`.

- [ ] **Step 6: Verify no remaining `isSystemAdmin` references in types**

Run: `grep -r "isSystemAdmin" src/ --include="*.ts" --include="*.tsx" | grep -v "use-session.ts" | grep -v "app-sidebar.tsx" | grep -v "node_modules"`

Expected: Only `src/types/user.types.ts` should no longer have it (removed in Step 3). No other files should reference it.

- [ ] **Step 7: Verify**

Run: `pnpm type:check`
Expected: PASS (no references to removed field)

- [ ] **Step 8: Commit**

```bash
git add src/app/\[locale\]/select-workspace/page.tsx src/app/\[locale\]/admin/layout.tsx src/types/user.types.ts src/hooks/use-session.ts src/components/layout/app-sidebar.tsx
git commit -m "feat: replace checkSuperAdmin() backend call with JWT sessionClaims check"
```

---

### Task 1.5: HTTP Method Fixes

**Files:**

- Modify: `src/features/settings/members/hooks/use-members.ts:83,101,114`
- Modify: `src/app/api/organizations/members/[id]/deactivate/route.ts`
- Modify: `src/app/api/organizations/members/[id]/reactivate/route.ts`
- Create: `src/app/api/organizations/members/[id]/roles/route.ts`
- Modify: `src/features/admin/hooks/use-admin-invites.ts:79-94`
- Delete: `src/app/api/admin/invites/[id]/route.ts`
- Create: `src/app/api/admin/invites/[id]/cancel/route.ts`

**Context:** Multiple HTTP method mismatches between frontend and API. Also `useUpdateMemberRoles` calls wrong path (missing `/roles` suffix).

- [ ] **Step 1: Fix deactivate proxy route — POST → PATCH**

Replace `src/app/api/organizations/members/[id]/deactivate/route.ts`:

```ts
import { proxyRequest } from '@/lib/proxy-request';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return proxyRequest(req, `/v1/organizations/members/${id}/deactivate`);
};
```

Note: also includes the `/v1` prefix from Task 1.1 if not already applied.

- [ ] **Step 2: Fix reactivate proxy route — POST → PATCH**

Replace `src/app/api/organizations/members/[id]/reactivate/route.ts`:

```ts
import { proxyRequest } from '@/lib/proxy-request';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return proxyRequest(req, `/v1/organizations/members/${id}/reactivate`);
};
```

- [ ] **Step 3: Create member roles proxy route**

Create `src/app/api/organizations/members/[id]/roles/route.ts`:

```ts
import { proxyRequest } from '@/lib/proxy-request';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return proxyRequest(req, `/v1/organizations/members/${id}/roles`);
};
```

- [ ] **Step 4: Fix hooks in `use-members.ts`**

In `src/features/settings/members/hooks/use-members.ts`:

**`useUpdateMemberRoles`** (line 83) — fix path:

```ts
mutationFn: ({ userId, roleIds }) =>
  apiClient.patch<void>(`/organizations/members/${userId}/roles`, { roleIds }),
```

**`useDeactivateMember`** (line 101) — change `post` → `patch`:

```ts
mutationFn: (userId) =>
  apiClient.patch<void>(`/organizations/members/${userId}/deactivate`, {}),
```

**`useReactivateMember`** (line 114) — change `post` → `patch`:

```ts
mutationFn: (userId) =>
  apiClient.patch<void>(`/organizations/members/${userId}/reactivate`, {}),
```

- [ ] **Step 5: Fix admin cancel invite — DELETE → PATCH**

In `src/features/admin/hooks/use-admin-invites.ts`, replace `useCancelInvite` (lines 79-94):

```ts
export function useCancelInvite() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (invitePublicId) =>
      apiClient.patch<void>(`/admin/invites/${invitePublicId}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.invites.all(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.all(),
      });
    },
  });
}
```

- [ ] **Step 6: Replace orphaned DELETE route with cancel PATCH route**

Delete `src/app/api/admin/invites/[id]/route.ts`.

Create `src/app/api/admin/invites/[id]/cancel/route.ts`:

```ts
import { adminProxyRequest } from '@/lib/admin-proxy-request';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return adminProxyRequest(req, `/v1/admin/invites/${id}/cancel`);
};
```

- [ ] **Step 7: Verify**

Run: `pnpm type:check`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/app/api/organizations/members/ src/app/api/admin/invites/ src/features/settings/members/hooks/use-members.ts src/features/admin/hooks/use-admin-invites.ts
git commit -m "fix: correct HTTP methods (POST→PATCH, DELETE→PATCH) and add /roles proxy route"
```

---

### Task 1.6: Return Type Fixes

**Files:**

- Modify: `src/features/admin/hooks/use-admin-organizations.ts:52-60`
- Modify: `src/features/admin/hooks/use-admin-invites.ts:33-41`

**Context:** `adminOrgMembersQueryOptions` returns `AdminMember[]` but API returns `PagedResult<AdminMember>`. Same for `adminOrgInvitesQueryOptions` with `AdminInvite[]`.

- [ ] **Step 1: Fix `adminOrgMembersQueryOptions`**

In `src/features/admin/hooks/use-admin-organizations.ts`, change lines 52-60:

```ts
export const adminOrgMembersQueryOptions = (publicId: string) =>
  queryOptions({
    queryKey: adminKeys.organizations.members(publicId),
    queryFn: () =>
      apiClient.get<PagedResult<AdminMember>>(
        `/admin/organizations/${publicId}/members`
      ),
    enabled: !!publicId,
  });
```

Import `PagedResult` is already imported on line 9 — verify it's there.

- [ ] **Step 2: Fix `adminOrgInvitesQueryOptions`**

In `src/features/admin/hooks/use-admin-invites.ts`, change lines 33-41:

```ts
export const adminOrgInvitesQueryOptions = (orgPublicId: string) =>
  queryOptions({
    queryKey: adminKeys.organizations.invites(orgPublicId),
    queryFn: () =>
      apiClient.get<PagedResult<AdminInvite>>(
        `/admin/organizations/${orgPublicId}/invites`
      ),
    enabled: !!orgPublicId,
  });
```

Import `PagedResult` is already imported on line 9 — verify it's there.

- [ ] **Step 3: Update consuming components in `organization-detail.tsx`**

In `src/features/admin/components/organization-detail.tsx`, the data is now `PagedResult<T>` instead of `T[]`. Two exact changes:

**Line 331** — `OrgMembersTable` useReactTable data prop:

```ts
// Before:
data: members ?? [],
// After:
data: members?.items ?? [],
```

**Line 340** — Empty state check (currently `if (!members?.length)`):

```ts
// Before:
if (!members?.length) {
// After:
if (!members?.items?.length) {
```

**Line 464** — `OrgInvitesTable` useReactTable data prop:

```ts
// Before:
data: invites ?? [],
// After:
data: invites?.items ?? [],
```

**Line 473** — Empty state check (currently `if (!invites?.length)`):

```ts
// Before:
if (!invites?.length) {
// After:
if (!invites?.items?.length) {
```

- [ ] **Step 4: Verify**

Run: `pnpm type:check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/hooks/use-admin-organizations.ts src/features/admin/hooks/use-admin-invites.ts src/features/admin/components/organization-detail.tsx
git commit -m "fix: correct return types to PagedResult for admin org members and invites"
```

---

### Task 1.7: Add Missing Proxy Routes

**Files:**

- Create: `src/app/api/admin/organizations/[id]/reactivate/route.ts`
- Modify: `src/app/api/admin/organizations/[id]/route.ts` (add DELETE)
- Modify: `src/app/api/admin/users/[id]/route.ts` (add DELETE)
- Create: `src/app/api/admin/organizations/[id]/members/[userId]/deactivate/route.ts`
- Create: `src/app/api/admin/organizations/[id]/members/[userId]/reactivate/route.ts`
- Create: `src/app/api/admin/me/route.ts`

**Context:** These proxy routes are needed for Phase 2 hooks. Creating them now as infrastructure.

- [ ] **Step 1: Create admin org reactivate route**

Create `src/app/api/admin/organizations/[id]/reactivate/route.ts`:

```ts
import { adminProxyRequest } from '@/lib/admin-proxy-request';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return adminProxyRequest(req, `/v1/admin/organizations/${id}/reactivate`);
};
```

- [ ] **Step 2: Add DELETE to admin org detail route**

In `src/app/api/admin/organizations/[id]/route.ts`, add DELETE export alongside existing GET and PATCH:

```ts
export const DELETE = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return adminProxyRequest(req, `/v1/admin/organizations/${id}`);
};
```

- [ ] **Step 3: Add DELETE to admin user detail route**

In `src/app/api/admin/users/[id]/route.ts`, add DELETE export alongside existing GET:

```ts
export const DELETE = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return adminProxyRequest(req, `/v1/admin/users/${id}`);
};
```

- [ ] **Step 4: Create admin member deactivate route**

Create `src/app/api/admin/organizations/[id]/members/[userId]/deactivate/route.ts`:

```ts
import { adminProxyRequest } from '@/lib/admin-proxy-request';

type Ctx = { params: Promise<{ id: string; userId: string }> };

export const PATCH = async (req: Request, ctx: Ctx) => {
  const { id, userId } = await ctx.params;
  return adminProxyRequest(
    req,
    `/v1/admin/organizations/${id}/members/${userId}/deactivate`
  );
};
```

- [ ] **Step 5: Create admin member reactivate route**

Create `src/app/api/admin/organizations/[id]/members/[userId]/reactivate/route.ts`:

```ts
import { adminProxyRequest } from '@/lib/admin-proxy-request';

type Ctx = { params: Promise<{ id: string; userId: string }> };

export const PATCH = async (req: Request, ctx: Ctx) => {
  const { id, userId } = await ctx.params;
  return adminProxyRequest(
    req,
    `/v1/admin/organizations/${id}/members/${userId}/reactivate`
  );
};
```

- [ ] **Step 6: Create admin me route**

Create `src/app/api/admin/me/route.ts`:

```ts
import { adminProxyRequest } from '@/lib/admin-proxy-request';

export const GET = (req: Request) => adminProxyRequest(req, '/v1/admin/me');
```

- [ ] **Step 7: Verify**

Run: `pnpm type:check`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/app/api/admin/
git commit -m "feat: add missing admin proxy routes (reactivate org, delete org/user, member deactivate/reactivate, admin me)"
```

---

### Task 1.8: CLAUDE.md Updates

**Files:**

- Modify: `CLAUDE.md`

**Context:** Two changes: (1) Fix the "Code: American English; UI text: British English" rule to "American English everywhere". (2) Add proxy path convention rule.

- [ ] **Step 1: Fix spelling rule**

In `CLAUDE.md`, find the section under `### Internationalization`:

```
- **Code:** American English (`organization`); **UI text:** British English (`Organisation`)
```

Replace with:

```
- **American English everywhere** — code, UI text, translations, labels, page titles (matches parent CLAUDE.md convention)
```

Also in the `### Translation Key Guidelines` → `#### Spelling` section, replace:

```
- **Key names** (code layer): American English (`organization`, `color`)
- **Key values** (UI text): British English (`Organisation`, `Colour`)
```

with:

```
- **Key names** (code layer): American English (`organization`, `color`)
- **Key values** (UI text): American English (`Organization`, `Color`)
```

- [ ] **Step 2: Add proxy path convention**

In `CLAUDE.md`, add a new section under `### Data Flow` → `#### API Proxy Architecture`:

```
**Proxy path convention:** All proxy route handler paths MUST include the `/v1` API version prefix (e.g., `/v1/organizations/members`, `/v1/admin/organizations`). `NEXT_PUBLIC_BASE_API_URL` must NOT include a version prefix.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: fix spelling rule to American English everywhere, add proxy path convention"
```

---

### Task 1.9: British → American English in `messages/en.json`

**Files:**

- Modify: `messages/en.json`

**Context:** All British English spellings in UI text must be changed to American English. Key patterns: "Organisation" → "Organization", "Cancelled" → "Canceled", "organisation" → "organization".

- [ ] **Step 1: Replace all British spellings**

Apply these replacements across the entire `messages/en.json`:

| British         | American        |
| --------------- | --------------- |
| `Organisation`  | `Organization`  |
| `organisation`  | `organization`  |
| `Organisations` | `Organizations` |
| `organisations` | `organizations` |
| `Cancelled`     | `Canceled`      |
| `cancelled`     | `canceled`      |

Do NOT change JSON key names — only change JSON string values. Key names are code-layer and already use American English (e.g., the key `"settingsOrganization"` stays as-is, but its value `"Organisation"` → `"Organization"`).

Use find-and-replace on the values only. There are approximately 40+ occurrences based on the grep results.

- [ ] **Step 2: Verify no broken references**

Run: `pnpm type:check && pnpm lint`
Expected: PASS (translation keys unchanged, only values changed)

- [ ] **Step 3: Commit**

```bash
git add messages/en.json
git commit -m "fix: correct British English to American English in all UI translations"
```

---

## Phase 2 — Vertical Slices

### Dependency Graph

```
Phase 1 ──→ Task G (shared components) ──→ Task B (admin org complete)
                                       └──→ Task C (admin users complete)
Phase 1 ──→ Task A (org members polish)     [parallel with G]
Phase 1 ──→ Task D (admin members complete) [parallel with G]
Phase 1 ──→ Task E (admin invites fix)      [parallel with G]
Phase 1 ──→ Task F (admin me)               [parallel with G]
```

**Execution order:** G first (small, ~15 min), then A+B+C+D+E+F can all run in parallel once G is done (B and C depend on G for DangerZone/HardDeleteConfirmation).

---

### Task G: Shared Components — HardDeleteConfirmation + DangerZone

**Files:**

- Create: `src/components/shared/hard-delete-confirmation.tsx`
- Create: `src/components/shared/danger-zone.tsx`
- Modify: `messages/en.json` (add `common.hardDelete.*` and `common.dangerZone.*` keys)

**Context:** Reusable two-stage hard delete dialog and danger zone section used by admin org detail (Task B) and admin user detail (Task C). All text passed as props from calling components — shared component has zero hardcoded strings.

- [ ] **Step 1: Add translation keys to `messages/en.json`**

Add under `common`:

```json
"hardDelete": {
  "continueButton": "Continue",
  "cancelButton": "Cancel",
  "confirmLabel": "Type \"{name}\" to confirm",
  "inputPlaceholder": "Type the name to confirm",
  "deleting": "Deleting..."
},
"dangerZone": {
  "title": "Danger Zone"
}
```

- [ ] **Step 2: Create `src/components/shared/hard-delete-confirmation.tsx`**

Two-stage dialog component:

- Stage 1 (warning): Shows `warningTitle` and `warningDescription`. "Continue" and "Cancel" buttons.
- Stage 2 (typed confirmation): Shows `confirmTitle` and `confirmDescription`. Text input where user must type `entityName` exactly. Submit button (`confirmButtonLabel`) disabled until input matches. Submit calls `onConfirm()`.

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type HardDeleteConfirmationProps = {
  entityName: string;
  warningTitle: string;
  warningDescription: string;
  confirmTitle: string;
  confirmDescription: string;
  confirmButtonLabel: string;
  onConfirm: () => void;
  isPending: boolean;
  trigger: ReactNode;
  loadingLabel: string;
};

export function HardDeleteConfirmation({
  entityName,
  warningTitle,
  warningDescription,
  confirmTitle,
  confirmDescription,
  confirmButtonLabel,
  onConfirm,
  isPending,
  trigger,
  loadingLabel,
}: HardDeleteConfirmationProps) {
  const t = useTranslations('common.hardDelete');
  const [stage, setStage] = useState<'warning' | 'confirm'>('warning');
  const [open, setOpen] = useState(false);
  const [typedName, setTypedName] = useState('');

  const isMatch = typedName === entityName;

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setStage('warning');
      setTypedName('');
    }
  }

  function handleContinue() {
    setStage('confirm');
  }

  function handleConfirm() {
    if (!isMatch) return;
    onConfirm();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger onClick={() => setOpen(true)} render={<span />}>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        {stage === 'warning' ? (
          <>
            <DialogHeader>
              <DialogTitle>{warningTitle}</DialogTitle>
              <DialogDescription>{warningDescription}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('cancelButton')}
              </Button>
              <Button variant="destructive" onClick={handleContinue}>
                {t('continueButton')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{confirmTitle}</DialogTitle>
              <DialogDescription>{confirmDescription}</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label>{t('confirmLabel', { name: entityName })}</Label>
              <Input
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder={t('inputPlaceholder')}
                autoComplete="off"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {t('cancelButton')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirm}
                disabled={!isMatch || isPending}
              >
                {isPending ? loadingLabel : confirmButtonLabel}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

**Note on `DialogTrigger`:** shadcn/ui v4 (Base UI) uses `render` prop, not `asChild`. The `render` prop requires a single element, not a React fragment. We use `render={<span />}` and pass the trigger as children. The `open` state is controlled manually via `onClick={() => setOpen(true)}` on the trigger. Verify this pattern works with the actual Dialog component — if `DialogTrigger` manages `open` state automatically, use `<Dialog open={open} onOpenChange={handleOpenChange}>` without `DialogTrigger` and use a plain `<span onClick={() => setOpen(true)}>{trigger}</span>` instead.

- [ ] **Step 3: Create `src/components/shared/danger-zone.tsx`**

```tsx
'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

type DangerZoneItemProps = {
  title: string;
  description: string;
  action: ReactNode;
};

function DangerZoneItem({ title, description, action }: DangerZoneItemProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {action}
    </div>
  );
}

type DangerZoneProps = {
  children: ReactNode;
};

export function DangerZone({ children }: DangerZoneProps) {
  const t = useTranslations('common.dangerZone');

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive">{t('title')}</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="space-y-4 pt-4">{children}</CardContent>
    </Card>
  );
}

export { DangerZoneItem };
```

- [ ] **Step 4: Verify**

Run: `pnpm type:check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/shared/hard-delete-confirmation.tsx src/components/shared/danger-zone.tsx messages/en.json
git commit -m "feat: add HardDeleteConfirmation and DangerZone shared components"
```

---

### Task A: Org Members Polish — Member Detail Hook

**Files:**

- Modify: `src/features/settings/members/hooks/use-members.ts`

**Context:** Add `useMember` hook for fetching a single member's detail. API endpoint: `GET /v1/organizations/members/{id}`. The proxy route `src/app/api/organizations/members/[id]/route.ts` already exists (currently only exports PATCH) — need to add GET export.

- [ ] **Step 1: Add GET to member detail proxy route**

In `src/app/api/organizations/members/[id]/route.ts`, add GET export:

```ts
import { proxyRequest } from '@/lib/proxy-request';

type Ctx = { params: Promise<{ id: string }> };

export const GET = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return proxyRequest(req, `/v1/organizations/members/${id}`);
};

export const PATCH = async (req: Request, ctx: Ctx) => {
  const { id } = await ctx.params;
  return proxyRequest(req, `/v1/organizations/members/${id}`);
};
```

- [ ] **Step 2: Add member detail query options and hook**

In `src/features/settings/members/hooks/use-members.ts`, add after `membersQueryOptions`:

```ts
export const memberQueryOptions = (
  orgId: string | null | undefined,
  userId: string
) =>
  queryOptions({
    queryKey: [...orgKeys.scope(orgId, 'members'), userId] as const,
    queryFn: () => apiClient.get<OrgMember>(`/organizations/members/${userId}`),
    enabled: !!orgId && !!userId,
  });

export function useMember(userId: string) {
  const { clerkOrgId } = useSession();
  return useQuery(memberQueryOptions(clerkOrgId, userId));
}
```

Note: Uses existing `OrgMember` type. If the API returns additional detail fields not in `OrgMember`, a separate `OrgMemberDetail` type may be needed — check `src/features/settings/members/types/index.ts` for the type shape.

- [ ] **Step 3: Verify**

Run: `pnpm type:check`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/app/api/organizations/members/\[id\]/route.ts src/features/settings/members/hooks/use-members.ts
git commit -m "feat: add useMember detail hook and GET proxy route"
```

---

### Task B: Admin Organizations Complete

**Depends on:** Task G (HardDeleteConfirmation, DangerZone)

**Files:**

- Create: `src/features/admin/validators/create-organization.schema.ts`
- Create: `src/features/admin/validators/update-organization.schema.ts`
- Modify: `src/features/admin/hooks/use-admin-organizations.ts`
- Modify: `src/features/admin/components/organization-detail.tsx`
- Modify: `messages/en.json`

**Context:** Admin org detail needs: (1) reactivate hook+UI, (2) hard delete hook+UI+DangerZone, (3) invite sheet UI (hook `useInviteUser` already exists), (4) Zod validation schemas for create/update forms.

- [x] **Step 1: Create `create-organization.schema.ts`**

Create `src/features/admin/validators/create-organization.schema.ts`:

```ts
import { z } from 'zod';

import {
  currencyCodeSchema,
  requiredString,
  slugSchema,
  timezoneSchema,
} from '@/lib/validators';

const subscriptionPlanEnum = z.enum(['starter', 'pro', 'enterprise']);

export const createOrganizationSchema = z.object({
  name: requiredString('Name').max(100),
  slug: slugSchema.max(100),
  currencyCode: currencyCodeSchema,
  timezone: timezoneSchema,
  subscriptionPlan: subscriptionPlanEnum,
});

export type CreateOrganizationFormValues = z.input<
  typeof createOrganizationSchema
>;

export const createOrganizationDefaults: CreateOrganizationFormValues = {
  name: '',
  slug: '',
  currencyCode: '',
  timezone: '',
  subscriptionPlan: 'starter',
};
```

- [x] **Step 2: Create `update-organization.schema.ts`**

Create `src/features/admin/validators/update-organization.schema.ts`:

```ts
import { z } from 'zod';

import {
  currencyCodeSchema,
  nullableEmail,
  nullablePhone,
  nullableString,
  requiredString,
  timezoneSchema,
} from '@/lib/validators';

export const updateOrganizationSchema = z.object({
  name: requiredString('Name').max(200),
  contactName: nullableString(),
  contactEmail: nullableEmail(),
  contactPhone: nullablePhone(),
  currencyCode: currencyCodeSchema,
  timezone: timezoneSchema,
});

export type UpdateOrganizationFormValues = z.input<
  typeof updateOrganizationSchema
>;
```

- [x] **Step 3: Add translation keys for admin org features**

Add to `messages/en.json` under `admin.organizations`:

```json
"reactivate": "Reactivate Organization",
"reactivateTitle": "Reactivate Organization",
"reactivateDescription": "This organization will be reactivated and members will regain access.",
"reactivateSuccess": "Organization reactivated.",
"reactivateError": "Failed to reactivate organization.",
"deleteOrganization": "Delete Organization",
"deleteWarningTitle": "Delete Organization?",
"deleteWarningDescription": "This action is permanent and cannot be undone. All organization data, members, and related records will be permanently deleted.",
"deleteConfirmTitle": "Confirm Permanent Deletion",
"deleteConfirmDescription": "Type \"{name}\" to confirm permanent deletion of this organization.",
"deleteButton": "Permanently Delete",
"deleteSuccess": "Organization permanently deleted.",
"deleteError": "Failed to delete organization.",
"dangerZoneTitle": "Delete this organization",
"dangerZoneDescription": "Permanently delete this organization and all its data. This action cannot be undone."
```

- [x] **Step 4: Add `useReactivateOrganization` and `useDeleteOrganization` hooks**

In `src/features/admin/hooks/use-admin-organizations.ts`, add:

```ts
export function useReactivateOrganization() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (publicId) =>
      apiClient.patch<void>(`/admin/organizations/${publicId}/reactivate`, {}),
    onSuccess: (_data, publicId) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(publicId),
      });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { publicId: string }>({
    mutationFn: ({ publicId }) =>
      apiClient.delete<void>(`/admin/organizations/${publicId}`, {
        'X-Confirm-Delete': publicId,
      }),
    onSuccess: (_data, { publicId }) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.all(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(publicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.members(publicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.invites(publicId),
      });
    },
  });
}
```

- [x] **Step 5: Update `organization-detail.tsx` — add reactivate button, DangerZone, and Zod forms**

This is a large component (~483 lines). The changes are:

**Info tab — Reactivate button:** Add a reactivate button next to the existing deactivate button, shown when `!org.isActive`:

```tsx
const reactivateOrg = useReactivateOrganization();

// In the header area, alongside deactivate:
{
  !org.isActive && (
    <Button
      variant="outline"
      onClick={() => {
        reactivateOrg.mutate(org.organizationId, {
          onSuccess: () => toast.success(t('reactivateSuccess')),
          onError: (error) =>
            toast.error(getErrorMessage(error, t('reactivateError'))),
        });
      }}
      disabled={reactivateOrg.isPending}
    >
      {t('reactivate')}
    </Button>
  );
}
```

**Info tab — DangerZone at bottom:**

```tsx
<DangerZone>
  <DangerZoneItem
    title={t('dangerZoneTitle')}
    description={t('dangerZoneDescription')}
    action={
      <HardDeleteConfirmation
        entityName={org.name}
        warningTitle={t('deleteWarningTitle')}
        warningDescription={t('deleteWarningDescription')}
        confirmTitle={t('deleteConfirmTitle')}
        confirmDescription={t('deleteConfirmDescription', { name: org.name })}
        confirmButtonLabel={t('deleteButton')}
        onConfirm={() => {
          deleteOrg.mutate(
            { publicId: org.organizationId },
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
    }
  />
</DangerZone>
```

Note: `tCommon` = `useTranslations('common')`. Import both `useTranslations('admin.organizations')` as `t` and `useTranslations('common')` as `tCommon`.

**Create form:** Add `validationSchema={createOrganizationSchema}` to the create org dialog form.

**Update form:** Add `validationSchema={updateOrganizationSchema}` to the edit org form.

**Invites tab — Invite sheet UI:** The `useInviteUser` hook already exists. Add a sheet with email input + role picker. This requires fetching available roles for the org. Use the existing org-scoped roles endpoint pattern or create an admin-specific one. For now, use a simple email + roleId form matching the `useInviteUser` mutation shape.

- [x] **Step 6: Verify**

Run: `pnpm type:check && pnpm lint`
Expected: PASS

- [x] **Step 7: Commit**

```bash
git add src/features/admin/validators/ src/features/admin/hooks/use-admin-organizations.ts src/features/admin/components/organization-detail.tsx messages/en.json
git commit -m "feat: admin org — reactivate, hard delete, invite sheet, Zod validation"
```

---

### Task C: Admin Users Complete

**Depends on:** Task G (HardDeleteConfirmation, DangerZone)

**Files:**

- Modify: `src/features/admin/hooks/use-admin-users.ts`
- Modify: `src/features/admin/components/user-detail.tsx`
- Modify: `messages/en.json`

**Context:** Admin user detail needs: (1) hard delete hook+UI+DangerZone, (2) fix cancel button translation key bug.

- [ ] **Step 1: Add translation keys**

Add to `messages/en.json` under `admin.users`:

```json
"deleteUser": "Delete User",
"deleteWarningTitle": "Delete User?",
"deleteWarningDescription": "This action is permanent and cannot be undone. The user and all their memberships will be permanently deleted.",
"deleteConfirmTitle": "Confirm Permanent Deletion",
"deleteConfirmDescription": "Type \"{name}\" to confirm permanent deletion of this user.",
"deleteButton": "Permanently Delete",
"deleteSuccess": "User permanently deleted.",
"deleteError": "Failed to delete user.",
"dangerZoneTitle": "Delete this user",
"dangerZoneDescription": "Permanently delete this user and all their data. This action cannot be undone.",
"cancel": "Cancel"
```

- [ ] **Step 2: Add `useDeleteUser` hook**

In `src/features/admin/hooks/use-admin-users.ts`, add:

```ts
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, { publicId: string }>({
    mutationFn: ({ publicId }) =>
      apiClient.delete<void>(`/admin/users/${publicId}`, {
        'X-Confirm-Delete': publicId,
      }),
    onSuccess: (_data, { publicId }) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.users.all(),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.users.detail(publicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.all(),
      });
    },
  });
}
```

- [ ] **Step 3: Update `user-detail.tsx`**

Add DangerZone section at bottom of user detail page:

```tsx
import { DangerZone, DangerZoneItem } from '@/components/shared/danger-zone';
import { HardDeleteConfirmation } from '@/components/shared/hard-delete-confirmation';

// In component:
const deleteUser = useDeleteUser();
const router = useRouter();

// At the bottom of the component, after organizations card:
<DangerZone>
  <DangerZoneItem
    title={t('dangerZoneTitle')}
    description={t('dangerZoneDescription')}
    action={
      <HardDeleteConfirmation
        entityName={`${user.firstName} ${user.lastName}`.trim() || user.email}
        warningTitle={t('deleteWarningTitle')}
        warningDescription={t('deleteWarningDescription')}
        confirmTitle={t('deleteConfirmTitle')}
        confirmDescription={t('deleteConfirmDescription', {
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
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
                toast.error(getErrorMessage(error, t('deleteError'))),
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
    }
  />
</DangerZone>;
```

**Fix cancel button bug:** On line 231, `t('allStatuses')` is used for the cancel button in the deactivate dialog. Change to `t('cancel')`.

- [ ] **Step 4: Verify**

Run: `pnpm type:check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/hooks/use-admin-users.ts src/features/admin/components/user-detail.tsx messages/en.json
git commit -m "feat: admin user — hard delete with DangerZone, fix cancel button translation"
```

---

### Task D: Admin Members Complete

**Files:**

- Modify: `src/features/admin/hooks/use-admin-members.ts`
- Modify: `src/features/admin/components/organization-detail.tsx`
- Modify: `messages/en.json`

**Context:** Admin members tab in org detail needs: (1) deactivate/reactivate hooks, (2) row actions dropdown (replacing trash icon), (3) member name links to `/admin/users/[userId]`. Note: no status column — API `AdminMemberResponse` has no status field.

- [ ] **Step 1: Add translation keys**

Add to `messages/en.json` under `admin.organizations` (members sub-section):

```json
"deactivateMember": "Deactivate Member",
"deactivateMemberTitle": "Deactivate Member",
"deactivateMemberDescription": "This member will lose access to this organization.",
"deactivateMemberSuccess": "Member deactivated.",
"deactivateMemberError": "Failed to deactivate member.",
"reactivateMember": "Reactivate Member",
"reactivateMemberTitle": "Reactivate Member",
"reactivateMemberDescription": "This member will regain access to this organization.",
"reactivateMemberSuccess": "Member reactivated.",
"reactivateMemberError": "Failed to reactivate member.",
"memberActions": "Actions",
"viewUser": "View User"
```

- [ ] **Step 2: Add deactivate/reactivate hooks**

In `src/features/admin/hooks/use-admin-members.ts`, add:

```ts
export function useAdminDeactivateMember(orgPublicId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (userPublicId) =>
      apiClient.patch<void>(
        `/admin/organizations/${orgPublicId}/members/${userPublicId}/deactivate`,
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.members(orgPublicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(orgPublicId),
      });
    },
  });
}

export function useAdminReactivateMember(orgPublicId: string) {
  const queryClient = useQueryClient();

  return useMutation<void, ApiError, string>({
    mutationFn: (userPublicId) =>
      apiClient.patch<void>(
        `/admin/organizations/${orgPublicId}/members/${userPublicId}/reactivate`,
        {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.members(orgPublicId),
      });
      queryClient.invalidateQueries({
        queryKey: adminKeys.organizations.detail(orgPublicId),
      });
    },
  });
}
```

- [ ] **Step 3: Update `OrgMembersTable` in `organization-detail.tsx`**

Replace the simple trash icon delete button with a `DropdownMenu` row actions:

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

// Each row gets:
<DropdownMenu>
  <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
    <MoreHorizontal className="h-4 w-4" />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem render={<Link href={`/admin/users/${member.userId}`} />}>
      {t('viewUser')}
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleDeactivate(member.userId)}>
      {t('deactivateMember')}
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => handleReactivate(member.userId)}>
      {t('reactivateMember')}
    </DropdownMenuItem>
    <DropdownMenuItem
      className="text-destructive"
      onClick={() => handleRemove(member.userId)}
    >
      {t('removeMember')}
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>;
```

**Member name links:** Make the member name column a `Link` to `/admin/users/[userId]`.

**Confirmation dialogs:** Add `ConfirmPopover` or `Dialog` for deactivate/reactivate actions (matching existing pattern in the component).

- [ ] **Step 4: Verify**

Run: `pnpm type:check`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/admin/hooks/use-admin-members.ts src/features/admin/components/organization-detail.tsx messages/en.json
git commit -m "feat: admin members — deactivate/reactivate hooks, row actions dropdown, user links"
```

---

### Task E: Admin Invites Fix

**Files:**

- Modify: `src/features/admin/components/invites-list.tsx`
- Modify: `src/features/admin/components/organization-detail.tsx`
- Modify: `messages/en.json`

**Context:** Admin invites need: (1) cancel method already fixed in Task 1.5, (2) cancel button on global invites list, (3) proper status badge colors, (4) fix cancel dialog button translation keys.

- [ ] **Step 1: Add/fix translation keys**

Ensure `messages/en.json` under `admin.invites` has:

```json
"confirmCancel": "Cancel Invitation",
"keepInvite": "Keep",
"cancelSuccess": "Invitation canceled.",
"cancelError": "Failed to cancel invitation."
```

- [ ] **Step 2: Fix status badge colors in `invites-list.tsx`**

Find the status badge rendering in the columns definition and apply semantic colors:

The Badge component (`src/components/ui/badge.tsx`) has these variants: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`. There are no `warning` or `success` variants. Use existing variants with semantic meaning:

```tsx
// Status column cell renderer:
const statusVariant = (
  status: string
): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status.toLowerCase()) {
    case 'pending':
      return 'outline'; // neutral/attention
    case 'accepted':
      return 'default'; // positive (primary color)
    case 'canceled':
      return 'destructive'; // negative
    case 'expired':
      return 'secondary'; // inactive/muted
    default:
      return 'secondary';
  }
};

// In column definition:
<Badge variant={statusVariant(invite.status)}>{invite.status}</Badge>;
```

- [ ] **Step 3: Fix cancel dialog button labels in `invites-list.tsx`**

Lines 247 and 256 both use `t('cancel')` — the dismiss button and confirm button have the same label. Change:

- Dismiss button: `t('keepInvite')`
- Confirm button: `t('confirmCancel')`

- [ ] **Step 4: Apply same status badge colors in `organization-detail.tsx` invites tab**

The `OrgInvitesTable` in `organization-detail.tsx` also renders status badges. Apply the same color mapping.

- [ ] **Step 5: Verify**

Run: `pnpm type:check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/admin/components/invites-list.tsx src/features/admin/components/organization-detail.tsx messages/en.json
git commit -m "feat: admin invites — status badge colors, fix cancel dialog labels"
```

---

### Task F: Admin Me

**Files:**

- Modify: `src/features/admin/types/admin.types.ts`
- Create: `src/features/admin/hooks/use-admin-me.ts`
- Modify: `src/features/admin/hooks/admin-query-keys.ts`
- Modify: `src/features/admin/components/admin-sidebar.tsx`
- Modify: `messages/en.json`

**Context:** Admin profile: fetch admin me from `GET /v1/admin/me`, display name/email/role in sidebar footer. Proxy route already created in Task 1.7.

- [ ] **Step 1: Add `AdminMe` type**

In `src/features/admin/types/admin.types.ts`, add at the end:

```ts
// ---------------------------------------------------------------------------
// Admin Me (profile)
// ---------------------------------------------------------------------------

export type AdminMe = {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  adminRole: string;
  assignedAt: ISODateTimeString;
};
```

- [ ] **Step 2: Add query key**

In `src/features/admin/hooks/admin-query-keys.ts`, add:

```ts
me: () => ['admin', 'me'] as const,
```

Add this as a direct property on `adminKeys` (sibling to `organizations`, `users`, `invites`).

- [ ] **Step 3: Create `use-admin-me.ts`**

Create `src/features/admin/hooks/use-admin-me.ts`:

```ts
import { queryOptions, useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import type { AdminMe } from '../types/admin.types';
import { adminKeys } from './admin-query-keys';

export const adminMeQueryOptions = () =>
  queryOptions({
    queryKey: adminKeys.me(),
    queryFn: () => apiClient.get<AdminMe>('/admin/me'),
  });

export function useAdminMe() {
  return useQuery(adminMeQueryOptions());
}
```

- [ ] **Step 4: Add translation keys**

Add to `messages/en.json` under `admin`:

```json
"me": {
  "role": "Role: {role}"
}
```

- [ ] **Step 5: Update `admin-sidebar.tsx` — add profile footer**

Add a `SidebarFooter` with admin profile:

```tsx
import { SidebarFooter } from '@/components/ui/sidebar';
import { Skeleton } from '@/components/ui/skeleton';

import { useAdminMe } from '../hooks/use-admin-me';

// Inside AdminSidebar, before </Sidebar>:
<SidebarFooter>
  <AdminProfile />
</SidebarFooter>;

// New sub-component (can be inline or extracted):
function AdminProfile() {
  const t = useTranslations('admin.me');
  const { data: me, isPending } = useAdminMe();

  if (isPending) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1 group-data-[collapsible=icon]:hidden">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    );
  }

  if (!me) return null;

  const displayName =
    [me.firstName, me.lastName].filter(Boolean).join(' ') || me.email;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <div className="bg-muted flex size-8 items-center justify-center rounded-full text-xs font-medium">
        {(me.firstName?.[0] ?? me.email[0]).toUpperCase()}
      </div>
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-medium">{displayName}</p>
        <p className="text-muted-foreground truncate text-xs">
          {t('role', { role: me.adminRole })}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Run: `pnpm type:check`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/admin/types/admin.types.ts src/features/admin/hooks/admin-query-keys.ts src/features/admin/hooks/use-admin-me.ts src/features/admin/components/admin-sidebar.tsx messages/en.json
git commit -m "feat: admin me — profile hook, type, sidebar footer display"
```

---

## Final Verification

After all tasks complete:

- [ ] Run `pnpm type:check` — zero errors
- [ ] Run `pnpm lint` — no new errors (pre-existing 11 errors / 22 warnings are acceptable)
- [ ] Run `pnpm build` — production build succeeds
- [ ] Manual check: `.env.local` updated (no `/v1` in `NEXT_PUBLIC_BASE_API_URL`)
