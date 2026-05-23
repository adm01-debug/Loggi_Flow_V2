import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/auth/useAuth";
import { useToast } from "@/hooks/ui/use-toast";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedBackground, AuthHeroSection } from "./auth/AuthHeroSection";
import { AuthFormPanel } from "./auth/AuthFormPanel";
import { AuthForgotPassword } from "./auth/AuthForgotPassword";
import { getClientIP, validateLoginIP, logLoginAttempt, loginSchema, signupSchema } from "./auth/authUtils";

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupFullName, setSignupFullName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [ipBlocked, setIpBlocked] = useState<string | null>(null);
  const [lockoutEndsAt, setLockoutEndsAt] = useState<Date | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);
  const [clientIP, setClientIP] = useState<string | null>(null);
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

  const handlePasswordStrengthChange = (_isStrong: boolean, isPwned: boolean) => {
    setIsPasswordPwned(isPwned);
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

  if (showForgotPassword) {
    return <AuthForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-background relative overflow-hidden">
      <AnimatedBackground />
      <AuthHeroSection />
      <AuthFormPanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        showLoginPassword={showLoginPassword}
        setShowLoginPassword={setShowLoginPassword}
        signupEmail={signupEmail}
        setSignupEmail={setSignupEmail}
        signupPassword={signupPassword}
        setSignupPassword={setSignupPassword}
        signupFullName={signupFullName}
        setSignupFullName={setSignupFullName}
        showSignupPassword={showSignupPassword}
        setShowSignupPassword={setShowSignupPassword}
        isLoading={isLoading}
        errors={errors}
        ipBlocked={ipBlocked}
        lockoutRemaining={lockoutRemaining}
        handleLogin={handleLogin}
        handleSignup={handleSignup}
        onForgotPassword={() => setShowForgotPassword(true)}
        onPasswordStrengthChange={handlePasswordStrengthChange}
      />
    </div>
  );
}
