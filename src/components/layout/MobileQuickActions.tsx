import { Plus, QrCode, Truck, Package, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { QRScannerModal } from "@/components/scanner/QRScannerModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const MobileQuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    { 
      icon: <Package className="w-5 h-5 text-primary" />, 
      label: "Novo Despacho", 
      path: "/despachos",
      color: "bg-primary/10"
    },
    { 
      icon: <Truck className="w-5 h-5 text-info" />, 
      label: "Nova Coleta", 
      path: "/coletas",
      color: "bg-info/10"
    },
    { 
      icon: <QrCode className="w-5 h-5 text-warning" />, 
      label: "Escanear QR", 
      onClick: () => { setIsScannerOpen(true); setIsOpen(false); },
      color: "bg-warning/10"
    },
    { 
      icon: <Sparkles className="w-5 h-5 text-xp" />, 
      label: "AIAssistant", 
      onClick: () => { navigate("/configuracoes"); setIsOpen(false); }, // Placeholder or trigger sheet
      color: "bg-xp/10"
    },
  ];

  return (
    <div className="md:hidden fixed bottom-[90px] right-6 z-[60]">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-[-1]"
            />
            <div className="flex flex-col-reverse items-end gap-4 mb-5">
              {actions.map((action, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.5, x: 20, y: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5, x: 20, y: 20 }}
                  transition={{ 
                    type: "spring",
                    damping: 20,
                    stiffness: 300,
                    delay: i * 0.05 
                  }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className={cn(
                      "rounded-2xl shadow-xl flex items-center gap-3 pr-6 h-16 border-2 group transition-all active:scale-95",
                      "bg-background hover:bg-accent",
                    )}
                    onClick={() => action.onClick ? action.onClick() : navigate(action.path!)}
                  >
                    <div className={cn("p-2.5 rounded-xl transition-transform group-hover:scale-110", action.color)}>
                      {action.icon}
                    </div>
                    <span className="text-sm font-bold tracking-tight">{action.label}</span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="icon"
          className={cn(
            "w-18 h-18 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all border-4 border-background group",
            isOpen 
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          style={{ width: '72px', height: '72px' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="relative">
            {isOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <>
                <Plus className="w-9 h-9" />
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-2 -right-2 bg-xp text-white p-1 rounded-full border-2 border-background"
                >
                  <Sparkles className="w-3 h-3" />
                </motion.div>
              </>
            )}
          </div>
        </Button>
      </motion.div>

      <QRScannerModal 
        open={isScannerOpen} 
        onOpenChange={setIsScannerOpen} 
        onScan={(result) => {
          toast.success(`Código lido: ${result.text}`, {
            icon: <QrCode className="w-4 h-4" />
          });
        }}
      />
    </div>
  );
};
