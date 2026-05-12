import { Plus, QrCode, Truck, Package, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { QRScannerModal } from "@/components/scanner/QRScannerModal";
import { toast } from "sonner";

export const MobileQuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { icon: <Package className="w-5 h-5" />, label: "Novo Despacho", path: "/despachos" },
    { icon: <Truck className="w-5 h-5" />, label: "Nova Coleta", path: "/coletas" },
    { icon: <QrCode className="w-5 h-5" />, label: "Escanear QR", onClick: () => { setIsScannerOpen(true); setIsOpen(false); } },
  ];

  return (
    <div className="md:hidden fixed bottom-24 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile focus */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[-1]"
            />
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
                    className="rounded-full shadow-lg flex items-center gap-2 pr-5 bg-background border-2 border-primary/20 h-14"
                    onClick={() => action.onClick ? action.onClick() : navigate(action.path!)}
                  >
                    <span className="text-sm font-medium">{action.label}</span>
                    {action.icon}
                  </Button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      <Button
        size="icon"
        className="w-16 h-16 rounded-full shadow-2xl bg-primary text-primary-foreground transition-transform active:scale-90 border-4 border-background"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {isOpen ? <X className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
        </motion.div>
      </Button>

      <QRScannerModal 
        open={isScannerOpen} 
        onOpenChange={setIsScannerOpen} 
        onScan={(result) => {
          toast.success(`Código lido: ${result.text}`);
          // Lógica adicional de roteamento baseada no QR pode ser adicionada aqui
        }}
      />
    </div>
  );
};
