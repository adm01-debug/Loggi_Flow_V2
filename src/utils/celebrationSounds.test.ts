import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as soundUtils from './celebrationSounds';

// Mock AudioContext and related Web Audio APIs
const mockOscillator = {
  connect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
  frequency: { setValueAtTime: vi.fn() },
  type: 'sine',
};

const mockGain = {
  connect: vi.fn(),
  gain: {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  },
};

const mockAudioContext = {
  currentTime: 0,
  state: 'running',
  resume: vi.fn(),
  createOscillator: vi.fn(() => mockOscillator),
  createGain: vi.fn(() => mockGain),
  destination: {},
  sampleRate: 44100,
  createBuffer: vi.fn(() => ({
    getChannelData: vi.fn(() => new Float32Array(100)),
  })),
  createBufferSource: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    buffer: null,
  })),
  createBiquadFilter: vi.fn(() => ({
    type: 'highpass',
    frequency: { value: 1000 },
    connect: vi.fn(),
  })),
};

// @ts-ignore
global.AudioContext = vi.fn(() => mockAudioContext);

describe('celebrationSounds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    soundUtils.setMuted(false);
    soundUtils.setVolume(0.3);
  });

  it('toggles mute correctly', () => {
    const initialMute = soundUtils.isSoundEnabled();
    soundUtils.toggleMute();
    expect(soundUtils.isSoundEnabled()).toBe(!initialMute);
    soundUtils.toggleMute();
    expect(soundUtils.isSoundEnabled()).toBe(initialMute);
  });

  it('sets volume within bounds', () => {
    soundUtils.setVolume(0.5);
    expect(soundUtils.getVolume()).toBe(0.5);
    
    soundUtils.setVolume(1.5);
    expect(soundUtils.getVolume()).toBe(1);
    
    soundUtils.setVolume(-0.5);
    expect(soundUtils.getVolume()).toBe(0);
  });

  it('plays sounds when not muted', () => {
    soundUtils.playClickSound();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('does not play sounds when muted', () => {
    soundUtils.setMuted(true);
    soundUtils.playClickSound();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('plays different celebration rarities', () => {
    const spyCommon = vi.spyOn(soundUtils, 'playCommonSound');
    const spyLegendary = vi.spyOn(soundUtils, 'playLegendarySound');
    
    soundUtils.playCelebrationSound('common');
    expect(spyCommon).toHaveBeenCalled();
    
    soundUtils.playCelebrationSound('legendary');
    expect(spyLegendary).toHaveBeenCalled();
  });
});
