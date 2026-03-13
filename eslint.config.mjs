import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'unused-imports': unusedImports,
    },
    rules: {
      // Restrict @clerk/nextjs imports in feature code.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@clerk/nextjs',
              message:
                'Do not import @clerk/nextjs in feature code. Use useSession() for auth state.',
            },
            {
              name: '@clerk/nextjs/server',
              message:
                'Do not import @clerk/nextjs/server in feature code. Use lib/auth.ts helpers.',
            },
          ],
        },
      ],
      // Disable base rules — unused-imports plugin handles these to avoid double-reporting
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',

      // Import sorting (auto-fixable on save)
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Unused imports removed on save, unused vars flagged
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Use `type` imports where possible (auto-fixable on save)
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],

      // Downgrade to warn — some libraries require any
      '@typescript-eslint/no-explicit-any': 'warn',

      // Prefer @ts-expect-error over @ts-ignore
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': 'allow-with-description', minimumDescriptionLength: 3 },
      ],
    },
  },
  // Allow @clerk/nextjs imports in infrastructure files (not feature code)
  {
    files: [
      'src/hooks/use-session.ts',
      'src/hooks/use-organizations.ts',
      'src/middleware.ts',
      'src/lib/auth.ts',
      'src/lib/proxy-request.ts',
      'src/components/providers/**',
      'src/components/layout/**',
      'src/features/select-workspace/**',
      'src/app/**/layout.tsx',
      'src/app/**/page.tsx',
      'src/app/api/**',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
]);

export default eslintConfig;
