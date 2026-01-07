// ============================================
// PREMIUM CELEBRATION SOUNDS SYSTEM
// Web Audio API powered sound effects
// ============================================

let audioContext: AudioContext | null = null;
let isMuted = false;
let masterVolume = 0.3;

// Initialize or get AudioContext
function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  // Resume if suspended (required for user interaction policy)
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Check if sounds are enabled
export function isSoundEnabled(): boolean {
  return !isMuted;
}

// Toggle mute
export function toggleMute(): boolean {
  isMuted = !isMuted;
  return isMuted;
}

// Set mute state
export function setMuted(muted: boolean): void {
  isMuted = muted;
}

// Set master volume (0-1)
export function setVolume(volume: number): void {
  masterVolume = Math.max(0, Math.min(1, volume));
}

// Get current volume
export function getVolume(): number {
  return masterVolume;
}

// Play a single note with envelope
function playNote(
  frequency: number, 
  startTime: number, 
  duration: number, 
  volume: number = 0.3,
  type: OscillatorType = 'sine',
  attack: number = 0.02,
  decay: number = 0.1
) {
  if (isMuted) return;
  
  const ctx = getAudioContext();
  const adjustedVolume = volume * masterVolume;
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  // ADSR envelope
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(adjustedVolume, startTime + attack);
  gainNode.gain.linearRampToValueAtTime(adjustedVolume * 0.7, startTime + attack + decay);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// Play chord (multiple notes)
function playChord(
  frequencies: number[], 
  startTime: number, 
  duration: number, 
  volume: number = 0.2
) {
  frequencies.forEach((freq, i) => {
    playNote(freq, startTime + i * 0.01, duration, volume);
  });
}

// Play a noise burst (for percussive sounds)
function playNoise(
  startTime: number,
  duration: number,
  volume: number = 0.1
) {
  if (isMuted) return;
  
  const ctx = getAudioContext();
  const adjustedVolume = volume * masterVolume;
  
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const source = ctx.createBufferSource();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  source.buffer = buffer;
  filter.type = 'highpass';
  filter.frequency.value = 1000;
  
  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  gainNode.gain.setValueAtTime(adjustedVolume, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  source.start(startTime);
  source.stop(startTime + duration);
}

// ==================== CELEBRATION SOUNDS ====================

// Common celebration (simple chime)
export function playCommonSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(523.25, now, 0.2, 0.2);        // C5
  playNote(659.25, now + 0.1, 0.3, 0.25); // E5
}

// Rare celebration (ascending arpeggio)
export function playRareSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(523.25, now, 0.15, 0.2);        // C5
  playNote(659.25, now + 0.1, 0.15, 0.25); // E5
  playNote(783.99, now + 0.2, 0.3, 0.3);   // G5
}

// Epic celebration (majestic fanfare)
export function playEpicSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(392.00, now, 0.15, 0.2);        // G4
  playNote(523.25, now + 0.1, 0.15, 0.25); // C5
  playNote(659.25, now + 0.2, 0.15, 0.3);  // E5
  playNote(783.99, now + 0.3, 0.4, 0.35);  // G5
  playNote(1046.50, now + 0.35, 0.3, 0.15); // C6 sparkle
}

// Legendary celebration (full fanfare with harmony)
export function playLegendarySound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Bass foundation
  playNote(261.63, now, 0.2, 0.15);        // C4 (bass)
  
  // Main melody
  playNote(392.00, now, 0.15, 0.2);        // G4
  playNote(523.25, now + 0.1, 0.15, 0.25); // C5
  playNote(659.25, now + 0.2, 0.15, 0.3);  // E5
  playNote(783.99, now + 0.3, 0.2, 0.35);  // G5
  playNote(1046.50, now + 0.4, 0.5, 0.3);  // C6
  
  // Sparkle notes
  playNote(1318.51, now + 0.5, 0.2, 0.15);  // E6
  playNote(1567.98, now + 0.55, 0.25, 0.1); // G6
  playNote(2093.00, now + 0.6, 0.4, 0.08);  // C7
}

// ==================== GAMIFICATION SOUNDS ====================

// Level up sound
export function playLevelUpSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Ascending scale with crescendo
  const notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
  notes.forEach((freq, i) => {
    playNote(freq, now + i * 0.08, 0.15, 0.15 + i * 0.02, 'triangle');
  });
  
  // Final chord
  playChord([1046.50, 1318.51, 1567.98], now + 0.7, 0.5, 0.2);
}

// XP gain sound
export function playXPGainSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(880, now, 0.1, 0.15, 'triangle');
  playNote(1108.73, now + 0.05, 0.15, 0.2, 'triangle');
}

// Coin collect sound
export function playCoinSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(1318.51, now, 0.08, 0.2, 'square');
  playNote(1567.98, now + 0.05, 0.12, 0.25, 'square');
}

// Streak sound
export function playStreakSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  for (let i = 0; i < 4; i++) {
    playNote(880 * (1 + i * 0.15), now + i * 0.1, 0.15, 0.2, 'triangle');
  }
}

// Achievement unlock
export function playAchievementSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Magical sparkle intro
  playNote(1567.98, now, 0.1, 0.15);
  playNote(1864.66, now + 0.08, 0.1, 0.18);
  playNote(2093.00, now + 0.16, 0.12, 0.2);
  
  // Fanfare
  playNote(784, now + 0.3, 0.15, 0.25);
  playNote(988, now + 0.4, 0.15, 0.28);
  playNote(1175, now + 0.5, 0.3, 0.3);
  
  // Final chord
  playChord([1175, 1480, 1760], now + 0.7, 0.5, 0.15);
}

// ==================== UI SOUNDS ====================

// Click/tap sound
export function playClickSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(800, now, 0.05, 0.1, 'sine');
}

// Toggle sound
export function playToggleSound(on: boolean) {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  if (on) {
    playNote(600, now, 0.08, 0.1);
    playNote(800, now + 0.05, 0.1, 0.12);
  } else {
    playNote(800, now, 0.08, 0.1);
    playNote(600, now + 0.05, 0.1, 0.12);
  }
}

// Error sound
export function playErrorSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(200, now, 0.15, 0.2, 'sawtooth');
  playNote(180, now + 0.1, 0.2, 0.2, 'sawtooth');
}

// Success sound
export function playSuccessSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(523.25, now, 0.1, 0.15);
  playNote(659.25, now + 0.08, 0.1, 0.18);
  playNote(783.99, now + 0.16, 0.15, 0.2);
}

// Warning sound
export function playWarningSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(440, now, 0.15, 0.15);
  playNote(440, now + 0.2, 0.15, 0.15);
}

// Notification sound
export function playNotificationSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(880, now, 0.1, 0.12, 'triangle');
  playNote(1108.73, now + 0.12, 0.15, 0.15, 'triangle');
}

// Message sound
export function playMessageSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(587.33, now, 0.08, 0.1);
  playNote(783.99, now + 0.1, 0.12, 0.12);
}

// Whoosh sound (for transitions)
export function playWhooshSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNoise(now, 0.15, 0.08);
}

// Pop sound
export function playPopSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  playNote(400, now, 0.03, 0.2, 'sine');
  playNote(600, now + 0.02, 0.05, 0.15, 'sine');
}

// ==================== MAIN EXPORT ====================

// Play celebration sound based on rarity
export function playCelebrationSound(rarity: "common" | "rare" | "epic" | "legendary") {
  switch (rarity) {
    case "common":
      playCommonSound();
      break;
    case "rare":
      playRareSound();
      break;
    case "epic":
      playEpicSound();
      break;
    case "legendary":
      playLegendarySound();
      break;
  }
}

// Sound effects preset object
export const soundEffects = {
  // Celebrations
  common: playCommonSound,
  rare: playRareSound,
  epic: playEpicSound,
  legendary: playLegendarySound,
  
  // Gamification
  levelUp: playLevelUpSound,
  xpGain: playXPGainSound,
  coin: playCoinSound,
  streak: playStreakSound,
  achievement: playAchievementSound,
  
  // UI Feedback
  click: playClickSound,
  toggle: playToggleSound,
  error: playErrorSound,
  success: playSuccessSound,
  warning: playWarningSound,
  notification: playNotificationSound,
  message: playMessageSound,
  whoosh: playWhooshSound,
  pop: playPopSound,
};

// Type for sound effect names
export type SoundEffectName = keyof typeof soundEffects;
