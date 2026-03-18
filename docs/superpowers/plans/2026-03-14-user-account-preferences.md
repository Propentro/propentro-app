# User Account & Preferences Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Clerk's user profile modal with a custom Account section (Profile + Preferences tabs) and simplify the user menu dropdown.

**Architecture:** New `/[orgSlug]/account/` route group with two tabs — a read-only profile card sourced from `useMe()`, and a preferences page with visual theme picker (Light/Dark/System) and language selector. No backend changes; theme uses `next-themes` localStorage, language uses a `NEXT_LOCALE` cookie.

**Tech Stack:** Next.js 16 App Router, React 19, shadcn/ui v4 (Base UI), next-themes, next-intl, Tailwind CSS 4, TypeScript

**Design spec:** `docs/superpowers/specs/2026-03-14-user-account-preferences-design.md`

---

## Chunk 1: Infrastructure (routes, i18n, config)

### Task 1: Add route path constants

**Files:**

- Modify: `src/config/routes.ts`

- [ ] **Step 1: Add account paths and route builders**

Add `account` entries to both `paths` and `routes` objects in `src/config/routes.ts`:

```typescript
// Inside paths, after settings:
account: {
  root: '/account',
  profile: '/account/profile',
  preferences: '/account/preferences',
},
```

```typescript
// Inside routes, after settings:
account: {
  profile: (locale: string, orgSlug: string) =>
    `/${locale}/${orgSlug}${paths.account.profile}`,
  preferences: (locale: string, orgSlug: string) =>
    `/${locale}/${orgSlug}${paths.account.preferences}`,
},
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm type:check`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/config/routes.ts
git commit -m "feat(account): add route path constants for account pages"
```

---

### Task 2: Add i18n translation keys

**Files:**

- Modify: `messages/en.json`

- [ ] **Step 1: Add page title keys**

Add to the `pages` object in `messages/en.json`:

```json
"account": "Account",
"accountProfile": "Profile",
"accountPreferences": "Preferences"
```

- [ ] **Step 2: Add account namespace**

Add new top-level `account` namespace after the `settings` namespace:

```json
"account": {
  "tabs": {
    "profile": "Profile",
    "preferences": "Preferences"
  },
  "profile": {
    "title": "Profile",
    "description": "Your account information. This data is managed by your identity provider.",
    "role": "Role",
    "organization": "Organisation",
    "joined": "Joined"
  },
  "preferences": {
    "title": "Preferences",
    "description": "Customise how Propentro works for you.",
    "theme": {
      "title": "Theme",
      "description": "Choose how Propentro looks for you.",
      "light": "Light",
      "dark": "Dark",
      "system": "System"
    },
    "language": {
      "title": "Language",
      "description": "Select your preferred language."
    }
  }
}
```

- [ ] **Step 3: Add error page keys for account**

Add to `errorPages` in `messages/en.json`:

```json
"accountError": {
  "title": "Account Error",
  "description": "Failed to load this page. Please try again.",
  "tryAgain": "Try again"
}
```

- [ ] **Step 4: Verify no JSON syntax errors**

Run: `node -e "require('./messages/en.json')"`
Expected: No output (valid JSON)

- [ ] **Step 5: Commit**

```bash
git add messages/en.json
git commit -m "feat(account): add i18n translation keys for account pages"
```

---

### Task 3: Enable system theme in ThemeProvider

**Files:**

- Modify: `src/components/providers/theme-provider.tsx`

- [ ] **Step 1: Enable system theme**

Change `enableSystem={false}` to `enableSystem={true}` in `src/components/providers/theme-provider.tsx`:

```typescript
'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';

export function ThemeProvider({ children }: React.PropsWithChildren) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={true}
    >
      {children}
    </NextThemeProvider>
  );
}
```

- [ ] **Step 2: Verify dev server works**

Run: `pnpm dev` — no errors on load.

- [ ] **Step 3: Commit**

```bash
git add src/components/providers/theme-provider.tsx
git commit -m "feat(account): enable system theme support in ThemeProvider"
```

---

## Chunk 2: Account route group (layout, loading, error, redirect)

### Task 4: Create account layout with tab navigation

**Files:**

- Create: `src/features/account/components/account-nav.tsx`
- Create: `src/app/[locale]/[orgSlug]/account/layout.tsx`

- [ ] **Step 1: Create AccountNav component**

Create `src/features/account/components/account-nav.tsx`. Follow the exact same pattern as `src/features/settings/components/settings-nav.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';

import { paths } from '@/config/routes';
import { Link, usePathname } from '@/i18n/routing';
import { cn } from '@/lib/utils';

const accountItems = [
  {
    titleKey: 'accountProfile' as const,
    href: paths.account.profile,
  },
  {
    titleKey: 'accountPreferences' as const,
    href: paths.account.preferences,
  },
];

export function AccountNav({ orgSlug }: { orgSlug: string }) {
  const t = useTranslations('pages');
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b">
      {accountItems.map((item) => {
        const fullHref = `/${orgSlug}${item.href}`;
        const isActive = pathname.endsWith(item.href);

        return (
          <Link
            key={item.titleKey}
            href={fullHref}
            className={cn(
              'text-muted-foreground hover:text-foreground relative px-3 pt-1.5 pb-2.5 text-sm font-medium transition-colors',
              isActive &&
                'text-foreground after:bg-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5'
            )}
          >
            {t(item.titleKey)}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 2: Create account layout**

Create `src/app/[locale]/[orgSlug]/account/layout.tsx`. Follow the exact same pattern as `src/app/[locale]/[orgSlug]/settings/layout.tsx`:

```typescript
import { getTranslations } from 'next-intl/server';

import { PageHeader } from '@/components/page-header';
import { AccountNav } from '@/features/account/components/account-nav';

interface Props {
  params: Promise<{ orgSlug: string }>;
  children: React.ReactNode;
}

export default async function AccountLayout({ params, children }: Props) {
  const { orgSlug } = await params;
  const t = await getTranslations('pages');

  return (
    <>
      <PageHeader title={t('account')} />
      <AccountNav orgSlug={orgSlug} />
      <div className="mt-6">{children}</div>
    </>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `pnpm type:check`
Expected: No new errors

- [ ] **Step 4: Commit**

```bash
git add src/features/account/components/account-nav.tsx src/app/[locale]/[orgSlug]/account/layout.tsx
git commit -m "feat(account): add account layout with tab navigation"
```

---

### Task 5: Create account loading, error, and redirect pages

**Files:**

- Create: `src/app/[locale]/[orgSlug]/account/loading.tsx`
- Create: `src/app/[locale]/[orgSlug]/account/error.tsx`
- Create: `src/app/[locale]/[orgSlug]/account/page.tsx`
- Create: `src/app/[locale]/[orgSlug]/account/profile/loading.tsx`
- Create: `src/app/[locale]/[orgSlug]/account/preferences/loading.tsx`

- [ ] **Step 1: Create account loading skeleton**

Create `src/app/[locale]/[orgSlug]/account/loading.tsx`. Follow the pattern from `src/app/[locale]/[orgSlug]/settings/loading.tsx`:

```typescript
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function AccountLoading() {
  return (
    <div className="mb-6 space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-56" />
      </div>
      <Separator />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full max-w-lg" />
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create account error boundary**

Create `src/app/[locale]/[orgSlug]/account/error.tsx`. Follow the pattern from `src/app/[locale]/[orgSlug]/settings/error.tsx`:

```typescript
'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AccountError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errorPages.accountError');

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="max-w-md text-center">
        <CardContent className="space-y-4 pt-6">
          <div className="flex justify-center">
            <AlertCircle className="text-muted-foreground size-10" />
          </div>
          <h2 className="text-xl font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('description')}</p>
          <Button onClick={reset}>{t('tryAgain')}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Create account index redirect**

Create `src/app/[locale]/[orgSlug]/account/page.tsx`. This redirects `/account` to `/account/profile`:

```typescript
import type { Metadata } from 'next';

import { redirect } from '@/i18n/routing';

export const metadata: Metadata = { title: 'Account | Propentro' };

interface Props {
  params: Promise<{ locale: string; orgSlug: string }>;
}

export default async function AccountPage({ params }: Props) {
  const { locale, orgSlug } = await params;
  redirect({ href: `/${orgSlug}/account/profile`, locale });
}
```

- [ ] **Step 4: Create profile loading skeleton**

Create `src/app/[locale]/[orgSlug]/account/profile/loading.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileLoading() {
  return (
    <div className="max-w-xl space-y-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-4 w-72" />
      <div className="rounded-lg border p-6">
        <div className="flex gap-4">
          <Skeleton className="size-[72px] rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create preferences loading skeleton**

Create `src/app/[locale]/[orgSlug]/account/preferences/loading.tsx`:

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export default function PreferencesLoading() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="mt-1 h-4 w-64" />
      </div>
      <div className="rounded-lg border p-6">
        <Skeleton className="h-5 w-16 mb-4" />
        <div className="flex gap-3">
          <Skeleton className="h-24 flex-1 rounded-lg" />
          <Skeleton className="h-24 flex-1 rounded-lg" />
          <Skeleton className="h-24 flex-1 rounded-lg" />
        </div>
      </div>
      <div className="rounded-lg border p-6">
        <Skeleton className="h-5 w-20 mb-4" />
        <Skeleton className="h-10 w-48" />
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Verify TypeScript compiles**

Run: `pnpm type:check`
Expected: No new errors

- [ ] **Step 7: Commit**

```bash
git add src/app/[locale]/[orgSlug]/account/
git commit -m "feat(account): add loading, error, and redirect pages for account routes"
```

---

## Chunk 3: Profile tab

### Task 6: Build profile card component

**Files:**

- Create: `src/features/account/profile/components/profile-card.tsx`

- [ ] **Step 1: Create the profile card**

Create `src/features/account/profile/components/profile-card.tsx`:

```typescript
'use client';

import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMe } from '@/hooks/use-me';

export function ProfileCard() {
  const me = useMe();
  const t = useTranslations('account.profile');

  const fullName = `${me.firstName} ${me.lastName}`;
  const initials = `${me.firstName[0]}${me.lastName[0]}`.toUpperCase();

  return (
    <Card className="max-w-xl">
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-[72px]">
            <AvatarImage src={me.imageUrl} alt={fullName} />
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-xl font-semibold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-lg font-semibold">{fullName}</h3>
            <p className="text-muted-foreground text-sm">{me.email}</p>
          </div>
        </div>

        <Separator className="my-5" />

        <dl className="space-y-4">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground text-sm">{t('role')}</dt>
            <dd className="flex gap-1.5">
              {me.role.map((r) => (
                <Badge key={r} variant="secondary">
                  {r}
                </Badge>
              ))}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground text-sm">
              {t('organization')}
            </dt>
            <dd className="text-sm">{me.organization.name}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
```

Note: The `joined` field is omitted because `CurrentUser` does not currently have a `createdAt` field. It can be added when the backend supports it.

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm type:check`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/features/account/profile/components/profile-card.tsx
git commit -m "feat(account): add read-only profile card component"
```

---

### Task 7: Create profile page

**Files:**

- Create: `src/app/[locale]/[orgSlug]/account/profile/page.tsx`

- [ ] **Step 1: Create the profile page**

Create `src/app/[locale]/[orgSlug]/account/profile/page.tsx`. No `requirePermission()` — account pages are user-scoped, not org-scoped:

```typescript
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { ProfileCard } from '@/features/account/profile/components/profile-card';

export const metadata: Metadata = { title: 'Profile | Propentro' };

export default async function ProfilePage() {
  const t = await getTranslations('account.profile');

  return (
    <div>
      <h2 className="text-lg font-semibold">{t('title')}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{t('description')}</p>
      <div className="mt-6">
        <ProfileCard />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Run: `pnpm dev` — navigate to `/en/{orgSlug}/account/profile`
Expected: Profile card with avatar, name, email, role badges, org name

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/[orgSlug]/account/profile/page.tsx
git commit -m "feat(account): add profile page with read-only user card"
```

---

## Chunk 4: Preferences tab

### Task 8: Build theme picker component

**Files:**

- Create: `src/features/account/preferences/components/theme-picker.tsx`

- [ ] **Step 1: Create the theme picker**

Create `src/features/account/preferences/components/theme-picker.tsx`:

```typescript
'use client';

import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

import { cn } from '@/lib/utils';

const themes = [
  {
    value: 'light' as const,
    icon: Sun,
    previewBg: 'bg-gray-100',
    previewBar: 'bg-white',
  },
  {
    value: 'dark' as const,
    icon: Moon,
    previewBg: 'bg-gray-900',
    previewBar: 'bg-gray-800',
  },
  {
    value: 'system' as const,
    icon: Monitor,
    previewBg: 'bg-gradient-to-r from-gray-100 from-50% to-gray-900 to-50%',
    previewBar:
      'bg-gradient-to-r from-white from-50% to-gray-800 to-50%',
  },
];

export function ThemePicker() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations('account.preferences.theme');

  return (
    <div className="grid grid-cols-3 gap-3">
      {themes.map(({ value, icon: Icon, previewBg, previewBar }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              'flex-1 cursor-pointer overflow-hidden rounded-lg border-2 transition-colors',
              isActive
                ? 'border-primary ring-primary/20 ring-2'
                : 'border-border hover:border-muted-foreground/30'
            )}
          >
            <div className={cn('p-3 space-y-1.5', previewBg)}>
              <div className={cn('h-1.5 w-full rounded', previewBar)} />
              <div className={cn('h-1.5 w-3/5 rounded', previewBar)} />
            </div>
            <div className="flex items-center justify-center gap-1.5 p-2">
              {isActive ? (
                <Check className="text-primary size-3.5" />
              ) : (
                <Icon className="text-muted-foreground size-3.5" />
              )}
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {t(value)}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm type:check`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/features/account/preferences/components/theme-picker.tsx
git commit -m "feat(account): add visual theme picker component"
```

---

### Task 9: Build language selector component

**Files:**

- Create: `src/features/account/preferences/components/language-selector.tsx`

- [ ] **Step 1: Create the language selector**

Create `src/features/account/preferences/components/language-selector.tsx`:

```typescript
'use client';

import { useLocale, useTranslations } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { routing } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/routing';

export function LanguageSelector() {
  const t = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function handleLocaleChange(newLocale: string) {
    // Set cookie for middleware to read on future requests
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {routing.locales.map((loc) => (
          <SelectItem key={loc} value={loc}>
            {t(loc)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `pnpm type:check`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/features/account/preferences/components/language-selector.tsx
git commit -m "feat(account): add language selector with cookie persistence"
```

---

### Task 10: Create preferences page

**Files:**

- Create: `src/app/[locale]/[orgSlug]/account/preferences/page.tsx`

- [ ] **Step 1: Create the preferences page**

Create `src/app/[locale]/[orgSlug]/account/preferences/page.tsx`:

```typescript
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

import { LanguageSelector } from '@/features/account/preferences/components/language-selector';
import { ThemePicker } from '@/features/account/preferences/components/theme-picker';

export const metadata: Metadata = { title: 'Preferences | Propentro' };

export default async function PreferencesPage() {
  const t = await getTranslations('account.preferences');

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('title')}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t('description')}
        </p>
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="text-sm font-semibold">{t('theme.title')}</h3>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          {t('theme.description')}
        </p>
        <ThemePicker />
      </div>

      <div className="rounded-lg border p-6">
        <h3 className="text-sm font-semibold">{t('language.title')}</h3>
        <p className="text-muted-foreground mt-1 mb-4 text-sm">
          {t('language.description')}
        </p>
        <LanguageSelector />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Run: `pnpm dev` — navigate to `/en/{orgSlug}/account/preferences`
Expected: Theme picker with 3 cards (Light/Dark/System), Language dropdown with "English"

- [ ] **Step 3: Commit**

```bash
git add src/app/[locale]/[orgSlug]/account/preferences/page.tsx
git commit -m "feat(account): add preferences page with theme picker and language selector"
```

---

## Chunk 5: User menu simplification and command palette

### Task 11: Simplify user menu dropdown

**Files:**

- Modify: `src/components/layout/user-menu.tsx`

- [ ] **Step 1: Rewrite user menu**

Replace the entire content of `src/components/layout/user-menu.tsx` with:

```typescript
'use client';

import { useClerk } from '@clerk/nextjs';
import { LogOut, UserCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { paths } from '@/config/routes';
import { useMe } from '@/hooks/use-me';
import { usePathname, useRouter } from '@/i18n/routing';

export function UserMenu() {
  const me = useMe();
  const { signOut } = useClerk();
  const t = useTranslations('layout.profile');
  const router = useRouter();
  const pathname = usePathname();

  const fullName = `${me.firstName} ${me.lastName}`;
  const initials = `${me.firstName[0]}${me.lastName[0]}`.toUpperCase();
  const orgSlug = pathname.split('/')[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="rounded-full" />}
      >
        <Avatar className="size-7">
          <AvatarImage src={me.imageUrl} alt={fullName} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 rounded-lg">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={me.imageUrl} alt={fullName} />
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{fullName}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {me.email}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() =>
              router.push(`/${orgSlug}${paths.account.profile}`)
            }
          >
            <UserCircle />
            {t('account')}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut />
          {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**What changed:**

- Removed `openUserProfile` from `useClerk()` — only `signOut` remains
- Removed `useTheme` import and theme toggle
- Removed `DropdownMenuSub`, `DropdownMenuSubContent`, `DropdownMenuSubTrigger` imports
- Removed `BadgeCheck`, `Check`, `Globe`, `Moon`, `Sun` icons — replaced with `UserCircle`
- Removed `tHeader` and `tLang` translation hooks
- Added `useRouter`, `usePathname` from `@/i18n/routing` and `paths` from `@/config/routes`
- "Account" item now navigates to `/[orgSlug]/account/profile` instead of opening Clerk modal

- [ ] **Step 2: Remove orphaned translation keys**

In `messages/en.json`, remove the keys that are no longer used after the user menu simplification:

- Remove `layout.header.toggleTheme` (`"toggleTheme": "Toggle theme"`)
- Remove `layout.header.language` (`"language": "Language"`)

These keys were only used in `user-menu.tsx` for the theme toggle and language submenu, which are now removed.

- [ ] **Step 3: Verify the page renders**

Run: `pnpm dev` — click the user avatar in the header.
Expected: Simplified dropdown with avatar header, "Account" link, separator, "Log Out"

- [ ] **Step 4: Run linter**

Run: `pnpm lint`
Expected: No new errors from this file

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/user-menu.tsx messages/en.json
git commit -m "refactor(layout): simplify user menu — remove theme/language, link to account page"
```

---

### Task 12: Add account entries to command palette

**Files:**

- Modify: `src/components/layout/command-palette.tsx`

- [ ] **Step 1: Add account group to command palette**

In `src/components/layout/command-palette.tsx`, add the account entries. Add the `UserCircle` and `Settings2` imports to the lucide-react import line:

```typescript
import {
  Building2,
  LayoutDashboard,
  Settings2,
  Shield,
  UserCircle,
  Users,
} from 'lucide-react';
```

Add a new `CommandGroup` after the existing "Settings" group, before `</CommandList>`:

```typescript
<CommandGroup heading={t('account')}>
  <CommandItem onSelect={() => navigate(paths.account.profile)}>
    <UserCircle />
    {tPages('accountProfile')}
  </CommandItem>
  <CommandItem onSelect={() => navigate(paths.account.preferences)}>
    <Settings2 />
    {tPages('accountPreferences')}
  </CommandItem>
</CommandGroup>
```

Also add the `account` key to the search translations. Add to `layout.search` in `messages/en.json`:

```json
"account": "Account"
```

- [ ] **Step 2: Verify command palette works**

Run: `pnpm dev` — press `Cmd+K`, type "Profile" or "Preferences"
Expected: Account entries appear and navigate correctly

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/command-palette.tsx messages/en.json
git commit -m "feat(account): add account entries to command palette"
```

---

## Chunk 6: Cleanup and verification

### Task 13: Run full verification

**Files:** None (verification only)

- [ ] **Step 1: TypeScript check**

Run: `pnpm type:check`
Expected: No new errors

- [ ] **Step 2: Lint check**

Run: `pnpm lint`
Expected: No new errors from account files

- [ ] **Step 3: Build check**

Run: `pnpm build`
Expected: Build succeeds

- [ ] **Step 4: Manual smoke test**

Verify in the browser:

1. Navigate to any org page → click user avatar → see simplified dropdown (Account + Log Out)
2. Click "Account" → redirected to `/[orgSlug]/account/profile`
3. Profile tab shows avatar, name, email, role badge, org name (all read-only)
4. Click "Preferences" tab → see theme picker and language dropdown
5. Click Dark theme card → theme changes immediately, persists on refresh
6. Click System theme card → follows OS preference
7. Click Light theme card → back to light
8. Press `Cmd+K` → type "Profile" → account entries appear
9. Verify no Clerk modal opens anywhere
10. Resize to mobile width — verify profile card and theme picker cards stack properly

- [ ] **Step 5: Verify unused imports removed**

Run: `pnpm lint:fix` to auto-remove any unused imports introduced during refactoring.

- [ ] **Step 6: Final commit if any lint fixes**

```bash
git add -A
git commit -m "chore: lint fixes for account feature"
```
