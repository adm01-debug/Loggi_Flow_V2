import { useEffect, useRef } from "react";
import { useTelemetry } from "@/hooks/analytics/useTelemetry";

export function usePerformanceMonitor() {
  const { logTelemetry } = useTelemetry();
  const logRef = useRef(logTelemetry);
  logRef.current = logTelemetry;

  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;

    // Observe Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];

      logRef.current({
        severity: "info",
        category: "performance_lcp",
        message: `LCP detectado: ${lastEntry.startTime.toFixed(2)}ms`,
        metadata: {
          metric: "LCP",
          value: lastEntry.startTime,
          element: (lastEntry as any).element?.tagName,
        },
      });
    });

    // Observe First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      entryList.getEntries().forEach((entry) => {
        const delay = (entry as any).processingStart - entry.startTime;
        logRef.current({
          severity: "info",
          category: "performance_fid",
          message: `FID detectado: ${delay.toFixed(2)}ms`,
          metadata: {
            metric: "FID",
            value: delay,
            name: entry.name,
          },
        });
      });
    });

    // Observe Cumulative Layout Shift (CLS)
    const clsObserver = new PerformanceObserver((entryList) => {
      let clsValue = 0;
      entryList.getEntries().forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      if (clsValue > 0.1) {
        logRef.current({
          severity: "warning",
          category: "performance_cls",
          message: `CLS Alto detectado: ${clsValue.toFixed(4)}`,
          metadata: {
            metric: "CLS",
            value: clsValue,
          },
        });
      }
    });

    try {
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
      fidObserver.observe({ type: "first-input", buffered: true });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    } catch (e) {
      console.warn("PerformanceObserver observation failed:", e);
    }

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);
}
