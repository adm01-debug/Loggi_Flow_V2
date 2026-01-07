import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Box, Loader2, Mail, Lock, User, ArrowLeft, Shield, Eye, EyeOff, Clock, Truck, Package, MapPin } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, Floating, StaggerContainer, StaggerItem } from "@/components/ui/micro-interactions";

// Helper to get client IP using external service
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || null;
  } catch {
    console.warn("Could not fetch client IP");
    return null;
  }
}

interface ValidateLoginResult {
  allowed: boolean;
  reason?: string;
  lockout_ends_at?: string;
  remaining_seconds?: number;
  failure_count?: number;
}

async function validateLoginIP(email: string, ipAddress: string | null): Promise<ValidateLoginResult> {
  try {
    const { data, error } = await supabase.functions.invoke("validate-login", {
      body: { email, ip_address: ipAddress, user_agent: navigator.userAgent },
    });
    if (error) return { allowed: true };
    return data as ValidateLoginResult;
  } catch {
    return { allowed: true };
  }
}

async function logLoginAttempt(email: string, ipAddress: string | null, success: boolean, failureReason?: string): Promise<void> {
  try {
    await supabase.functions.invoke("log-login-attempt", {
      body: { email, ip_address: ipAddress, user_agent: navigator.userAgent, success, failure_reason: failureReason },
    });
  } catch {}
}

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres").regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Senha deve conter pelo menos um caractere especial"),
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

// Animated background particles
function BackgroundParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <Floating key={i} duration={3 + i * 0.5} distance={15 + i * 5}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            transition={{ delay: i * 0.2 }}
            className="absolute"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
          >
            {i % 3 === 0 && <Truck className="w-12 h-12 text-primary" />}
            {i % 3 === 1 && <Package className="w-10 h-10 text-primary" />}
            {i % 3 === 2 && <MapPin className="w-8 h-8 text-primary" />}
          </motion.div>
        </Floating>
      ))}
    </div>
  );
}

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [ipBlocked, setIpBlocked] = useState<string | null>(null);
  const [lockoutEndsAt, setLockoutEndsAt] = useState<Date | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [clientIP, setClientIP] = useState<string | null>(null);
  const [isPasswordStrong, setIsPasswordStrong] = useState(false);
  const [isPasswordPwned, setIsPasswordPwned] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { getClientIP().then(setClientIP); }, []);

  useEffect(() => {
    if (!lockoutEndsAt) return;
    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((lockoutEndsAt.getTime() - Date.now()) / 1000));
      setLockoutRemaining(remaining);
      if (remaining <= 0) { setIpBlocked(null); setLockoutEndsAt(null); }
    };
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndsAt]);

  useEffect(() => { if (!authLoading && user) navigate("/"); }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIpBlocked(null);

    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[`login_${err.path[0]}`] = err.message; });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const ipValidation = await validateLoginIP(loginEmail, clientIP);

    if (!ipValidation.allowed) {
      setIsLoading(false);
      setIpBlocked(ipValidation.reason || "Acesso bloqueado");
      if (ipValidation.lockout_ends_at) setLockoutEndsAt(new Date(ipValidation.lockout_ends_at));
      toast({ title: "Acesso Bloqueado", description: ipValidation.reason || "Seu IP foi bloqueado.", variant: "destructive" });
      return;
    }

    const { error } = await signIn(loginEmail, loginPassword);
    if (error) {
      await logLoginAttempt(loginEmail, clientIP, false, error.message);
      setIsLoading(false);
      toast({ title: "Credenciais inválidas", description: "Email ou senha incorretos.", variant: "destructive" });
    } else {
      await logLoginAttempt(loginEmail, clientIP, true);
      setIsLoading(false);
      toast({ title: "Login realizado com sucesso!" });
      navigate("/");
    }
  };

  const handlePasswordStrengthChange = (isStrong: boolean, isPwned: boolean) => {
    setIsPasswordStrong(isStrong);
    setIsPasswordPwned(isPwned);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (isPasswordPwned) {
      toast({ title: "Senha comprometida", description: "Esta senha foi encontrada em vazamentos.", variant: "destructive" });
      return;
    }

    const validation = signupSchema.safeParse({ email: signupEmail, password: signupPassword, fullName: signupFullName });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => { if (err.path[0]) fieldErrors[`signup_${err.path[0]}`] = err.message; });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setIsLoading(false);

    if (error) {
      toast({ title: error.message.includes("User already registered") ? "Usuário já cadastrado" : "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada com sucesso!" });
      navigate("/");
    }
  };

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative overflow-hidden">
        <BackgroundParticles />
        <FadeIn>
          <Card className="w-full max-w-md shadow-2xl border-border/50 backdrop-blur-xl bg-card/95">
            <CardHeader className="text-center space-y-4">
              <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }} className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/30">
                <Mail className="w-8 h-8 text-primary-foreground" />
              </motion.div>
              <div>
                <CardTitle className="text-2xl font-display">Esqueci Minha Senha</CardTitle>
                <CardDescription>{forgotPasswordSent ? "Solicitação enviada!" : "Digite seu email para recuperar"}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                {forgotPasswordSent ? (
                  <motion.div key="sent" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                      <Mail className="w-8 h-8 text-success" />
                    </motion.div>
                    <p className="text-center text-muted-foreground">Sua solicitação foi enviada para <strong>{forgotEmail}</strong>. Aguarde aprovação.</p>
                    <Button variant="outline" className="w-full" onClick={() => { setShowForgotPassword(false); setForgotPasswordSent(false); setForgotEmail(""); }}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="forgot-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="forgot-email" type="email" placeholder="seu@email.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="pl-10 h-12" />
                      </div>
                      {errors.forgot_email && <p className="text-sm text-destructive">{errors.forgot_email}</p>}
                    </div>
                    <Button type="submit" className="w-full h-12" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Enviar Link de Recuperação"}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => setShowForgotPassword(false)}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Login
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 relative overflow-hidden">
      <BackgroundParticles />
      
      <FadeIn direction="up" duration={0.6}>
        <Card className="w-full max-w-md shadow-2xl border-border/50 backdrop-blur-xl bg-card/95 overflow-hidden">
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-xl opacity-50">
            <div className="absolute inset-[-2px] rounded-xl bg-gradient-to-r from-primary/40 via-transparent to-primary/40 animate-shimmer" />
          </div>
          
          <CardHeader className="text-center space-y-4 relative z-10">
            <motion.div
              whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400 }}
              className="mx-auto flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 shadow-xl shadow-primary/40"
            >
              <Box className="w-10 h-10 text-primary-foreground" />
            </motion.div>
            <div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <CardTitle className="text-3xl font-display bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">LogiFlow</CardTitle>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <CardDescription className="text-base">Logística Gamificada</CardDescription>
              </motion.div>
            </div>
          </CardHeader>
          
          <CardContent className="relative z-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                <TabsTrigger value="login" className="text-base data-[state=active]:shadow-md transition-all">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="text-base data-[state=active]:shadow-md transition-all">Criar Conta</TabsTrigger>
              </TabsList>

              <AnimatePresence mode="wait">
                <TabsContent value="login" className="mt-0" asChild>
                  <motion.div key="login" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
                    <StaggerContainer className="space-y-4" staggerDelay={0.05}>
                      {ipBlocked && (
                        <StaggerItem>
                          <Alert variant="destructive">
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                              <p>{ipBlocked}</p>
                              {lockoutRemaining > 0 && (
                                <div className="flex items-center gap-2 mt-2 text-sm font-medium">
                                  <Clock className="h-4 w-4 animate-pulse" />
                                  <span>Tempo restante: {Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, '0')}</span>
                                </div>
                              )}
                            </AlertDescription>
                          </Alert>
                        </StaggerItem>
                      )}
                      <form onSubmit={handleLogin} className="space-y-4">
                        <StaggerItem>
                          <div className="space-y-2">
                            <Label htmlFor="login-email">Email</Label>
                            <div className="relative group">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                              <Input id="login-email" type="email" placeholder="seu@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10 h-12 transition-all focus:shadow-md focus:shadow-primary/10" />
                            </div>
                            {errors.login_email && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive">{errors.login_email}</motion.p>}
                          </div>
                        </StaggerItem>
                        <StaggerItem>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="login-password">Senha</Label>
                              <Button type="button" variant="link" className="px-0 h-auto text-xs text-muted-foreground hover:text-primary" onClick={() => setShowForgotPassword(true)}>Esqueci minha senha</Button>
                            </div>
                            <div className="relative group">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                              <Input id="login-password" type={showLoginPassword ? "text" : "password"} placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 pr-10 h-12 transition-all focus:shadow-md focus:shadow-primary/10" />
                              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                                {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            {errors.login_password && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive">{errors.login_password}</motion.p>}
                          </div>
                        </StaggerItem>
                        <StaggerItem>
                          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Entrando...</> : "Entrar"}
                          </Button>
                        </StaggerItem>
                      </form>
                    </StaggerContainer>
                  </motion.div>
                </TabsContent>

                <TabsContent value="signup" className="mt-0" asChild>
                  <motion.div key="signup" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                    <form onSubmit={handleSignup}>
                      <StaggerContainer className="space-y-4" staggerDelay={0.05}>
                        <StaggerItem>
                          <div className="space-y-2">
                            <Label htmlFor="signup-name">Nome Completo</Label>
                            <div className="relative group">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                              <Input id="signup-name" type="text" placeholder="Seu nome" value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} className="pl-10 h-12" />
                            </div>
                            {errors.signup_fullName && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive">{errors.signup_fullName}</motion.p>}
                          </div>
                        </StaggerItem>
                        <StaggerItem>
                          <div className="space-y-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <div className="relative group">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                              <Input id="signup-email" type="email" placeholder="seu@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-10 h-12" />
                            </div>
                            {errors.signup_email && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive">{errors.signup_email}</motion.p>}
                          </div>
                        </StaggerItem>
                        <StaggerItem>
                          <div className="space-y-2">
                            <Label htmlFor="signup-password">Senha</Label>
                            <div className="relative group">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                              <Input id="signup-password" type={showSignupPassword ? "text" : "password"} placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-10 pr-10 h-12" />
                              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowSignupPassword(!showSignupPassword)}>
                                {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            {errors.signup_password && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive">{errors.signup_password}</motion.p>}
                          </div>
                        </StaggerItem>
                        <StaggerItem>
                          <PasswordStrengthIndicator password={signupPassword} onStrengthChange={handlePasswordStrengthChange} />
                        </StaggerItem>
                        <StaggerItem>
                          <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading || !isPasswordStrong}>
                            {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Criando...</> : "Criar Conta"}
                          </Button>
                        </StaggerItem>
                      </StaggerContainer>
                    </form>
                  </motion.div>
                </TabsContent>
              </AnimatePresence>
            </Tabs>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
