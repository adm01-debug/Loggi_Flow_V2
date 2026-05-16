export const hapticFeedback = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    const patterns = {
      light: 10,
      medium: 20,
      heavy: 40
    };
    navigator.vibrate(patterns[intensity]);
  }
};
