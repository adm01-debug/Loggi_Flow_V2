import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/ui/micro-interactions";
import { AnimatedBackground } from "./AuthHeroSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
      validation.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[`forgot_${err.path[0]}`] = err.message; });
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
      <FadeIn>
        <Card className="w-full max-w-md shadow-2xl border-border/50 backdrop-blur-xl bg-card/95">
          <CardHeader className="text-center space-y-4">
            <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }} className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-display">Recuperar Senha</CardTitle>
              <CardDescription>{forgotPasswordSent ? "Solicitação enviada!" : "Digite seu email cadastrado"}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {forgotPasswordSent ? (
                <motion.div key="sent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </motion.div>
                  <p className="text-center text-muted-foreground">Sua solicitação foi enviada para <strong className="text-foreground">{forgotEmail}</strong>. Aguarde aprovação.</p>
                  <Button variant="outline" className="w-full" onClick={() => { onBack(); setForgotPasswordSent(false); setForgotEmail(""); }}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
                  </Button>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                      <Input id="forgot-email" type="email" placeholder="seu@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10 h-12" />
                    </div>
                    {errors.forgot_email && <p className="text-sm text-destructive">{errors.forgot_email}</p>}
                  </div>
                  <Button type="submit" className="w-full h-12 font-semibold" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Enviar Solicitação"}
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={onBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </FadeIn>
      
      <div className="absolute bottom-4 left-0 right-0 px-8 text-center pointer-events-none">
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5, duration: 1 }}
          className="text-[10px] leading-relaxed text-muted-foreground/60 max-w-sm mx-auto"
        >
          Este sistema é propriedade intelectual exclusiva da Brasil Marcas, sendo protegido pela Lei nº 9.609/98 e demais normas aplicáveis. É proibida sua reprodução, cópia, modificação, distribuição ou uso não autorizado.
          <br />
          <span className="font-medium mt-1 inline-block">
            © 2026 LogiFlow Todos os direitos reservados.
          </span>
        </motion.p>
      </div>
    </div>
  );
}
