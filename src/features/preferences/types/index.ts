export type UIDensity = 'compact' | 'standard' | 'comfortable';
export type ThemeMode = 'light' | 'dark' | 'system';
export type AccessibilitySettings = {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  dyslexicFont: boolean;
};

export interface UserPreferences {
  density: UIDensity;
  theme: ThemeMode;
  accessibility: AccessibilitySettings;
  language: 'pt-BR' | 'en-US';
  gamification: {
    showParticles: boolean;
    soundEffects: boolean;
    accentColor: string;
  };
}
