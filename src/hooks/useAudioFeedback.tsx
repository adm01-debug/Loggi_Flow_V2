import { useCallback } from 'react';
import { 
  playSuccessSound, 
  playErrorSound, 
  playClickSound, 
  playPopSound, 
  playWhooshSound 
} from '@/utils/celebrationSounds';

export function useAudioFeedback() {
  const playSuccess = useCallback(() => {
    playSuccessSound();
  }, []);

  const playError = useCallback(() => {
    playErrorSound();
  }, []);

  const playAction = useCallback(() => {
    playClickSound();
  }, []);

  const playPop = useCallback(() => {
    playPopSound();
  }, []);

  const playWhoosh = useCallback(() => {
    playWhooshSound();
  }, []);

  return {
    playSuccess,
    playError,
    playAction,
    playPop,
    playWhoosh
  };
}
