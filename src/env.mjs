import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /*
   * Server-side environment variables, not available on the client.
   */
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']),
    CLERK_SECRET_KEY: z.string().min(1),
  },
  /*
   * Environment variables available on the client (and server).
   * Must be prefixed with NEXT_PUBLIC_.
   */
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().optional().default('/sign-in'),
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z
      .string()
      .optional()
      .default('/select-workspace'),
    NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL: z
      .string()
      .optional()
      .default('/select-workspace'),
    NEXT_PUBLIC_BASE_API_URL: z.string().url(),
  },
  runtimeEnv: process.env,
});
