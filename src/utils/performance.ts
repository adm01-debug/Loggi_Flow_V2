import { useEffect } from 'react';

export const useRenderingMonitor = (componentName: string) => {
  useEffect(() => {
    const start = performance.now();
    
    return () => {
      const end = performance.now();
      const duration = end - start;
      if (duration > 16) { // Longer than one frame
        console.warn(`[Performance] ${componentName} took ${duration.toFixed(2)}ms to render/mount`);
      }
    };
  }, [componentName]);
};

export const measureAction = async <T>(name: string, action: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  try {
    return await action();
  } finally {
    const end = performance.now();
    console.log(`[Performance] Action ${name} took ${(end - start).toFixed(2)}ms`);
  }
};
