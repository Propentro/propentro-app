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
