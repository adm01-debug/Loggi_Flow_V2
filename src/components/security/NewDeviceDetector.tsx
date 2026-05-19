import { useNewDeviceDetection } from '@/hooks';

export function NewDeviceDetector() {
  // This hook automatically checks for new devices on mount
  useNewDeviceDetection();
  
  // This is a utility component, it doesn't render anything
  return null;
}
