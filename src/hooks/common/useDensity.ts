import { useEffect } from 'react';
import { useLocalStorage } from "@/hooks/common/useLocalStorage";

export type Density = 'compact' | 'standard' | 'comfortable';

export function useDensity() {
  const [density, setDensity] = useLocalStorage<Density>('ui-density', 'standard');

  useEffect(() => {
    const root = document.documentElement;
    let padding = '1rem';
    let fontSize = '0.875rem';
    
    switch (density) {
      case 'compact':
        padding = '0.5rem';
        fontSize = '0.8125rem';
        break;
      case 'comfortable':
        padding = '1.5rem';
        fontSize = '0.9375rem';
        break;
      default:
        padding = '1rem';
        fontSize = '0.875rem';
    }
    
    root.style.setProperty('--table-padding', padding);
    root.style.setProperty('--density-font-size', fontSize);
  }, [density]);

  return { density, setDensity };
}
