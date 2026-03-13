import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

import { env } from '@/env.mjs';
import type { CurrentUser, Permission } from '@/types/user.types';

// ---------------------------------------------------------------------------
// getMe — server-only, called from Server Components and layouts.
//
// Flow:
//   Server Component → getMe() → .NET API /me  (server-to-server, never in browser)
//
// Caching:
//   Next.js Data Cache — revalidated every 5 minutes.
//   Same user navigating across pages within 5 min = 1 backend call.
//   On role/permission change → call revalidateUserCache() to bust it.
// ---------------------------------------------------------------------------

/**
 * Fetches the current user from the backend.
 *
 * - Must be called from Server Components or Server Actions only.
 * - Redirects to sign-in if not authenticated.
 * - Returns null if the user record doesn't exist in DB yet
 *   (e.g. Clerk webhook hasn't fired yet — rare race condition).
 */
export async function getMe(): Promise<CurrentUser | null> {
  const { getToken, userId } = await auth();

  // Not logged in → let middleware handle it, but guard here too
  if (!userId) return null;

  const token = await getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_BASE_API_URL}/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      // Next.js Data Cache — 5 minute TTL
      // This is NOT per page-refresh; it's server-level cache.
      // All requests within 5 min from any user session share this cache.
      next: { revalidate: 300, tags: ['user-me'] },
    });

    if (res.status === 404) {
      // User doesn't exist in our DB yet (webhook race)
      return null;
    }

    if (!res.ok) {
      console.error('[getMe] Backend error:', res.status, await res.text());
      return null;
    }

    return res.json() as Promise<CurrentUser>;
  } catch (err) {
    console.error('[getMe] Fetch failed:', err);
    return null;
  }
}

/**
 * Like getMe() but throws/redirects if user is not found.
 * Use in protected layouts where null user is unacceptable.
 */
export async function getMeOrRedirect(locale: string): Promise<CurrentUser> {
  const user = await getMe();

  if (!user) {
    redirect(`/${locale}/sign-in`);
  }

  return user;
}

// ---------------------------------------------------------------------------
// Permission helpers — server-side only
// ---------------------------------------------------------------------------

/**
 * Returns true if the user has the given permission.
 *
 * @example
 * const canRead = await hasPermission('properties:read');
 */
export async function hasPermission(permission: Permission): Promise<boolean> {
  const user = await getMe();
  if (!user) return false;
  return user.permissions.includes(permission);
}

/**
 * Throws a 403-style redirect if the user lacks the given permission.
 * Use at the top of Server Component pages.
 *
 * @example
 * export default async function FinancePage() {
 *   await requirePermission('finance:read', locale);
 *   // ...
 * }
 */
export async function requirePermission(
  permission: Permission,
  locale: string
): Promise<void> {
  const allowed = await hasPermission(permission);
  if (!allowed) {
    redirect(`/${locale}/access-denied`);
  }
}

// ---------------------------------------------------------------------------
// Cache invalidation
// ---------------------------------------------------------------------------

/**
 * Invalidates the cached /me response for the current request.
 */
export async function revalidateUserCache(): Promise<void> {
  // Dynamic import to avoid 'next/cache' being bundled client-side
  const { revalidateTag } = await import('next/cache');
  revalidateTag('user-me', 'default');
}
