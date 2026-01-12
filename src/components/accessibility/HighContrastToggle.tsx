/**
 * Componente de Toggle de Alto Contraste
 * 
 * @module components/accessibility/HighContrastToggle
 */

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Contrast, Eye, Sun, Moon, Accessibility } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { motion } from 'framer-motion';

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  fontSize: number; // 100 = normal, 125 = large, 150 = extra large
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  updateSettings: (updates: Partial<AccessibilitySettings>) => void;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleReducedMotion: () => void;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  fontSize: 100,
};

const AccessibilityContext = createContext<AccessibilityContextType | null>(null);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocalStorage<AccessibilitySettings>(
    'accessibility_settings',
    defaultSettings
  );

  // Aplicar configurações de alto contraste
  useEffect(() => {
    const root = document.documentElement;
    
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    root.style.setProperty('--accessibility-font-scale', `${settings.fontSize / 100}`);
  }, [settings]);

  const updateSettings = useCallback((updates: Partial<AccessibilitySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, [setSettings]);

  const toggleHighContrast = useCallback(() => {
    updateSettings({ highContrast: !settings.highContrast });
  }, [settings.highContrast, updateSettings]);

  const toggleLargeText = useCallback(() => {
    updateSettings({ largeText: !settings.largeText });
  }, [settings.largeText, updateSettings]);

  const toggleReducedMotion = useCallback(() => {
    updateSettings({ reducedMotion: !settings.reducedMotion });
  }, [settings.reducedMotion, updateSettings]);

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        updateSettings,
        toggleHighContrast,
        toggleLargeText,
        toggleReducedMotion,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Simple toggle for high contrast only
interface HighContrastToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function HighContrastToggle({ className, showLabel = true }: HighContrastToggleProps) {
  const { settings, toggleHighContrast } = useAccessibility();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Switch
        id="high-contrast"
        checked={settings.highContrast}
        onCheckedChange={toggleHighContrast}
        className="data-[state=checked]:bg-primary"
      />
      {showLabel && (
        <Label
          htmlFor="high-contrast"
          className="flex items-center gap-2 cursor-pointer"
        >
          <Contrast className="h-4 w-4" />
          <span>Alto Contraste</span>
        </Label>
      )}
    </div>
  );
}

// Full accessibility menu
interface AccessibilityMenuProps {
  className?: string;
}

export function AccessibilityMenu({ className }: AccessibilityMenuProps) {
  const { settings, updateSettings, toggleHighContrast, toggleLargeText, toggleReducedMotion } = useAccessibility();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className={className}>
          <Accessibility className="h-5 w-5" />
          <span className="sr-only">Acessibilidade</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Accessibility className="h-4 w-4" />
              Acessibilidade
            </h4>
            <p className="text-xs text-muted-foreground">
              Personalize sua experiência visual
            </p>
          </div>

          <div className="space-y-3">
            {/* Alto Contraste */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg transition-colors',
                  settings.highContrast ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <Contrast className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Alto Contraste</p>
                  <p className="text-xs text-muted-foreground">Aumenta contraste das cores</p>
                </div>
              </div>
              <Switch
                checked={settings.highContrast}
                onCheckedChange={toggleHighContrast}
              />
            </motion.div>

            {/* Texto Grande */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg transition-colors',
                  settings.largeText ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <Eye className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Texto Grande</p>
                  <p className="text-xs text-muted-foreground">Aumenta tamanho das fontes</p>
                </div>
              </div>
              <Switch
                checked={settings.largeText}
                onCheckedChange={toggleLargeText}
              />
            </motion.div>

            {/* Reduzir Movimento */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2 rounded-lg transition-colors',
                  settings.reducedMotion ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  <Moon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Reduzir Movimento</p>
                  <p className="text-xs text-muted-foreground">Desativa animações</p>
                </div>
              </div>
              <Switch
                checked={settings.reducedMotion}
                onCheckedChange={toggleReducedMotion}
              />
            </motion.div>

            {/* Tamanho da Fonte */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                  <Sun className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Tamanho da Fonte</p>
                  <p className="text-xs text-muted-foreground">{settings.fontSize}%</p>
                </div>
              </div>
              <Slider
                value={[settings.fontSize]}
                onValueChange={([value]) => updateSettings({ fontSize: value })}
                min={75}
                max={150}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>75%</span>
                <span>100%</span>
                <span>150%</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default HighContrastToggle;
