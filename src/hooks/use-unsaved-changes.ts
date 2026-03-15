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
