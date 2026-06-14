import { useEffect, useCallback } from "react";
import { useLocalStorage } from "@/hooks/common/useLocalStorage";
import { UserPreferences, AccessibilitySettings } from "../types";

const DEFAULT_PREFERENCES: UserPreferences = {
  density: "standard",
  theme: "system",
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    fontSize: "md",
    dyslexicFont: false,
  },
  language: "pt-BR",
  gamification: {
    showParticles: true,
    soundEffects: true,
    accentColor: "#ea384c",
    animationSpeed: "normal",
    vibrationIntensity: "low",
  },
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    "logiflow-user-prefs",
    DEFAULT_PREFERENCES,
  );

  const updatePreference = useCallback(
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [key]: value }));
    },
    [setPreferences],
  );

  const updateAccessibility = useCallback(
    <K extends keyof AccessibilitySettings>(
      key: K,
      value: AccessibilitySettings[K],
    ) => {
      setPreferences((prev) => ({
        ...prev,
        accessibility: { ...prev.accessibility, [key]: value },
      }));
    },
    [setPreferences],
  );

  const updateGamification = useCallback(
    <K extends keyof UserPreferences["gamification"]>(
      key: K,
      value: UserPreferences["gamification"][K],
    ) => {
      setPreferences((prev) => ({
        ...prev,
        gamification: { ...prev.gamification, [key]: value },
      }));
    },
    [setPreferences],
  );

  useEffect(() => {
    const root = document.documentElement;

    // Apply Density
    let padding = "1rem";
    let baseFontSize = "0.875rem";
    switch (preferences.density) {
      case "compact":
        padding = "0.5rem";
        baseFontSize = "0.8125rem";
        break;
      case "comfortable":
        padding = "1.5rem";
        baseFontSize = "0.9375rem";
        break;
    }
    root.style.setProperty("--ui-padding", padding);
    root.style.setProperty("--base-font-size", baseFontSize);

    // Apply Accessibility: High Contrast
    if (preferences.accessibility.highContrast) {
      root.classList.add("high-contrast");
    } else {
      root.classList.remove("high-contrast");
    }

    // Apply Accessibility: Reduced Motion
    if (preferences.accessibility.reducedMotion) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    // Apply Accessibility: Font Size
    root.style.setProperty(
      "--font-scale",
      preferences.accessibility.fontSize === "sm"
        ? "0.9"
        : preferences.accessibility.fontSize === "md"
          ? "1.0"
          : preferences.accessibility.fontSize === "lg"
            ? "1.15"
            : "1.3",
    );

    // Apply Dyslexic Font
    if (preferences.accessibility.dyslexicFont) {
      root.classList.add("font-dyslexic");
    } else {
      root.classList.remove("font-dyslexic");
    }

    // Apply Theme
    const isDark =
      preferences.theme === "dark" ||
      (preferences.theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply Gamification Accent
    root.style.setProperty("--primary", preferences.gamification.accentColor);

    // Apply Animation Speed
    const speedMap = { fast: "0.6", normal: "1.0", smooth: "1.6" };
    const baseSpeed =
      speedMap[preferences.gamification.animationSpeed] || "1.0";
    root.style.setProperty("--animation-speed-scale", baseSpeed);

    // Apply Vibration Intensity
    const vibrationMap = { none: "0", low: "5", high: "15" };
    root.style.setProperty(
      "--vibration-intensity",
      vibrationMap[preferences.gamification.vibrationIntensity] || "5",
    );

    // Global duration adjustments for motion components
    root.style.setProperty(
      "--transition-duration",
      `${0.3 * parseFloat(baseSpeed)}s`,
    );
  }, [preferences]);

  return {
    preferences,
    updatePreference,
    updateAccessibility,
    updateGamification,
  };
}
