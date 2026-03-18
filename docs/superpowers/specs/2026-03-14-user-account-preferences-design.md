# User Account & Preferences — Design Spec

## Overview

Replace the Clerk-hosted user profile modal with a custom Account section containing a read-only profile card and client-side user preferences (theme, language). This gives the app a consistent, professional look while keeping identity management where it belongs — in the identity provider.

## Why

- Clerk's `openUserProfile()` modal exposes consumer-oriented features (add email, add phone) that are irrelevant in a B2B context where users log in with company accounts or SSO.
- Profile editing in the app would require syncing changes to both Clerk and the backend — unnecessary complexity when the IdP already owns identity data.
- Theme and language controls currently live in the user menu dropdown with no dedicated settings page. Users expect a proper preferences area.

## Scope

### In Scope

- New Account section with two tabs: **Profile** and **Preferences**
- Read-only profile card displaying user info from Clerk/SSO
- Visual theme picker (Light / Dark / System) persisted in localStorage
- Language selector persisted in cookie/localStorage
- Simplified user menu dropdown (Account link + Sign Out only)
- Remove Clerk `openUserProfile()` modal usage
- Enable `system` theme support in `next-themes`
- Command palette entry for Account page
- Route path constants in `src/config/routes.ts`

### Out of Scope

- Profile editing (name, email, avatar) — owned by IdP
- Backend persistence of preferences — client-side only for now
- Notification preferences — future scope
- Active sessions / security tab — future scope
- New language translations (only English exists; i18n infrastructure is ready)
- Auth method field — requires backend support to determine SSO vs email; omit until available

## Architecture

### Routing

```
/[locale]/[orgSlug]/account/
  ├── layout.tsx          → PageHeader + AccountNav (tabs)
  ├── page.tsx            → Redirect to /account/profile
  ├── loading.tsx         → Skeleton UI
  ├── error.tsx           → Error boundary with i18n
  ├── profile/
  │   ├── page.tsx        → Server component (metadata: "Profile | Propentro")
  │   └── loading.tsx     → Skeleton UI
  └── preferences/
      ├── page.tsx        → Server component (metadata: "Preferences | Propentro")
      └── loading.tsx     → Skeleton UI
```

**No `not-found.tsx` needed** — `/account/` has no dynamic sub-segments. The parent `[orgSlug]/not-found.tsx` covers the case where the org slug is invalid.

**No `requirePermission()` gate** — unlike org-scoped settings pages, account pages are user-scoped. Any authenticated user can view their own profile and preferences. Clerk middleware ensures the user is authenticated; no resource-level permission check is needed.

### Route Path Constants

Add to `src/config/routes.ts`:

```typescript
// paths
account: {
  root: '/account',
  profile: '/account/profile',
  preferences: '/account/preferences',
},

// routes
account: {
  profile: (locale: string, orgSlug: string) =>
    `/${locale}/${orgSlug}${paths.account.profile}`,
  preferences: (locale: string, orgSlug: string) =>
    `/${locale}/${orgSlug}${paths.account.preferences}`,
},
```

### Feature Folder Structure

```
src/features/account/
  components/
    account-nav.tsx            → Horizontal tab navigation (Profile | Preferences)
  profile/
    components/
      profile-card.tsx         → Read-only user info card
  preferences/
    components/
      theme-picker.tsx         → Visual Light/Dark/System card selector
      language-selector.tsx    → Language dropdown with cookie persistence
```

### Navigation & Access

**User menu dropdown** (simplified):

- "Account" item → navigates to `/[orgSlug]/account/profile`
- "Sign Out" item → signs out via Clerk

**Removed from dropdown:**

- Theme toggle (moved to Preferences page)
- Language submenu (moved to Preferences page)
- "Account" Clerk modal trigger (replaced with page navigation)

**Sidebar:** Account is intentionally absent from the sidebar. The sidebar is for org-scoped navigation. Account is user-scoped and accessed only via the user menu dropdown and command palette.

**Command palette:**

- Add "Account" and "Preferences" entries to the navigation group

### Profile Tab

A single read-only card displaying user information sourced from the `useMe()` hook (which returns data from the `/me` backend endpoint).

**Card layout — Detailed card with grouped fields:**

```
┌─────────────────────────────────────────┐
│  [Avatar 72px]  Sufyan Taskin           │
│                 sufyan@propentro.com    │
│─────────────────────────────────────────│
│  Role            [Admin badge]          │
│  Organisation    Propentro Demo         │
│  Joined          14 March 2026          │
│                                         │
└─────────────────────────────────────────┘
```

**Data sources:**

- `firstName`, `lastName`, `email`, `imageUrl` → `useMe()` (`CurrentUser` type already includes `imageUrl?: string`, injected server-side from Clerk in the `/api/me` route handler)
- `role` → `useMe()` → displayed as badge(s)
- `organization.name` → `useMe()`
- Joined date → requires `createdAt` from backend; if not available in current `/me` response, omit until backend supports it

**Omitted fields:**

- Auth method (SSO vs email) — determining this requires Clerk API calls or backend support. Omit from v1; can be added as a future enhancement when backend exposes this data.

**Display rules:**

- Avatar shows initials (first letter of first + last name) when no `imageUrl`
- Avatar uses a gradient background for the initials fallback
- Role displayed as a styled badge
- All dates formatted via `useFormatter()` from `next-intl`
- No edit buttons, no links to external profile editors

### Preferences Tab

Two separate cards: Theme and Language.

#### Theme Picker

**Visual card selector** with three options:

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ ░░░░░░░░ │  │ ████████ │  │ ░░░│████ │
│ ░░░░░░   │  │ ██████   │  │ ░░░│███  │
│          │  │          │  │          │
│  Light   │  │  Dark ✓  │  │  System  │
└──────────┘  └──────────┘  └──────────┘
```

- Each card shows a miniature UI preview (light surface vs dark surface)
- Selected card has a highlighted border + checkmark
- Clicking a card immediately applies the theme (no save button)
- Uses `next-themes` `setTheme()` — persisted automatically in localStorage
- Enable `enableSystem: true` in `ThemeProvider` configuration (currently disabled)

#### Language Selector

- Standard dropdown/select component
- Shows current language
- Currently only "English" available — dropdown is functional but single-option
- On selection: set a `NEXT_LOCALE` cookie + redirect to the selected locale path
- Cookie is read by `next-intl` middleware to determine preferred locale

### User Menu Dropdown Changes

**Current state (`user-menu.tsx`):**

```
Avatar + Name + Email
─────────────────────
Account        → openUserProfile()
Theme          → toggle submenu
Language       → language submenu
─────────────────────
Sign Out
```

**New state:**

```
Avatar + Name + Email
─────────────────────
Account        → navigate to /[orgSlug]/account/profile
─────────────────────
Sign Out
```

**Implementation notes:**

- `user-menu.tsx` lives in `src/components/layout/` (not feature code), so Clerk imports are permitted
- Replace `openUserProfile()` call with `router.push()` to account page
- `signOut()` still comes from Clerk hooks — this is fine in layout code
- Remove `useClerk()` if only `openUserProfile()` was used from it; if `signOut()` also came from `useClerk()`, keep the import but remove the `openUserProfile()` call. Alternatively, use `useAuth()` for `signOut` if available.
- Remove theme toggle section
- Remove language submenu
- Reuse existing `layout.profile.account` translation key for the menu item label

## Data Flow

### Theme

```
User clicks theme card
  → theme-picker calls setTheme('light' | 'dark' | 'system')
  → next-themes updates localStorage key "theme"
  → next-themes applies class to <html>
  → UI re-renders with new theme
```

No API calls. No backend. Instant.

### Language

```
User selects language from dropdown
  → language-selector sets NEXT_LOCALE cookie
  → language-selector calls router.replace() to new locale path
  → next-intl middleware reads cookie on next request
  → Page renders in selected locale
```

No API calls. Cookie persists across sessions.

## Error Handling

- **Profile data not loaded:** Show skeleton (handled by `loading.tsx` + React Suspense)
- **Error boundary:** `error.tsx` catches unexpected errors, shows i18n Card with "Try again" button (uses `useTranslations('errorPages')`, consistent with other error boundaries)
- **Theme fails to apply:** `next-themes` handles gracefully; worst case user sees default theme
- **Language cookie not set:** Falls back to browser `Accept-Language` header (existing behaviour)

## Testing Considerations

- Profile card renders correct data from `useMe()`
- Theme picker applies theme and persists to localStorage
- Language selector sets cookie and redirects
- User menu no longer opens Clerk modal
- Command palette includes Account entries
- All text uses i18n keys (no hardcoded strings)
- Responsive: cards stack properly on mobile

## i18n Keys

New namespace `account` in `messages/en.json`:

```
account.tabs.profile
account.tabs.preferences
account.profile.title
account.profile.description
account.profile.role
account.profile.organization          ← key: American English
account.profile.joined
account.preferences.title
account.preferences.description
account.preferences.theme.title
account.preferences.theme.description
account.preferences.theme.light
account.preferences.theme.dark
account.preferences.theme.system
account.preferences.language.title
account.preferences.language.description
```

Page title keys (added to existing `pages` namespace):

```
pages.account                         → "Account"
pages.accountProfile                  → "Profile"
pages.accountPreferences              → "Preferences"
```

Existing key reused:

```
layout.profile.account                → "Account" (user menu dropdown item — already exists)
```

## Acceptance Criteria

- [ ] Account page accessible at `/[orgSlug]/account/profile`
- [ ] Route path constants added to `src/config/routes.ts`
- [ ] Profile tab shows read-only user info in detailed card layout
- [ ] Preferences tab shows visual theme picker (Light/Dark/System)
- [ ] Preferences tab shows language dropdown
- [ ] Theme selection applies immediately and persists across page loads
- [ ] Language selection persists via cookie across sessions
- [ ] User menu dropdown simplified to Account link + Sign Out
- [ ] Clerk `openUserProfile()` modal completely removed
- [ ] System theme option enabled in ThemeProvider
- [ ] Command palette has Account and Preferences entries
- [ ] All user-facing text uses i18n translation keys
- [ ] Page metadata exports on all account pages
- [ ] Error boundary (`error.tsx`) with i18n text
- [ ] Loading skeletons for all route segments
- [ ] Responsive layout works on mobile
- [ ] Account intentionally absent from sidebar
- [ ] No new backend endpoints required
