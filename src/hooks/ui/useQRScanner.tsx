/* eslint-disable @typescript-eslint/ban-ts-comment */
import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";

export interface ScanResult {
  text: string;
  format: string;
  timestamp: Date;
}

export interface UseQRScannerOptions {
  onScan?: (result: ScanResult) => void;
  onError?: (error: Error) => void;
  continuous?: boolean;
}

export function useQRScanner(options: UseQRScannerOptions = {}) {
  const { onScan, onError, continuous = false } = options;
  
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [lastResult, setLastResult] = useState<ScanResult | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);
  const lastScannedRef = useRef<string>("");

  // Get available cameras
  const getCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((d) => d.kind === "videoinput");
      setAvailableCameras(cameras);
      if (cameras.length > 0 && !selectedCamera) {
        // Prefer back camera
        const backCamera = cameras.find(
          (c) => c.label.toLowerCase().includes("back") || c.label.toLowerCase().includes("rear")
        );
        setSelectedCamera(backCamera?.deviceId || cameras[0].deviceId);
      }
    } catch {
      // Silent fail on camera enumeration
    }
  }, [selectedCamera]);

  // Check for camera permission
  const checkPermission = useCallback(async () => {
    try {
      const result = await navigator.permissions.query({ name: "camera" as PermissionName });
      setHasPermission(result.state === "granted");
      return result.state === "granted";
    } catch {
      // Fallback for browsers that don't support permissions API
      return null;
    }
  }, []);

  // Request camera access
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      await getCameras();
      return true;
    } catch (err) {
      setHasPermission(false);
      const error = err instanceof Error ? err : new Error("Camera permission denied");
      onError?.(error);
      toast.error("Permissão de câmera negada");
      return false;
    }
  }, [getCameras, onError]);

  // Simple barcode detection using BarcodeDetector API (if available)
  const detectBarcode = useCallback(async (imageData: ImageBitmap | HTMLVideoElement) => {
    if ("BarcodeDetector" in window) {
      try {
        // @ts-ignore - BarcodeDetector is not in all TS libs
        const detector = new window.BarcodeDetector({
          formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39", "code_93", "upc_a", "upc_e"],
        });
        const barcodes = await detector.detect(imageData);
        if (barcodes.length > 0) {
          return {
            text: barcodes[0].rawValue,
            format: barcodes[0].format,
          };
        }
      } catch {
        // Silent fail on barcode detection
      }
    }
    return null;
  }, []);

  // Scan frame
  const scanFrame = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationRef.current = requestAnimationFrame(scanFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const result = await detectBarcode(video);
    
    if (result && result.text !== lastScannedRef.current) {
      lastScannedRef.current = result.text;
      const scanResult: ScanResult = {
        text: result.text,
        format: result.format,
        timestamp: new Date(),
      };
      setLastResult(scanResult);
      onScan?.(scanResult);
      
      if (!continuous) {
        stopScanning();
        return;
      }
      
      // Reset after 2 seconds for continuous mode
      setTimeout(() => {
        lastScannedRef.current = "";
      }, 2000);
    }

    animationRef.current = requestAnimationFrame(scanFrame);
  }, [isScanning, continuous, detectBarcode, onScan]);

  // Start scanning
  const startScanning = useCallback(async () => {
    try {
      if (!hasPermission) {
        const granted = await requestPermission();
        if (!granted) return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          facingMode: selectedCamera ? undefined : { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);
      lastScannedRef.current = "";
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to start camera");
      onError?.(error);
      toast.error("Erro ao iniciar câmera");
    }
  }, [hasPermission, selectedCamera, requestPermission, onError]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Toggle scanning
  const toggleScanning = useCallback(() => {
    if (isScanning) {
      stopScanning();
    } else {
      startScanning();
    }
  }, [isScanning, startScanning, stopScanning]);

  // Switch camera
  const switchCamera = useCallback(
    (deviceId: string) => {
      setSelectedCamera(deviceId);
      if (isScanning) {
        stopScanning();
        setTimeout(startScanning, 100);
      }
    },
    [isScanning, stopScanning, startScanning]
  );

  // Start frame scanning when isScanning changes
  useEffect(() => {
    if (isScanning) {
      animationRef.current = requestAnimationFrame(scanFrame);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isScanning, scanFrame]);

  // Cleanup on unmount
  useEffect(() => {
    getCameras();
    checkPermission();
    return () => {
      stopScanning();
    };
  }, []);

  // Check if BarcodeDetector is supported
  const isSupported = "BarcodeDetector" in window;

  return {
    isScanning,
    isSupported,
    hasPermission,
    lastResult,
    availableCameras,
    selectedCamera,
    videoRef,
    canvasRef,
    startScanning,
    stopScanning,
    toggleScanning,
    switchCamera,
    requestPermission,
  };
}
