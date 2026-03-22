import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const scrollPositions = new Map<string, number>();

export function ScrollRestoration() {
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    const mainContent = document.getElementById("main-content");
    if (!mainContent) return;

    // Save scroll position of previous route
    const prevPath = prevPathRef.current;
    if (prevPath !== location.pathname) {
      scrollPositions.set(prevPath, mainContent.scrollTop);
    }

    // Restore scroll position or scroll to top
    const savedPosition = scrollPositions.get(location.pathname);
    if (savedPosition !== undefined) {
      requestAnimationFrame(() => {
        mainContent.scrollTo({ top: savedPosition, behavior: "instant" });
      });
    } else {
      mainContent.scrollTo({ top: 0, behavior: "instant" });
    }

    // Focus management — focus the h1 for screen readers
    requestAnimationFrame(() => {
      const h1 = mainContent.querySelector("h1");
      if (h1 && h1 instanceof HTMLElement) {
        h1.setAttribute("tabindex", "-1");
        h1.focus({ preventScroll: true });
      }
    });

    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  return null;
}
