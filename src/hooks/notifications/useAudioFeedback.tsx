import { useCallback } from 'react';
import { 
  playSuccessSound, 
  playErrorSound, 
  playClickSound, 
  playPopSound, 
  playWhooshSound,
  playToggleSound,
  playNotificationSound
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

  const playNotification = useCallback(() => {
    playNotificationSound();
  }, []);

  const playToggle = useCallback((on: boolean) => {
    playToggleSound(on);
  }, []);

  return {
    playSuccess,
    playError,
    playAction,
    playPop,
    playWhoosh,
    playNotification,
    playToggle
  };
}
