import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CameraOff,
  SwitchCamera,
  X,
  QrCode,
  Barcode,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQRScanner, ScanResult } from "@/hooks/useQRScanner";
import { cn } from "@/lib/utils";

interface QRScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: ScanResult) => void;
  title?: string;
  description?: string;
  continuous?: boolean;
}

export function QRScannerModal({
  open,
  onOpenChange,
  onScan,
  title = "Escanear Código",
  description = "Posicione o código QR ou de barras no centro da câmera",
  continuous = false,
}: QRScannerModalProps) {
  const {
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
    switchCamera,
    requestPermission,
  } = useQRScanner({
    onScan: (result) => {
      onScan(result);
      if (!continuous) {
        onOpenChange(false);
      }
    },
    continuous,
  });

  useEffect(() => {
    if (open && hasPermission) {
      startScanning();
    }
    return () => {
      if (!open) {
        stopScanning();
      }
    };
  }, [open, hasPermission]);

  const handleClose = () => {
    stopScanning();
    onOpenChange(false);
  };

  if (!isSupported) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Navegador não suportado
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Seu navegador não suporta a leitura de códigos QR/barras.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Tente usar Chrome, Edge ou Safari em versões recentes.
            </p>
          </div>
          <Button variant="outline" onClick={handleClose}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </DialogHeader>

        <div className="relative bg-black aspect-video overflow-hidden">
          {/* Video feed */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanning overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Corner markers */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Top-left */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                {/* Top-right */}
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg" />
                
                {/* Scanning line animation */}
                {isScanning && (
                  <motion.div
                    className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                    animate={{ top: ["10%", "90%", "10%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  />
                )}
              </div>
            </div>

            {/* Darkened corners */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/50" />
          </div>

          {/* Permission request overlay */}
          {!hasPermission && !isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 gap-4">
              <Camera className="h-16 w-16 text-muted-foreground" />
              <div className="text-center">
                <p className="font-medium">Permissão de câmera necessária</p>
                <p className="text-sm text-muted-foreground">
                  Clique abaixo para permitir o acesso
                </p>
              </div>
              <Button onClick={requestPermission}>
                <Camera className="h-4 w-4 mr-2" />
                Permitir Câmera
              </Button>
            </div>
          )}

          {/* Loading overlay */}
          {hasPermission && !isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Last result badge */}
          <AnimatePresence>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-4 left-4 right-4"
              >
                <div className="bg-background/95 backdrop-blur rounded-lg p-3 shadow-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      Código detectado!
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {lastResult.format}
                    </Badge>
                  </div>
                  <p className="text-sm font-mono truncate">{lastResult.text}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="p-4 bg-muted/50 border-t">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Barcode className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                QR, EAN, UPC, Code128
              </span>
            </div>

            <div className="flex items-center gap-2">
              {availableCameras.length > 1 && (
                <Select value={selectedCamera} onValueChange={switchCamera}>
                  <SelectTrigger className="w-40">
                    <SwitchCamera className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Câmera" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCameras.map((camera) => (
                      <SelectItem key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Câmera ${camera.deviceId.slice(0, 8)}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant={isScanning ? "destructive" : "default"}
                onClick={isScanning ? stopScanning : startScanning}
              >
                {isScanning ? (
                  <>
                    <CameraOff className="h-4 w-4 mr-2" />
                    Parar
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Iniciar
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
