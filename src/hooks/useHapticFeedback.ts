import { useCallback } from 'react';

// ============================================
// HAPTIC FEEDBACK HOOK
// Provides vibration feedback for mobile devices
// ============================================

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

const hapticPatterns: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [25, 50, 25],
  error: [50, 100, 50, 100, 50],
  selection: 5,
};

export function useHapticFeedback() {
  const isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  const trigger = useCallback((type: HapticType = 'light') => {
    if (!isSupported) return;
    
    try {
      const pattern = hapticPatterns[type];
      navigator.vibrate(pattern);
    } catch (error) {
      // Silently fail if vibration is not allowed
      console.debug('Haptic feedback not available:', error);
    }
  }, [isSupported]);

  const light = useCallback(() => trigger('light'), [trigger]);
  const medium = useCallback(() => trigger('medium'), [trigger]);
  const heavy = useCallback(() => trigger('heavy'), [trigger]);
  const success = useCallback(() => trigger('success'), [trigger]);
  const warning = useCallback(() => trigger('warning'), [trigger]);
  const error = useCallback(() => trigger('error'), [trigger]);
  const selection = useCallback(() => trigger('selection'), [trigger]);

  // Button click feedback
  const buttonTap = useCallback(() => {
    trigger('light');
  }, [trigger]);

  // Toggle switch feedback
  const toggleSwitch = useCallback(() => {
    trigger('medium');
  }, [trigger]);

  // Notification received
  const notification = useCallback(() => {
    trigger('success');
  }, [trigger]);

  // Error occurred
  const errorFeedback = useCallback(() => {
    trigger('error');
  }, [trigger]);

  // Long press feedback
  const longPress = useCallback(() => {
    trigger('heavy');
  }, [trigger]);

  return {
    isSupported,
    trigger,
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    selection,
    // Semantic helpers
    buttonTap,
    toggleSwitch,
    notification,
    errorFeedback,
    longPress,
  };
}

export default useHapticFeedback;