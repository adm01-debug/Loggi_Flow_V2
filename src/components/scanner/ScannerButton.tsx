import { useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { QRScannerModal } from "./QRScannerModal";
import { ScanResult } from "@/hooks/ui/useQRScanner";
import { toast } from "sonner";

interface ScannerButtonProps {
  onScan: (result: ScanResult) => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
  continuous?: boolean;
  className?: string;
}

export function ScannerButton({
  onScan,
  variant = "outline",
  size = "default",
  showLabel = true,
  continuous = false,
  className,
}: ScannerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleScan = (result: ScanResult) => {
    onScan(result);
    toast.success(`Código escaneado: ${result.text}`);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={() => setIsOpen(true)}
            className={className}
          >
            <ScanLine className="h-4 w-4" />
            {showLabel && size !== "icon" && (
              <span className="ml-2">Escanear</span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Escanear QR Code ou código de barras</p>
        </TooltipContent>
      </Tooltip>

      <QRScannerModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onScan={handleScan}
        continuous={continuous}
      />
    </>
  );
}
