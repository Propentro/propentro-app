import { useCallback, useRef } from 'react';

/**
 * Returns an `onOpenChange` wrapper that preserves the window scroll
 * position when a popover/dialog opens. Base UI's FloatingFocusManager
 * can scroll the page when moving focus into a portal-rendered popup.
 */
export function usePreserveScroll(
  setOpen: (open: boolean) => void
): (open: boolean) => void {
  const scrollRef = useRef<{ x: number; y: number } | null>(null);

  return useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        // Save scroll position BEFORE the popover renders
        scrollRef.current = { x: window.scrollX, y: window.scrollY };
        setOpen(true);
        // Restore after FloatingFocusManager has done its focus dance
        requestAnimationFrame(() => {
          if (scrollRef.current) {
            window.scrollTo(scrollRef.current.x, scrollRef.current.y);
            scrollRef.current = null;
          }
        });
      } else {
        setOpen(false);
      }
    },
    [setOpen]
  );
}
