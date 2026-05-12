import { Plus, QrCode, Truck, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQRScanner } from "@/hooks/useQRScanner";
import { QRScannerModal } from "@/components/scanner/QRScannerModal";

export const MobileQuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isOpen: isQRSelectionOpen, openScanner, closeScanner } = useQRScanner();

  const actions = [
    { icon: <Package className="w-5 h-5" />, label: "Novo Despacho", path: "/despachos" },
    { icon: <Truck className="w-5 h-5" />, label: "Nova Coleta", path: "/coletas" },
    { icon: <QrCode className="w-5 h-5" />, label: "Escanear QR", onClick: () => { openScanner(); setIsOpen(false); } },
  ];

  return (
    <div className="md:hidden fixed bottom-24 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col-reverse items-end gap-3 mb-4">
            {actions.map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                transition={{ delay: i * 0.05 }}
              >
                <Button
                  size="lg"
                  variant="secondary"
                  className="rounded-full shadow-lg flex items-center gap-2 pr-5 bg-background border-2 border-primary/20"
                  onClick={() => action.onClick ? action.onClick() : navigate(action.path!)}
                >
                  <span className="text-sm font-medium">{action.label}</span>
                  {action.icon}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className="w-14 h-14 rounded-full shadow-xl bg-primary text-primary-foreground transition-transform active:scale-95"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {isOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
        </motion.div>
      </Button>

      <QRScannerModal isOpen={isQRSelectionOpen} onClose={closeScanner} />
    </div>
  );
};
