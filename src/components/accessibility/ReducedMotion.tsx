import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ReducedMotionContextValue {
  prefersReducedMotion: boolean;
  motionEnabled: boolean;
  toggleMotion: () => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextValue>({
  prefersReducedMotion: false,
  motionEnabled: true,
  toggleMotion: () => {},
});

export function ReducedMotionProvider({ children }: { children: ReactNode }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [userPreference, setUserPreference] = useState<boolean | null>(null);

  useEffect(() => {
    // Check system preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    // Check saved user preference
    const saved = localStorage.getItem("motion-preference");
    if (saved !== null) {
      setUserPreference(saved === "enabled");
    }

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const motionEnabled =
    userPreference !== null ? userPreference : !prefersReducedMotion;

  const toggleMotion = () => {
    const newValue = !motionEnabled;
    setUserPreference(newValue);
    localStorage.setItem(
      "motion-preference",
      newValue ? "enabled" : "disabled",
    );
  };

  // Apply to document for CSS usage
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = motionEnabled
      ? "false"
      : "true";
  }, [motionEnabled]);

  return (
    <ReducedMotionContext.Provider
      value={{ prefersReducedMotion, motionEnabled, toggleMotion }}
    >
      {children}
    </ReducedMotionContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useReducedMotion() {
  return useContext(ReducedMotionContext);
}

// Hook for conditional animations
// eslint-disable-next-line react-refresh/only-export-components
export function useMotionVariants<T extends Record<string, unknown>>(
  animatedVariants: T,
  reducedVariants?: T,
): T {
  const { motionEnabled } = useReducedMotion();

  if (!motionEnabled && reducedVariants) {
    return reducedVariants;
  }

  return animatedVariants;
}
