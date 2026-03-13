'use client';

import { useEffect } from 'react';

type HotkeyHandler = () => void;

/**
 * Registers a keyboard shortcut. Supports single keys and two-key sequences (e.g. 'g d').
 *
 * - Ignores events when focus is on input/textarea/select
 * - Supports modifier keys: ctrl, meta, shift, alt (e.g. 'ctrl+k')
 * - Supports sequences: 'g d' means press 'g' then 'd'
 */
export function useHotkeys(key: string, handler: HotkeyHandler) {
  useEffect(() => {
    const parts = key.split(' ');
    let pendingPrefix: string | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function isInputFocused() {
      const el = document.activeElement;
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        (el as HTMLElement).isContentEditable
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isInputFocused()) return;

      if (parts.length === 2) {
        // Two-key sequence
        if (pendingPrefix === parts[0] && e.key.toLowerCase() === parts[1]) {
          e.preventDefault();
          pendingPrefix = null;
          if (timeoutId) clearTimeout(timeoutId);
          handler();
        } else if (e.key.toLowerCase() === parts[0]) {
          pendingPrefix = parts[0];
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            pendingPrefix = null;
          }, 500);
        } else {
          pendingPrefix = null;
        }
        return;
      }

      // Single key or modifier combo
      const combo = parts[0];
      const comboKeys = combo.split('+');
      const mainKey = comboKeys.pop()!;
      const needCtrl = comboKeys.includes('ctrl') || comboKeys.includes('meta');
      const needShift = comboKeys.includes('shift');
      const needAlt = comboKeys.includes('alt');

      if (
        e.key.toLowerCase() === mainKey &&
        (needCtrl ? e.ctrlKey || e.metaKey : true) &&
        (needShift ? e.shiftKey : true) &&
        (needAlt ? e.altKey : true)
      ) {
        e.preventDefault();
        handler();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [key, handler]);
}
