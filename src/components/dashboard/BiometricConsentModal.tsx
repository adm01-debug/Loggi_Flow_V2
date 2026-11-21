import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Fingerprint,
  ShieldCheck,
  Zap,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useWebAuthn } from "@/hooks/auth/useWebAuthn";

interface BiometricConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

type ScanStep = "idle" | "scanning" | "success";

function scanButtonLabel(step: ScanStep, supported: boolean | null): string {
  if (supported === false) return "NÃO SUPORTADO";
  if (step === "scanning") return "PROCESSANDO...";
  if (step === "success") return "SUCESSO!";
  if (supported === null) return "VERIFICANDO...";
  return "INICIAR SINCRONIZAÇÃO";
}

export function BiometricConsentModal({
  isOpen,
  onClose,
  onConfirm,
}: BiometricConsentModalProps) {
  const [step, setStatus] = useState<ScanStep>("idle");
  const { isSupported, checkSupport, authenticateWithPasskey } = useWebAuthn();

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        void checkSupport();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen, checkSupport]);

  const handleScan = async () => {
    if (!isSupported) {
      toast.error(
        "Seu dispositivo não suporta autenticação biométrica (WebAuthn)",
      );
      return;
    }
    setStatus("scanning");
    const result = await authenticateWithPasskey();
    if (result) {
      setStatus("success");
      await new Promise((r) => setTimeout(r, 800));
      toast.success("Biometria sincronizada com sucesso!");
      onConfirm();
      onClose();
      setTimeout(() => setStatus("idle"), 500);
    } else {
      setStatus("idle");
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => !v && step !== "scanning" && onClose()}
    >
      <DialogContent className="sm:max-w-[450px] bg-black/95 border-primary/20 backdrop-blur-3xl rounded-[2rem] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-scan" />

        <DialogHeader className="space-y-4">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_20px_rgba(234,56,76,0.2)]">
            <AnimatePresence mode="wait">
              {step === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Fingerprint className="w-10 h-10 text-primary" />
                </motion.div>
              )}
              {step === "scanning" && (
                <motion.div
                  key="scanning"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="relative"
                >
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                  </div>
                </motion.div>
              )}
              {step === "success" && (
                <motion.div
                  key="success"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogTitle className="text-2xl font-black italic tracking-tighter text-center uppercase text-white">
            Autenticação <span className="text-primary">Nexus Bio-ID</span>
          </DialogTitle>
          <DialogDescription className="text-center text-sm font-medium text-white/60 leading-relaxed px-4">
            Para autorizar otimizações neurais de alta performance, precisamos
            confirmar sua identidade via biometria digital criptografada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">
                Segurança de Camada 7
              </p>
              <p className="text-[10px] text-white/40 uppercase font-bold mt-0.5">
                Criptografia de ponta-a-ponta
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-white uppercase tracking-widest">
                Otimização Instantânea
              </p>
              <p className="text-[10px] text-white/40 uppercase font-bold mt-0.5">
                IA desbloqueada em tempo real
              </p>
            </div>
          </div>

          {isSupported === false && (
            <p className="text-center text-[10px] font-bold text-destructive uppercase tracking-widest">
              Dispositivo sem suporte a biometria WebAuthn
            </p>
          )}
        </div>

        <DialogFooter className="sm:justify-center flex-col sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={step === "scanning"}
            className="text-white/40 hover:text-white hover:bg-white/10 uppercase font-black text-[10px] tracking-widest h-12 px-8"
          >
            CANCELAR
          </Button>
          <Button
            onClick={() => void handleScan()}
            disabled={
              step !== "idle" || isSupported === false || isSupported === null
            }
            className="bg-primary hover:bg-primary/80 text-white font-black uppercase text-[10px] tracking-[0.2em] h-12 px-10 shadow-[0_0_20px_rgba(234,56,76,0.4)] transition-all active:scale-95 min-w-[200px]"
          >
            {scanButtonLabel(step, isSupported)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
