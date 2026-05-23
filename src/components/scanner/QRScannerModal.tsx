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
import { useQRScanner, ScanResult } from "@/hooks/ui/useQRScanner";
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
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-black/95 border-white/10 backdrop-blur-xl rounded-[2.5rem]">
        <DialogHeader className="p-8 pb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 shadow-inner">
              <QrCode className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <DialogTitle className="font-black text-2xl tracking-tighter uppercase italic text-white leading-none">
                {title}
              </DialogTitle>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/70 mt-1">{description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="relative bg-black aspect-video overflow-hidden border-y border-white/10">
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
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-3xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                {/* Top-right */}
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-3xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                {/* Bottom-left */}
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-3xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                {/* Bottom-right */}
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-3xl shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
                
                {/* Scanning line animation */}
                {isScanning && (
                  <motion.div
                    className="absolute left-2 right-2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_rgba(var(--primary-rgb),0.8)] rounded-full z-10"
                    animate={{ top: ["5%", "95%", "5%"] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
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
                <div className="bg-black/90 backdrop-blur-2xl rounded-3xl p-5 shadow-2xl border-2 border-success/30 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 rounded-lg bg-success/20">
                      <CheckCircle className="h-5 w-5 text-success animate-bounce" />
                    </div>
                    <span className="text-sm font-black italic tracking-tighter uppercase text-success">
                      Código Detectado_OK
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
        <div className="p-6 bg-sidebar-accent/30 backdrop-blur-md">
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
                  <SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 font-black uppercase tracking-widest text-[10px] w-48">
                    <SwitchCamera className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Câmera_Node" />
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
                className="h-12 px-8 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:scale-[1.03] transition-all"
              >
                {isScanning ? (
                  <>
                    <CameraOff className="w-4.5 h-4.5 mr-2" />
                    Encerrar
                  </>
                ) : (
                  <>
                    <Camera className="w-4.5 h-4.5 mr-2" />
                    Inicializar
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
