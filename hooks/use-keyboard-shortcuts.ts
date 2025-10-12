import { useEffect, useRef } from "react";

export function useKeyboardShortcuts(onKeyDown: (event: KeyboardEvent) => void) {
  // Use a ref to always call the latest callback without causing effect re-runs
  const callbackRef = useRef(onKeyDown);

  useEffect(() => {
    callbackRef.current = onKeyDown;
  }, [onKeyDown]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      callbackRef.current(e);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
