// Celebration sounds using Web Audio API
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

// Play a single note
function playNote(frequency: number, startTime: number, duration: number, volume: number = 0.3) {
  const ctx = getAudioContext();
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, startTime);
  
  // Attack and decay envelope
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// Common celebration sound
export function playCommonSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Simple two-note chime
  playNote(523.25, now, 0.2, 0.2);        // C5
  playNote(659.25, now + 0.1, 0.3, 0.25); // E5
}

// Rare celebration sound
export function playRareSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Three-note ascending arpeggio
  playNote(523.25, now, 0.15, 0.2);        // C5
  playNote(659.25, now + 0.1, 0.15, 0.25); // E5
  playNote(783.99, now + 0.2, 0.3, 0.3);   // G5
}

// Epic celebration sound
export function playEpicSound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Majestic fanfare
  playNote(392.00, now, 0.15, 0.2);        // G4
  playNote(523.25, now + 0.1, 0.15, 0.25); // C5
  playNote(659.25, now + 0.2, 0.15, 0.3);  // E5
  playNote(783.99, now + 0.3, 0.4, 0.35);  // G5
  
  // Add sparkle
  playNote(1046.50, now + 0.35, 0.3, 0.15); // C6
}

// Legendary celebration sound
export function playLegendarySound() {
  const ctx = getAudioContext();
  const now = ctx.currentTime;
  
  // Epic fanfare with harmony
  playNote(261.63, now, 0.2, 0.15);        // C4 (bass)
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

// Play sound based on rarity
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
