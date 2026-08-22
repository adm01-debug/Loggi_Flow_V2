import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/micro-interactions";
import { AnimatedBackground } from "./AuthHeroSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/ui/use-toast";
import { z } from "zod";

const forgotPasswordSchema = z.object({ email: z.string().email("Email inválido") });

interface AuthForgotPasswordProps {
  onBack: () => void;
}

export function AuthForgotPassword({ onBack }: AuthForgotPasswordProps) {
  const [forgotEmail, setForgotEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const validation = forgotPasswordSchema.safeParse({ email: forgotEmail });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((err) => { if (err.path[0]) fieldErrors[`forgot_${err.path[0]}`] = err.message; });
      setErrors(fieldErrors);
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.from("password_reset_requests").insert({ email: forgotEmail, status: "pending", requested_at: new Date().toISOString() });
    setIsLoading(false);
    if (error) {
      toast({ title: "Erro ao solicitar reset", description: error.message, variant: "destructive" });
    } else {
      setForgotPasswordSent(true);
      toast({ title: "Solicitação enviada!", description: "Aguarde a aprovação do gestor." });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-background p-4 relative overflow-hidden">
      <AnimatedBackground />
      <FadeIn className="w-full max-w-md relative z-10">
        <Card className="shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-primary/20 backdrop-blur-3xl bg-card/80 rounded-3xl overflow-hidden">
          <CardHeader className="text-center space-y-3 pb-4">
            <motion.div whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }} className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 shadow-lg shadow-primary/30">
              <KeyRound className="w-8 h-8 text-white animate-pulse" />
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-display font-black tracking-tighter uppercase italic">Recuperar Senha</CardTitle>
              <CardDescription className="text-base font-medium">
                {forgotPasswordSent ? "Solicitação enviada com sucesso" : "Digite seu email corporativo cadastrado"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="pb-8">
            <AnimatePresence mode="wait">
              {forgotPasswordSent ? (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="space-y-6 py-4">
                  <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center shadow-lg shadow-success/10">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground font-medium leading-relaxed">Sua solicitação foi enviada para <strong className="text-foreground">{forgotEmail}</strong>.</p>
                    <p className="text-xs text-primary font-bold uppercase tracking-widest">Aguarde a aprovação do gestor logístico</p>
                  </div>
                  <Button variant="outline" className="w-full h-12 font-bold rounded-xl gap-2 hover:bg-primary/5 border-2 transition-all" onClick={() => { onBack(); setForgotPasswordSent(false); setForgotEmail(""); }}>
                    <ArrowLeft className="h-4 w-4" /> Voltar para o Login
                  </Button>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} onSubmit={handleForgotPassword} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email" className="font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Email de Cadastro</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input id="forgot-email" type="email" placeholder="seu@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10 h-12 rounded-xl border-2 focus-visible:ring-primary/20" />
                    </div>
                    {errors.forgot_email && <p className="text-[11px] font-bold text-destructive uppercase tracking-wide mt-1">{errors.forgot_email}</p>}
                  </div>
                  <Button type="submit" className="w-full h-12 font-black text-base uppercase tracking-widest shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.03] active:scale-[0.97] rounded-xl bg-gradient-to-r from-primary via-primary/90 to-primary/80" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processando...</> : "Solicitar Acesso"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full h-12 font-bold gap-2 hover:bg-primary/5 rounded-xl transition-all" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" /> Voltar para o Login
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </FadeIn>
      
      <div className="relative w-full max-w-md px-4 mt-6 text-center pointer-events-none z-10">
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5, duration: 1 }}
          className="text-[11px] leading-relaxed text-muted-foreground/50 max-w-md mx-auto font-medium"
        >
          Este sistema é propriedade intelectual exclusiva da <span className="text-foreground/70 font-bold uppercase tracking-wider">Brasil Marcas</span>.
          <br />
          Protegido pela Lei nº 9.609/98. Uso estritamente profissional e autorizado.
          <br />
          <span className="font-black mt-2 inline-block text-[12px] text-primary/60 tracking-widest uppercase">
            © 2026 LogiFlow • Rumo à Excelência 10/10
          </span>
        </motion.p>
      </div>
    </div>
  );
}
