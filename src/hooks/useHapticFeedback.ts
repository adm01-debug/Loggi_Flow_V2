import { useCallback, useMemo } from 'react';
import { 
  triggerHaptic, 
  hapticFeedback, 
  contextualHaptic,
  isVibrationSupported,
  customHaptic,
  patternHaptic,
  rhythmicHaptic,
  intensityHaptic,
  stopHaptic,
  type HapticPattern 
} from '@/utils/hapticFeedback';

// ============================================
// PREMIUM HAPTIC FEEDBACK HOOK
// React hook for advanced haptic feedback
// ============================================

interface UseHapticFeedbackOptions {
  enabled?: boolean;
  defaultPattern?: HapticPattern;
}

export function useHapticFeedback(options: UseHapticFeedbackOptions = {}) {
  const { enabled = true, defaultPattern = 'light' } = options;
  const isSupported = useMemo(() => isVibrationSupported(), []);

  // Core trigger function
  const trigger = useCallback((pattern: HapticPattern = defaultPattern) => {
    if (!enabled || !isSupported) return false;
    return triggerHaptic(pattern);
  }, [enabled, isSupported, defaultPattern]);

  // Pattern shortcuts
  const light = useCallback(() => trigger('light'), [trigger]);
  const medium = useCallback(() => trigger('medium'), [trigger]);
  const heavy = useCallback(() => trigger('heavy'), [trigger]);
  const success = useCallback(() => trigger('success'), [trigger]);
  const warning = useCallback(() => trigger('warning'), [trigger]);
  const error = useCallback(() => trigger('error'), [trigger]);
  const selection = useCallback(() => trigger('selection'), [trigger]);
  const impact = useCallback(() => trigger('impact'), [trigger]);
  const notification = useCallback(() => trigger('notification'), [trigger]);
  const celebration = useCallback(() => trigger('celebration'), [trigger]);
  const heartbeat = useCallback(() => trigger('heartbeat'), [trigger]);
  const levelUp = useCallback(() => trigger('levelUp'), [trigger]);
  const achievement = useCallback(() => trigger('achievement'), [trigger]);

  // Advanced functions
  const custom = useCallback((duration: number) => {
    if (!enabled || !isSupported) return false;
    return customHaptic(duration);
  }, [enabled, isSupported]);

  const pattern = useCallback((patternArray: number[]) => {
    if (!enabled || !isSupported) return false;
    return patternHaptic(patternArray);
  }, [enabled, isSupported]);

  const rhythmic = useCallback((bpm: number = 120, beats: number = 4) => {
    if (!enabled || !isSupported) return false;
    return rhythmicHaptic(bpm, beats);
  }, [enabled, isSupported]);

  const intensity = useCallback((level: number) => {
    if (!enabled || !isSupported) return false;
    return intensityHaptic(level);
  }, [enabled, isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    stopHaptic();
  }, [isSupported]);

  // Semantic helpers (UI Actions)
  const buttonTap = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.buttonPress();
  }, [enabled]);

  const toggleSwitch = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.toggle();
  }, [enabled]);

  const longPress = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.longPress();
  }, [enabled]);

  const swipe = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.swipe();
  }, [enabled]);

  const pullToRefresh = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.pullRefresh();
  }, [enabled]);

  // Gamification helpers
  const coinCollect = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.coinCollect();
  }, [enabled]);

  const xpGain = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.xpGain();
  }, [enabled]);

  const reward = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.reward();
  }, [enabled]);

  const streak = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.streak();
  }, [enabled]);

  // Contextual feedback
  const onActionResult = useCallback((actionSuccess: boolean) => {
    if (!enabled) return;
    contextualHaptic.onAction(actionSuccess);
  }, [enabled]);

  const byImportance = useCallback((level: 'low' | 'medium' | 'high' | 'critical') => {
    if (!enabled) return;
    contextualHaptic.byImportance(level);
  }, [enabled]);

  const onProgress = useCallback((percent: number) => {
    if (!enabled) return;
    contextualHaptic.progress(percent);
  }, [enabled]);

  // Form helpers
  const inputFocus = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.inputFocus();
  }, [enabled]);

  const inputError = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.inputError();
  }, [enabled]);

  const formSubmit = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.formSubmit();
  }, [enabled]);

  // Drag and drop helpers
  const dragStart = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.dragStart();
  }, [enabled]);

  const dragMove = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.dragMove();
  }, [enabled]);

  const dragEnd = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.dragEnd();
  }, [enabled]);

  const drop = useCallback(() => {
    if (!enabled) return;
    hapticFeedback.drop();
  }, [enabled]);

  return {
    // Status
    isSupported,
    
    // Core
    trigger,
    stop,
    
    // Basic patterns
    light,
    medium,
    heavy,
    selection,
    
    // Status feedback
    success,
    warning,
    error,
    
    // Action patterns
    impact,
    notification,
    celebration,
    heartbeat,
    
    // Gamification patterns
    levelUp,
    achievement,
    coinCollect,
    xpGain,
    reward,
    streak,
    
    // Advanced functions
    custom,
    pattern,
    rhythmic,
    intensity,
    
    // UI Action helpers
    buttonTap,
    toggleSwitch,
    longPress,
    swipe,
    pullToRefresh,
    
    // Form helpers
    inputFocus,
    inputError,
    formSubmit,
    
    // Drag and drop
    dragStart,
    dragMove,
    dragEnd,
    drop,
    
    // Contextual
    onActionResult,
    byImportance,
    onProgress,
    
    // Full hapticFeedback object for advanced usage
    presets: hapticFeedback,
  };
}

export default useHapticFeedback;
