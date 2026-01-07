// Haptic Feedback Utilities
// Provides tactile feedback for touch interactions on supported devices

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

interface HapticOptions {
  duration?: number;
  intensity?: number;
}

// Check if the Vibration API is supported
const isVibrationSupported = (): boolean => {
  return 'vibrate' in navigator;
};

// Vibration patterns for different feedback types
const vibrationPatterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [30, 50, 30],
  warning: [50, 30, 50],
  error: [100, 50, 100, 50, 100],
  selection: 5
};

// Trigger haptic feedback
export const triggerHaptic = (pattern: HapticPattern = 'light', options?: HapticOptions): boolean => {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    const vibrationPattern = vibrationPatterns[pattern];
    navigator.vibrate(vibrationPattern);
    return true;
  } catch (error) {
    console.warn('Haptic feedback failed:', error);
    return false;
  }
};

// Custom haptic with specific duration
export const customHaptic = (duration: number): boolean => {
  if (!isVibrationSupported()) {
    return false;
  }

  try {
    navigator.vibrate(duration);
    return true;
  } catch (error) {
    console.warn('Custom haptic failed:', error);
    return false;
  }
};

// Stop any ongoing vibration
export const stopHaptic = (): void => {
  if (isVibrationSupported()) {
    navigator.vibrate(0);
  }
};

// Haptic feedback for common UI actions
export const hapticFeedback = {
  // Button press
  buttonPress: () => triggerHaptic('light'),
  
  // Toggle switch
  toggle: () => triggerHaptic('selection'),
  
  // Successful action
  success: () => triggerHaptic('success'),
  
  // Warning or attention needed
  warning: () => triggerHaptic('warning'),
  
  // Error occurred
  error: () => triggerHaptic('error'),
  
  // Item selected
  select: () => triggerHaptic('selection'),
  
  // Item deleted
  delete: () => triggerHaptic('medium'),
  
  // Pull to refresh triggered
  pullRefresh: () => triggerHaptic('medium'),
  
  // Navigation
  navigate: () => triggerHaptic('light'),
  
  // Long press detected
  longPress: () => triggerHaptic('heavy'),
  
  // Drag started
  dragStart: () => triggerHaptic('light'),
  
  // Drag ended
  dragEnd: () => triggerHaptic('medium'),
  
  // Swipe action
  swipe: () => triggerHaptic('light'),
  
  // Impact (collision during drag)
  impact: () => triggerHaptic('heavy'),
  
  // Notification received
  notification: () => triggerHaptic('medium'),
  
  // Achievement unlocked
  achievement: () => {
    // Special pattern for achievements
    if (isVibrationSupported()) {
      navigator.vibrate([50, 100, 50, 100, 200]);
    }
  }
};

// Export types for external use
export type { HapticPattern, HapticOptions };
