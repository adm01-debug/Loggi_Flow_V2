// ============================================
// PREMIUM HAPTIC FEEDBACK SYSTEM
// Advanced tactile feedback for mobile devices
// ============================================

type HapticPattern = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'selection'
  | 'impact'
  | 'notification'
  | 'celebration'
  | 'heartbeat'
  | 'countdown'
  | 'levelUp'
  | 'achievement'
  | 'refresh'
  | 'swipe';

interface HapticOptions {
  duration?: number;
  intensity?: number;
  repeat?: number;
}

// Check if the Vibration API is supported
const isVibrationSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

// Advanced vibration patterns for different feedback types
const vibrationPatterns: Record<HapticPattern, number | number[]> = {
  // Basic patterns
  light: 10,
  medium: 25,
  heavy: 50,
  selection: 5,
  
  // Status patterns
  success: [30, 60, 30],
  warning: [50, 40, 50, 40, 50],
  error: [100, 50, 100, 50, 100],
  
  // Action patterns
  impact: 80,
  notification: [50, 100, 50],
  refresh: [20, 30, 20, 30, 50],
  swipe: 15,
  
  // Celebration patterns
  celebration: [50, 50, 50, 50, 100, 100, 50, 50, 200],
  heartbeat: [100, 100, 100, 400, 100, 100],
  countdown: [50, 200, 50, 200, 50, 200, 150],
  
  // Gamification patterns
  levelUp: [50, 100, 50, 100, 50, 100, 200, 200],
  achievement: [30, 50, 30, 50, 100, 50, 100, 50, 200],
};

// Trigger haptic feedback with pattern
export const triggerHaptic = (pattern: HapticPattern = 'light', options?: HapticOptions): boolean => {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    let vibrationPattern = vibrationPatterns[pattern];
    
    // Apply options if provided
    if (options?.repeat && options.repeat > 1 && Array.isArray(vibrationPattern)) {
      const repeated: number[] = [];
      for (let i = 0; i < options.repeat; i++) {
        repeated.push(...vibrationPattern);
        if (i < options.repeat - 1) {
          repeated.push(100); // Gap between repetitions
        }
      }
      vibrationPattern = repeated;
    }
    
    navigator.vibrate(vibrationPattern);
    return true;
  } catch {
    return false;
  }
};

// Custom haptic with specific duration
export const customHaptic = (duration: number): boolean => {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    navigator.vibrate(Math.min(duration, 500)); // Max 500ms for safety
    return true;
  } catch {
    return false;
  }
};

// Custom pattern haptic
export const patternHaptic = (pattern: number[]): boolean => {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    navigator.vibrate(pattern);
    return true;
  } catch {
    return false;
  }
};

// Stop any ongoing vibration
export const stopHaptic = (): void => {
  if (isVibrationSupported()) {
    navigator.vibrate(0);
  }
};

// Create rhythmic pattern
export const rhythmicHaptic = (bpm: number = 120, beats: number = 4): boolean => {
  if (!isVibrationSupported()) {
    return false;
  }
  
  const interval = 60000 / bpm; // milliseconds per beat
  const pattern: number[] = [];
  
  for (let i = 0; i < beats; i++) {
    pattern.push(30); // vibration duration
    if (i < beats - 1) {
      pattern.push(interval - 30); // pause between beats
    }
  }
  
  try {
    navigator.vibrate(pattern);
    return true;
  } catch (error) {
    return false;
  }
};

// Intensity-based haptic (0-100)
export const intensityHaptic = (intensity: number): boolean => {
  const clampedIntensity = Math.max(0, Math.min(100, intensity));
  const duration = Math.round(5 + (clampedIntensity / 100) * 95); // 5ms to 100ms
  return customHaptic(duration);
};

// Haptic feedback presets for common UI actions
export const hapticFeedback = {
  // Basic interactions
  buttonPress: () => triggerHaptic('light'),
  buttonRelease: () => triggerHaptic('selection'),
  toggle: () => triggerHaptic('selection'),
  tap: () => triggerHaptic('light'),
  doubleTap: () => patternHaptic([15, 50, 15]),
  
  // Status feedback
  success: () => triggerHaptic('success'),
  warning: () => triggerHaptic('warning'),
  error: () => triggerHaptic('error'),
  
  // Selection
  select: () => triggerHaptic('selection'),
  deselect: () => triggerHaptic('light'),
  
  // Actions
  delete: () => triggerHaptic('medium'),
  confirm: () => triggerHaptic('success'),
  cancel: () => triggerHaptic('light'),
  
  // Navigation
  navigate: () => triggerHaptic('light'),
  back: () => triggerHaptic('selection'),
  tabChange: () => triggerHaptic('selection'),
  
  // Gestures
  pullRefresh: () => triggerHaptic('refresh'),
  longPress: () => triggerHaptic('heavy'),
  swipe: () => triggerHaptic('swipe'),
  pinch: () => triggerHaptic('light'),
  
  // Drag and drop
  dragStart: () => triggerHaptic('light'),
  dragMove: () => triggerHaptic('selection'),
  dragEnd: () => triggerHaptic('medium'),
  drop: () => triggerHaptic('impact'),
  
  // Lists
  reorder: () => triggerHaptic('medium'),
  expand: () => triggerHaptic('light'),
  collapse: () => triggerHaptic('light'),
  
  // Forms
  inputFocus: () => triggerHaptic('selection'),
  inputError: () => triggerHaptic('error'),
  formSubmit: () => triggerHaptic('success'),
  
  // Notifications
  notification: () => triggerHaptic('notification'),
  message: () => triggerHaptic('medium'),
  reminder: () => triggerHaptic('warning'),
  
  // Gamification
  achievement: () => triggerHaptic('achievement'),
  levelUp: () => triggerHaptic('levelUp'),
  celebration: () => triggerHaptic('celebration'),
  reward: () => patternHaptic([50, 100, 50, 100, 200]),
  coinCollect: () => patternHaptic([20, 30, 20]),
  xpGain: () => patternHaptic([30, 50, 30]),
  streak: () => patternHaptic([40, 60, 40, 60, 40, 60, 100]),
  
  // Special effects
  heartbeat: () => triggerHaptic('heartbeat'),
  countdown: () => triggerHaptic('countdown'),
  explosion: () => patternHaptic([100, 50, 80, 50, 60, 50, 40, 50, 20]),
  magic: () => patternHaptic([10, 20, 20, 20, 30, 20, 40, 20, 50]),
  
  // Impact effects
  impactLight: () => triggerHaptic('light'),
  impactMedium: () => triggerHaptic('medium'),
  impactHeavy: () => triggerHaptic('heavy'),
  impactRigid: () => patternHaptic([5, 5, 5]),
  impactSoft: () => patternHaptic([40]),
};

// Context-aware haptic wrapper
export const contextualHaptic = {
  // Provides haptic feedback based on action result
  onAction: (success: boolean) => {
    if (success) {
      hapticFeedback.success();
    } else {
      hapticFeedback.error();
    }
  },
  
  // Provides haptic feedback based on importance level
  byImportance: (level: 'low' | 'medium' | 'high' | 'critical') => {
    switch (level) {
      case 'low':
        hapticFeedback.tap();
        break;
      case 'medium':
        hapticFeedback.notification();
        break;
      case 'high':
        hapticFeedback.warning();
        break;
      case 'critical':
        hapticFeedback.error();
        break;
    }
  },
  
  // Progress feedback (0-100)
  progress: (percent: number) => {
    if (percent === 100) {
      hapticFeedback.success();
    } else if (percent % 25 === 0) {
      hapticFeedback.tap();
    }
  },
};

// Export types for external use
export type { HapticPattern, HapticOptions };
export { isVibrationSupported };
