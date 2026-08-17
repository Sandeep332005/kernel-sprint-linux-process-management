"use client";

import { useEffect, useState } from "react";

/**
 * Tracks whether the "dark" class is present on <html>, for the rare case
 * where a component needs a concrete color value (e.g. Framer Motion's
 * `animate={{ backgroundColor: ... }}`, which needs a real color to
 * interpolate, not a CSS variable) rather than a Tailwind `dark:` class.
 */
export default function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    setIsDark(root.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(root.classList.contains("dark"));
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
