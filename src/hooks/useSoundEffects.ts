import { useCallback, useState, useMemo } from 'react';
import {
  soundEffects,
  playCelebrationSound,
  setMuted,
  setVolume,
  getVolume,
  isSoundEnabled,
  toggleMute,
  type SoundEffectName,
} from '@/utils/celebrationSounds';

// ============================================
// SOUND EFFECTS HOOK
// React hook for managing sound effects
// ============================================

interface UseSoundEffectsOptions {
  enabled?: boolean;
  defaultVolume?: number;
}

export function useSoundEffects(options: UseSoundEffectsOptions = {}) {
  const { enabled: initialEnabled = true, defaultVolume = 0.3 } = options;
  
  const [isMuted, setIsMuted] = useState(!initialEnabled);
  const [volume, setVolumeState] = useState(defaultVolume);

  // Initialize volume
  useMemo(() => {
    setVolume(defaultVolume);
    setMuted(!initialEnabled);
  }, [defaultVolume, initialEnabled]);

  // Toggle mute
  const toggleSound = useCallback(() => {
    const newMuted = toggleMute();
    setIsMuted(newMuted);
    return !newMuted;
  }, []);

  // Set mute state
  const setEnabled = useCallback((enabled: boolean) => {
    setMuted(!enabled);
    setIsMuted(!enabled);
  }, []);

  // Change volume
  const changeVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    setVolumeState(clampedVolume);
  }, []);

  // Play any sound effect by name
  const play = useCallback((name: SoundEffectName, ...args: unknown[]) => {
    if (isMuted) return;
    const effect = soundEffects[name];
    if (typeof effect === 'function') {
      (effect as (...args: unknown[]) => void)(...args);
    }
  }, [isMuted]);

  // Celebration sounds
  const common = useCallback(() => !isMuted && soundEffects.common(), [isMuted]);
  const rare = useCallback(() => !isMuted && soundEffects.rare(), [isMuted]);
  const epic = useCallback(() => !isMuted && soundEffects.epic(), [isMuted]);
  const legendary = useCallback(() => !isMuted && soundEffects.legendary(), [isMuted]);
  
  const celebration = useCallback((rarity: "common" | "rare" | "epic" | "legendary") => {
    if (isMuted) return;
    playCelebrationSound(rarity);
  }, [isMuted]);

  // Gamification sounds
  const levelUp = useCallback(() => !isMuted && soundEffects.levelUp(), [isMuted]);
  const xpGain = useCallback(() => !isMuted && soundEffects.xpGain(), [isMuted]);
  const coin = useCallback(() => !isMuted && soundEffects.coin(), [isMuted]);
  const streak = useCallback(() => !isMuted && soundEffects.streak(), [isMuted]);
  const achievement = useCallback(() => !isMuted && soundEffects.achievement(), [isMuted]);

  // UI Feedback sounds
  const click = useCallback(() => !isMuted && soundEffects.click(), [isMuted]);
  const toggle = useCallback((on: boolean) => !isMuted && soundEffects.toggle(on), [isMuted]);
  const error = useCallback(() => !isMuted && soundEffects.error(), [isMuted]);
  const success = useCallback(() => !isMuted && soundEffects.success(), [isMuted]);
  const warning = useCallback(() => !isMuted && soundEffects.warning(), [isMuted]);
  const notification = useCallback(() => !isMuted && soundEffects.notification(), [isMuted]);
  const message = useCallback(() => !isMuted && soundEffects.message(), [isMuted]);
  const whoosh = useCallback(() => !isMuted && soundEffects.whoosh(), [isMuted]);
  const pop = useCallback(() => !isMuted && soundEffects.pop(), [isMuted]);

  return {
    // State
    isMuted,
    isEnabled: !isMuted,
    volume,
    
    // Controls
    toggleSound,
    setEnabled,
    changeVolume,
    play,
    
    // Celebration sounds
    celebration,
    common,
    rare,
    epic,
    legendary,
    
    // Gamification sounds
    levelUp,
    xpGain,
    coin,
    streak,
    achievement,
    
    // UI Feedback sounds
    click,
    toggle,
    error,
    success,
    warning,
    notification,
    message,
    whoosh,
    pop,
    
    // Full effects object for advanced usage
    effects: soundEffects,
  };
}

export default useSoundEffects;
