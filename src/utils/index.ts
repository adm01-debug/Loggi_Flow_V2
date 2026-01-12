// ============================================
// UTILS - UTILITY FUNCTIONS BARREL FILE
// ============================================

// Celebration Sounds System
export {
  isSoundEnabled,
  toggleMute,
  setMuted,
  setVolume,
  getVolume,
  playCommonSound,
  playRareSound,
  playEpicSound,
  playLegendarySound,
  playLevelUpSound,
  playXPGainSound,
  playCoinSound,
  playStreakSound,
  playAchievementSound,
  playClickSound,
  playToggleSound,
  playErrorSound,
  playSuccessSound,
  playWarningSound,
  playNotificationSound,
  playMessageSound,
  playWhooshSound,
  playPopSound,
  playCelebrationSound,
  soundEffects,
  type SoundEffectName,
} from './celebrationSounds';

// Haptic Feedback System
export {
  triggerHaptic,
  customHaptic,
  patternHaptic,
  stopHaptic,
  rhythmicHaptic,
  intensityHaptic,
  hapticFeedback,
  contextualHaptic,
  isVibrationSupported,
  type HapticPattern,
  type HapticOptions,
} from './hapticFeedback';
