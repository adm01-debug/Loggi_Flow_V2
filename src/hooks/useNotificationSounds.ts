/**
 * Hook para Efeitos Sonoros de Notificação
 * 
 * @module hooks/useNotificationSounds
 */

import { useCallback, useRef, useEffect, useState } from 'react';

// ============================================
// Sound Types
// ============================================

export type NotificationSoundType = 
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'message'
  | 'achievement'
  | 'levelUp'
  | 'coin'
  | 'click'
  | 'hover'
  | 'toggle'
  | 'pop'
  | 'swoosh'
  | 'ding';

// ============================================
// Sound Configurations
// ============================================

interface SoundConfig {
  frequency?: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
  notes?: number[];
  noteDuration?: number;
}

const soundConfigs: Record<NotificationSoundType, SoundConfig> = {
  success: {
    notes: [523.25, 659.25, 783.99], // C5, E5, G5 (C major chord rising)
    noteDuration: 100,
    volume: 0.3,
    type: 'sine',
  },
  error: {
    notes: [311.13, 277.18], // D#4, C#4 (descending minor)
    noteDuration: 150,
    volume: 0.3,
    type: 'square',
  },
  warning: {
    notes: [440, 440], // A4 double beep
    noteDuration: 100,
    volume: 0.25,
    type: 'triangle',
  },
  info: {
    frequency: 587.33, // D5
    duration: 100,
    volume: 0.2,
    type: 'sine',
  },
  message: {
    notes: [659.25, 783.99], // E5, G5
    noteDuration: 80,
    volume: 0.25,
    type: 'sine',
  },
  achievement: {
    notes: [523.25, 659.25, 783.99, 1046.50], // C5, E5, G5, C6 fanfare
    noteDuration: 120,
    volume: 0.35,
    type: 'sine',
  },
  levelUp: {
    notes: [392, 440, 493.88, 523.25, 587.33, 659.25, 783.99], // Scale up
    noteDuration: 60,
    volume: 0.3,
    type: 'sine',
  },
  coin: {
    notes: [1318.51, 1567.98], // E6, G6 Mario coin-like
    noteDuration: 60,
    volume: 0.2,
    type: 'square',
  },
  click: {
    frequency: 1000,
    duration: 20,
    volume: 0.1,
    type: 'sine',
  },
  hover: {
    frequency: 800,
    duration: 15,
    volume: 0.05,
    type: 'sine',
  },
  toggle: {
    notes: [880, 1174.66], // A5, D6
    noteDuration: 40,
    volume: 0.15,
    type: 'sine',
  },
  pop: {
    frequency: 600,
    duration: 50,
    volume: 0.2,
    type: 'sine',
  },
  swoosh: {
    notes: [200, 400, 600, 800],
    noteDuration: 30,
    volume: 0.15,
    type: 'sine',
  },
  ding: {
    frequency: 1200,
    duration: 200,
    volume: 0.25,
    type: 'sine',
  },
};

// ============================================
// Audio Context Manager
// ============================================

class AudioContextManager {
  private static instance: AudioContextManager | null = null;
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  static getInstance(): AudioContextManager {
    if (!AudioContextManager.instance) {
      AudioContextManager.instance = new AudioContextManager();
    }
    return AudioContextManager.instance;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.5;
      } catch (e) {
        console.warn('Web Audio API not supported');
        return null;
      }
    }
    
    return this.audioContext;
  }

  getMasterGain(): GainNode | null {
    this.getContext();
    return this.masterGain;
  }

  resumeContext(): void {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  playTone(frequency: number, duration: number, type: OscillatorType, volume: number): void {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (e) {
      console.warn('Error playing tone:', e);
    }
  }

  async playNotes(notes: number[], noteDuration: number, type: OscillatorType, volume: number): Promise<void> {
    for (let i = 0; i < notes.length; i++) {
      this.playTone(notes[i], noteDuration, type, volume);
      await new Promise(resolve => setTimeout(resolve, noteDuration * 0.8));
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
}

// ============================================
// Main Hook
// ============================================

interface UseNotificationSoundsOptions {
  enabled?: boolean;
  masterVolume?: number;
}

export function useNotificationSounds(options: UseNotificationSoundsOptions = {}) {
  const { enabled = true, masterVolume = 0.5 } = options;
  const audioManager = useRef<AudioContextManager | null>(null);

  useEffect(() => {
    audioManager.current = AudioContextManager.getInstance();
    audioManager.current.setMasterVolume(masterVolume);
  }, [masterVolume]);

  const playSound = useCallback((soundType: NotificationSoundType) => {
    if (!enabled || !audioManager.current) return;

    // Resume context on user interaction
    audioManager.current.resumeContext();

    const config = soundConfigs[soundType];
    
    if (config.notes) {
      audioManager.current.playNotes(
        config.notes,
        config.noteDuration || 100,
        config.type || 'sine',
        config.volume || 0.3
      );
    } else if (config.frequency) {
      audioManager.current.playTone(
        config.frequency,
        config.duration || 100,
        config.type || 'sine',
        config.volume || 0.3
      );
    }
  }, [enabled]);

  const playSuccess = useCallback(() => playSound('success'), [playSound]);
  const playError = useCallback(() => playSound('error'), [playSound]);
  const playWarning = useCallback(() => playSound('warning'), [playSound]);
  const playInfo = useCallback(() => playSound('info'), [playSound]);
  const playMessage = useCallback(() => playSound('message'), [playSound]);
  const playAchievement = useCallback(() => playSound('achievement'), [playSound]);
  const playLevelUp = useCallback(() => playSound('levelUp'), [playSound]);
  const playCoin = useCallback(() => playSound('coin'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);
  const playToggle = useCallback(() => playSound('toggle'), [playSound]);
  const playPop = useCallback(() => playSound('pop'), [playSound]);
  const playDing = useCallback(() => playSound('ding'), [playSound]);

  const setVolume = useCallback((volume: number) => {
    audioManager.current?.setMasterVolume(volume);
  }, []);

  return {
    playSound,
    playSuccess,
    playError,
    playWarning,
    playInfo,
    playMessage,
    playAchievement,
    playLevelUp,
    playCoin,
    playClick,
    playToggle,
    playPop,
    playDing,
    setVolume,
  };
}

// ============================================
// Context for global sound settings
// ============================================

import { createContext, useContext, ReactNode } from 'react';

interface SoundSettingsContextType {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  volume: number;
  setVolume: (volume: number) => void;
}

const SoundSettingsContext = createContext<SoundSettingsContextType | null>(null);

interface SoundSettingsProviderProps {
  children: ReactNode;
}

export function SoundSettingsProvider({ children }: SoundSettingsProviderProps) {
  const [soundEnabled, setSoundEnabledState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sound-enabled');
      return stored !== 'false';
    }
    return true;
  });
  
  const [volume, setVolumeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sound-volume');
      return stored ? parseFloat(stored) : 0.5;
    }
    return 0.5;
  });

  const handleSetSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    localStorage.setItem('sound-enabled', String(enabled));
  }, []);

  const handleSetVolume = useCallback((vol: number) => {
    const clampedVol = Math.max(0, Math.min(1, vol));
    setVolumeState(clampedVol);
    localStorage.setItem('sound-volume', String(clampedVol));
  }, []);

  const value: SoundSettingsContextType = {
    soundEnabled,
    setSoundEnabled: handleSetSoundEnabled,
    volume,
    setVolume: handleSetVolume,
  };

  return (
    <SoundSettingsContext.Provider value={value}>
      {children}
    </SoundSettingsContext.Provider>
  );
}

export function useSoundSettings() {
  const context = useContext(SoundSettingsContext);
  if (!context) {
    return {
      soundEnabled: true,
      setSoundEnabled: () => {},
      volume: 0.5,
      setVolume: () => {},
    };
  }
  return context;
}

export default useNotificationSounds;
