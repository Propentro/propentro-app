import { auth } from '@clerk/nextjs/server';

import { env } from '@/env.mjs';

const NO_BODY_METHODS = new Set(['GET', 'HEAD', 'DELETE']);

/**
 * Proxies an authenticated Next.js route handler request to the real backend.
 *
 * Automatically handles:
 * - Clerk token verification         → 401 if missing
 * - Active org enforcement (B2B)     → 403 if no org selected
 * - Query param forwarding
 * - Request body forwarding          (POST / PUT / PATCH)
 * - Status code passthrough
 * - Backend unavailable              → 502
 */
export async function proxyRequest(
  request: Request,
  path: string
): Promise<Response> {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const { getToken, orgId } = await auth();

  const token = await getToken();
  if (!token) {
    return Response.json(
      { status: 401, title: 'Unauthorized' },
      { status: 401 }
    );
  }

  if (!orgId) {
    return Response.json(
      {
        status: 403,
        title: 'No active organization. Please select a workspace first.',
      },
      { status: 403 }
    );
  }

  // ── Build backend URL (forward query params) ─────────────────────────────
  const incomingUrl = new URL(request.url);
  const backendUrl = new URL(`${env.NEXT_PUBLIC_BASE_API_URL}${path}`);

  incomingUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.set(key, value);
  });

  // ── Forward request ───────────────────────────────────────────────────────
  const method = request.method;

  const hasBody = !NO_BODY_METHODS.has(method);

  try {
    const res = await fetch(backendUrl.toString(), {
      method,
      headers: {
        ...(hasBody && { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
      },
      body: hasBody ? await request.text() : undefined,
    });

    if (res.status === 204) {
      return new Response(null, { status: 204 });
    }

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch {
    return Response.json(
      { status: 502, title: 'Backend unavailable' },
      { status: 502 }
    );
  }
}
