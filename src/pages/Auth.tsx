import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Box, Loader2, Mail, Lock, User, ArrowLeft, Shield, Eye, EyeOff, Clock, 
  Truck, Package, MapPin, Star, TrendingUp, Users, CheckCircle2, Zap, 
  BarChart3, Award, ArrowRight, Play, ShieldCheck, Globe, ChevronLeft, ChevronRight
} from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn, Floating, StaggerContainer, StaggerItem } from "@/components/ui/micro-interactions";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Helper to get client IP
async function getClientIP(): Promise<string | null> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || null;
  } catch {
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

// Feature highlights for hero section
const features = [
  { icon: TrendingUp, title: "Otimize Operações", description: "Reduza custos em até 30%" },
  { icon: Zap, title: "Tempo Real", description: "Rastreamento instantâneo" },
  { icon: Award, title: "Gamificação", description: "Engaje sua equipe" },
  { icon: BarChart3, title: "Analytics", description: "Insights poderosos" },
];

// Testimonials - Expanded
const testimonials = [
  { 
    name: "Carlos Silva", 
    role: "Gerente de Logística", 
    company: "TransLog BR",
    avatar: "CS",
    content: "Reduzimos 40% do tempo de gestão com o LogiFlow. A gamificação transformou nossa equipe!",
    rating: 5,
    image: "/placeholder.svg"
  },
  { 
    name: "Ana Beatriz", 
    role: "Diretora de Operações", 
    company: "Express Cargo",
    avatar: "AB",
    content: "A visibilidade em tempo real mudou completamente nossa operação. Recomendo demais!",
    rating: 5,
    image: "/placeholder.svg"
  },
  { 
    name: "Roberto Mendes", 
    role: "CEO", 
    company: "FastShip",
    avatar: "RM",
    content: "ROI positivo em 3 meses. A melhor decisão que tomamos para nossa logística.",
    rating: 5,
    image: "/placeholder.svg"
  },
  { 
    name: "Fernanda Costa", 
    role: "Coordenadora", 
    company: "LogiMaster",
    avatar: "FC",
    content: "Interface intuitiva e relatórios detalhados. Perfeito para gestão de frotas!",
    rating: 5,
    image: "/placeholder.svg"
  },
  { 
    name: "Pedro Santos", 
    role: "Diretor de TI", 
    company: "RápidoLog",
    avatar: "PS",
    content: "Integração perfeita com nossos sistemas. Suporte excepcional!",
    rating: 5,
    image: "/placeholder.svg"
  },
];

// Stats with numeric values for animation
const stats = [
  { value: 10000, label: "Entregas/mês", prefix: "", suffix: "+" },
  { value: 98.5, label: "Satisfação", prefix: "", suffix: "%", decimals: 1 },
  { value: 150, label: "Empresas", prefix: "", suffix: "+" },
  { value: 35, label: "Redução Custos", prefix: "-", suffix: "%" },
];

// Trust badges / Customer logos
const trustBadges = [
  { name: "ISO 27001", icon: ShieldCheck },
  { name: "LGPD Compliant", icon: Shield },
  { name: "99.9% Uptime", icon: Globe },
  { name: "Suporte 24/7", icon: Users },
];

// Animated Background
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <motion.div 
        className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
        style={{ 
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          top: "-20%",
          right: "-10%"
        }}
        animate={{ 
          scale: [1, 1.1, 1],
          x: [0, 20, 0],
          y: [0, -20, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
        style={{ 
          background: "radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)",
          bottom: "-15%",
          left: "-5%"
        }}
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, -15, 0],
          y: [0, 15, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating icons */}
      {[...Array(8)].map((_, i) => (
        <Floating key={i} duration={4 + i * 0.5} distance={20 + i * 3}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.07 }}
            transition={{ delay: i * 0.15 }}
            className="absolute"
            style={{
              left: `${5 + i * 12}%`,
              top: `${15 + (i % 4) * 20}%`,
            }}
          >
            {i % 4 === 0 && <Truck className="w-10 h-10 text-primary" />}
            {i % 4 === 1 && <Package className="w-8 h-8 text-primary" />}
            {i % 4 === 2 && <MapPin className="w-9 h-9 text-primary" />}
            {i % 4 === 3 && <Box className="w-7 h-7 text-primary" />}
          </motion.div>
        </Floating>
      ))}

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: "60px 60px"
        }}
      />
    </div>
  );
}

// Enhanced Testimonial Card with hover effects
function TestimonialCard({ testimonial, isActive }: { testimonial: typeof testimonials[0]; isActive?: boolean }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5 }}
      className={`bg-card/60 backdrop-blur-md border rounded-2xl p-6 transition-all duration-300 h-full
        ${isActive ? 'border-primary/50 shadow-lg shadow-primary/10' : 'border-border/50 hover:border-primary/30'}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg"
        >
          {testimonial.avatar}
        </motion.div>
        <div className="flex-1">
          <p className="font-semibold">{testimonial.name}</p>
          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
          <p className="text-xs text-primary font-medium">{testimonial.company}</p>
        </div>
      </div>
      <p className="text-muted-foreground leading-relaxed mb-4 italic">"{testimonial.content}"</p>
      <div className="flex gap-1">
        {[...Array(testimonial.rating)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.1, type: "spring" }}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Animated Stat Card
function StatCard({ stat, index }: { stat: typeof stats[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 800 + index * 200);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <motion.div 
      className="text-center group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 + index * 0.15 }}
      whileHover={{ scale: 1.05 }}
    >
      <div className="text-2xl xl:text-3xl font-display font-bold gradient-text tabular-nums">
        {isVisible ? (
          <AnimatedNumber 
            value={stat.value} 
            prefix={stat.prefix}
            suffix={stat.suffix}
            duration={1.5}
            formatValue={(v) => stat.decimals ? v.toFixed(stat.decimals) : v.toLocaleString('pt-BR')}
          />
        ) : (
          <span className="opacity-0">{stat.prefix}0{stat.suffix}</span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1 group-hover:text-foreground transition-colors">{stat.label}</p>
    </motion.div>
  );
}

// Trust Badge Component
function TrustBadge({ badge, index }: { badge: typeof trustBadges[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.5 + index * 0.1 }}
      whileHover={{ scale: 1.1, y: -2 }}
      className="flex items-center gap-2 px-3 py-2 rounded-full bg-card/50 border border-border/50 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all cursor-default"
    >
      <badge.icon className="w-3.5 h-3.5 text-primary" />
      <span>{badge.name}</span>
    </motion.div>
  );
}

// Demo Video Preview
function DemoPreview() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.3 }}
      className="relative mt-8"
    >
      <motion.div 
        className="relative rounded-xl overflow-hidden border border-border/50 bg-card/30 backdrop-blur-sm cursor-pointer group"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.02 }}
      >
        <div className="aspect-video bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
          <motion.div
            animate={{ scale: isHovered ? 1.1 : 1 }}
            className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30"
          >
            <Play className="w-7 h-7 text-primary-foreground ml-1" />
          </motion.div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <p className="font-medium text-sm">Veja o LogiFlow em ação</p>
          <p className="text-xs text-muted-foreground">Tour de 2 minutos pela plataforma</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Social Login Buttons
function SocialLoginButtons({ isLoading }: { isLoading: boolean }) {
  const [socialLoading, setSocialLoading] = useState(false);
  const { toast: socialToast } = useToast();

  const handleGoogleLogin = async () => {
    try {
      setSocialLoading(true);
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) {
        socialToast({
          title: "Erro ao entrar com Google",
          description: error.message || "Tente novamente",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      socialToast({
        title: "Erro ao entrar com Google",
        description: err.message || "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setSocialLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Ou continue com</span>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full h-11 hover:bg-muted/50 transition-all hover:scale-[1.02] active:scale-[0.98] gap-3"
        onClick={handleGoogleLogin}
        disabled={isLoading || socialLoading}
      >
        {socialLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        Entrar com Google
      </Button>
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
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { getClientIP().then(setClientIP); }, []);

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </motion.div>
      </div>
    );
  }

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background p-4 relative overflow-hidden">
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
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring" }} className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </motion.div>
                    <p className="text-center text-muted-foreground">Sua solicitação foi enviada para <strong className="text-foreground">{forgotEmail}</strong>. Aguarde aprovação.</p>
                    <Button variant="outline" className="w-full" onClick={() => { setShowForgotPassword(false); setForgotPasswordSent(false); setForgotEmail(""); }}>
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

  // Main Auth Page - Split Layout
  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-background relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-8 xl:p-12 relative z-10">
        {/* Logo and tagline */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-2">
            <motion.div 
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.05 }}
              transition={{ duration: 0.5 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/30"
            >
              <Box className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <span className="font-display text-2xl font-bold">LogiFlow</span>
          </div>
          <p className="text-muted-foreground">Logística Gamificada • Resultados Reais</p>
        </motion.div>

        {/* Hero Content */}
        <div className="flex-1 flex flex-col justify-center max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="space-y-6"
          >
            <h1 className="text-4xl xl:text-5xl font-display font-bold leading-tight">
              Transforme sua <span className="gradient-text">logística</span> em uma experiência <span className="gradient-text">gamificada</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Aumente a produtividade da sua equipe em até 40% com rastreamento em tempo real, 
              analytics avançados e sistema de recompensas que motiva e engaja.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card/30 border border-border/30 hover:border-primary/30 transition-all cursor-default"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <feature.icon className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Animated Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex gap-8 pt-10"
          >
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} />
            ))}
          </motion.div>

          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="flex flex-wrap gap-2 pt-8"
          >
            {trustBadges.map((badge, i) => (
              <TrustBadge key={badge.name} badge={badge} index={i} />
            ))}
          </motion.div>
        </div>

        {/* Testimonials Carousel */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>O que nossos clientes dizem</span>
            </div>
            <div className="flex gap-1">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentTestimonial(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentTestimonial ? 'bg-primary w-4' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-1"
              >
                <TestimonialCard 
                  testimonial={testimonials[currentTestimonial]} 
                  isActive={true}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10 min-h-[100dvh] lg:min-h-0">
        <FadeIn direction="up" duration={0.6} className="w-full max-w-md">
          <Card className="shadow-2xl border-border/50 backdrop-blur-xl bg-card/95 overflow-hidden mx-auto">
            {/* Mobile logo */}
            <div className="lg:hidden text-center pt-6 pb-2">
              <div className="inline-flex items-center gap-2 mb-1">
                <motion.div 
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/30"
                >
                  <Box className="w-5 h-5 text-primary-foreground" />
                </motion.div>
                <span className="font-display text-xl font-bold">LogiFlow</span>
              </div>
            </div>

            <CardHeader className="text-center space-y-2 pt-4 lg:pt-8">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <CardTitle className="text-2xl font-display">
                  {activeTab === "login" ? "Bem-vindo de volta!" : "Crie sua conta"}
                </CardTitle>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                <CardDescription>
                  {activeTab === "login" 
                    ? "Entre para acessar seu dashboard" 
                    : "Comece a otimizar sua logística hoje"}
                </CardDescription>
              </motion.div>
            </CardHeader>
            
            <CardContent className="relative z-10 pb-8">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 h-11">
                  <TabsTrigger value="login" className="text-sm font-medium data-[state=active]:shadow-md transition-all">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="signup" className="text-sm font-medium data-[state=active]:shadow-md transition-all">
                    Criar Conta
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login" className="mt-0">
                  <motion.div 
                    key={`tab-login-${activeTab}`}
                    initial={{ opacity: 0, x: activeTab === "login" ? 0 : -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.2 }}
                  >
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
                                <Input 
                                  id="login-email" 
                                  type="email" 
                                  placeholder="seu@email.com" 
                                  value={loginEmail} 
                                  onChange={(e) => setLoginEmail(e.target.value)} 
                                  className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20" 
                                />
                              </div>
                              {errors.login_email && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive">{errors.login_email}</motion.p>}
                            </div>
                          </StaggerItem>
                          <StaggerItem>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="login-password">Senha</Label>
                                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-xs text-primary hover:underline hover:text-primary/80 transition-colors">
                                  Esqueceu a senha?
                                </button>
                              </div>
                              <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input 
                                  id="login-password" 
                                  type={showLoginPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  value={loginPassword} 
                                  onChange={(e) => setLoginPassword(e.target.value)} 
                                  className="pl-10 pr-10 h-11 transition-all focus:ring-2 focus:ring-primary/20" 
                                />
                                <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                              {errors.login_password && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive">{errors.login_password}</motion.p>}
                            </div>
                          </StaggerItem>
                          <StaggerItem>
                            <Button 
                              type="submit" 
                              className="w-full h-11 font-semibold text-base group relative overflow-hidden" 
                              disabled={isLoading || !!ipBlocked}
                            >
                              <motion.span
                                className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0"
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "100%" }}
                                transition={{ duration: 0.6 }}
                              />
                              {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...</>
                              ) : (
                                <>
                                  Entrar
                                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                              )}
                            </Button>
                          </StaggerItem>
                        </form>
                        
                        <StaggerItem>
                          <SocialLoginButtons isLoading={isLoading} />
                        </StaggerItem>
                      </StaggerContainer>
                    </motion.div>
                  </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <motion.div 
                    key={`tab-signup-${activeTab}`}
                    initial={{ opacity: 0, x: activeTab === "signup" ? 0 : 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.2 }}
                  >
                      <form onSubmit={handleSignup}>
                        <StaggerContainer className="space-y-4" staggerDelay={0.05}>
                          <StaggerItem>
                            <div className="space-y-2">
                              <Label htmlFor="signup-name">Nome Completo</Label>
                              <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input 
                                  id="signup-name" 
                                  type="text" 
                                  placeholder="João Silva" 
                                  value={signupFullName} 
                                  onChange={(e) => setSignupFullName(e.target.value)} 
                                  className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20" 
                                />
                              </div>
                              {errors.signup_fullName && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive">{errors.signup_fullName}</motion.p>}
                            </div>
                          </StaggerItem>
                          <StaggerItem>
                            <div className="space-y-2">
                              <Label htmlFor="signup-email">Email</Label>
                              <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input 
                                  id="signup-email" 
                                  type="email" 
                                  placeholder="seu@email.com" 
                                  value={signupEmail} 
                                  onChange={(e) => setSignupEmail(e.target.value)} 
                                  className="pl-10 h-11 transition-all focus:ring-2 focus:ring-primary/20" 
                                />
                              </div>
                              {errors.signup_email && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive">{errors.signup_email}</motion.p>}
                            </div>
                          </StaggerItem>
                          <StaggerItem>
                            <div className="space-y-2">
                              <Label htmlFor="signup-password">Senha</Label>
                              <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                                <Input 
                                  id="signup-password" 
                                  type={showSignupPassword ? "text" : "password"} 
                                  placeholder="••••••••" 
                                  value={signupPassword} 
                                  onChange={(e) => setSignupPassword(e.target.value)} 
                                  className="pl-10 pr-10 h-11 transition-all focus:ring-2 focus:ring-primary/20" 
                                />
                                <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                                  {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                              {errors.signup_password && <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive">{errors.signup_password}</motion.p>}
                              <PasswordStrengthIndicator password={signupPassword} onStrengthChange={handlePasswordStrengthChange} />
                            </div>
                          </StaggerItem>
                          <StaggerItem>
                            <Button 
                              type="submit" 
                              className="w-full h-11 font-semibold text-base group relative overflow-hidden" 
                              disabled={isLoading || isPasswordPwned}
                            >
                              <motion.span
                                className="absolute inset-0 bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/10 to-primary-foreground/0"
                                initial={{ x: "-100%" }}
                                whileHover={{ x: "100%" }}
                                transition={{ duration: 0.6 }}
                              />
                              {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando conta...</>
                              ) : (
                                <>
                                  Criar Conta Grátis
                                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                </>
                              )}
                            </Button>
                          </StaggerItem>
                          
                          <StaggerItem>
                            <SocialLoginButtons isLoading={isLoading} />
                          </StaggerItem>
                          
                          <StaggerItem>
                            <p className="text-xs text-center text-muted-foreground">
                              Ao criar uma conta, você concorda com nossos{" "}
                              <a href="#" className="text-primary hover:underline">Termos de Uso</a> e{" "}
                              <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
                            </p>
                          </StaggerItem>
                        </StaggerContainer>
                      </form>
                    </motion.div>
                  </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Mobile testimonial snippet */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="lg:hidden mt-6 text-center"
          >
            <div className="flex items-center justify-center gap-1 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Mais de <span className="font-semibold text-foreground">150 empresas</span> confiam no LogiFlow
            </p>
            
            {/* Mobile trust badges */}
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {trustBadges.slice(0, 2).map((badge, i) => (
                <div 
                  key={badge.name}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-card/50 border border-border/50 text-xs"
                >
                  <badge.icon className="w-3 h-3 text-primary" />
                  <span className="text-muted-foreground">{badge.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </FadeIn>
      </div>
    </div>
  );
}
