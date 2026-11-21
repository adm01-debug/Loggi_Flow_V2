import { Plus, QrCode, Truck, Package, X, Sparkles, Bot } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { QRScannerModal } from "@/components/scanner/QRScannerModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AIAssistant = lazy(() =>
  import("@/components/ai/AIAssistant").then((m) => ({
    default: m.AIAssistant,
  })),
);

export const MobileQuickActions = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Package className="w-5 h-5 text-primary" />,
      label: "Novo Despacho",
      path: "/despachos",
      color: "bg-primary/10",
    },
    {
      icon: <Truck className="w-5 h-5 text-info" />,
      label: "Nova Coleta",
      path: "/coletas",
      color: "bg-info/10",
    },
    {
      icon: <QrCode className="w-5 h-5 text-warning" />,
      label: "Escanear QR",
      onClick: () => {
        setIsScannerOpen(true);
        setIsOpen(false);
      },
      color: "bg-warning/10",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-xp" />,
      label: "AIAssistant",
      onClick: () => {
        setIsOpen(false);
        setIsAiOpen(true);
      },
      color: "bg-xp/10",
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
                    delay: i * 0.05,
                  }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className={cn(
                      "rounded-2xl shadow-xl flex items-center gap-3 pr-6 h-16 border-2 group transition-all active:scale-95",
                      "bg-background hover:bg-accent",
                    )}
                    onClick={() =>
                      action.onClick ? action.onClick() : navigate(action.path!)
                    }
                  >
                    <div
                      className={cn(
                        "p-2.5 rounded-xl transition-transform group-hover:scale-110",
                        action.color,
                      )}
                    >
                      {action.icon}
                    </div>
                    <span className="text-sm font-bold tracking-tight">
                      {action.label}
                    </span>
                  </Button>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
        <Button
          size="icon"
          className={cn(
            "w-[72px] h-[72px] rounded-3xl shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] transition-all border-4 border-background group relative",
            isOpen
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-8 h-8" />
            ) : (
              <>
                <Plus className="w-9 h-9" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-3 -right-3 bg-xp text-white p-1 rounded-full border-2 border-background shadow-lg"
                >
                  <Sparkles className="w-3.5 h-3.5" />
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
            icon: <QrCode className="w-4 h-4" />,
          });
        }}
      />

      <Sheet open={isAiOpen} onOpenChange={setIsAiOpen}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0">
          <SheetHeader className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
            <SheetTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              Assistente de Logística
            </SheetTitle>
          </SheetHeader>
          <div className="p-4 h-[calc(100vh-80px)]">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Carregando assistente...
                </div>
              }
            >
              <AIAssistant />
            </Suspense>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
