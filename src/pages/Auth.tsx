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
import { Box, Loader2, Mail, Lock, User, ArrowLeft, Shield, Eye, EyeOff, Clock } from "lucide-react";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";

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

// Validate login with IP check
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
      body: {
        email,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
      },
    });

    if (error) {
      console.error("Error validating login:", error);
      // Allow login if validation service fails
      return { allowed: true };
    }

    return data as ValidateLoginResult;
  } catch (err) {
    console.error("Error calling validate-login:", err);
    return { allowed: true };
  }
}

// Log login attempt
async function logLoginAttempt(email: string, ipAddress: string | null, success: boolean, failureReason?: string): Promise<void> {
  try {
    await supabase.functions.invoke("log-login-attempt", {
      body: {
        email,
        ip_address: ipAddress,
        user_agent: navigator.userAgent,
        success,
        failure_reason: failureReason,
      },
    });
  } catch (err) {
    console.error("Error logging login attempt:", err);
  }
}

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, "Senha deve conter pelo menos um caractere especial"),
  fullName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

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
  
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch client IP on mount
  useEffect(() => {
    getClientIP().then(setClientIP);
  }, []);

  // Countdown timer for lockout
  useEffect(() => {
    if (!lockoutEndsAt) return;

    const updateRemaining = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.ceil((lockoutEndsAt.getTime() - now.getTime()) / 1000));
      setLockoutRemaining(remaining);
      
      if (remaining <= 0) {
        setIpBlocked(null);
        setLockoutEndsAt(null);
      }
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, [lockoutEndsAt]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIpBlocked(null);

    const validation = loginSchema.safeParse({ email: loginEmail, password: loginPassword });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[`login_${err.path[0]}`] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    // Step 1: Validate IP before attempting login
    const ipValidation = await validateLoginIP(loginEmail, clientIP);
    
    if (!ipValidation.allowed) {
      setIsLoading(false);
      setIpBlocked(ipValidation.reason || "Acesso bloqueado");
      
      // Set lockout timer if provided
      if (ipValidation.lockout_ends_at) {
        setLockoutEndsAt(new Date(ipValidation.lockout_ends_at));
      }
      
      toast({
        title: "Acesso Bloqueado",
        description: ipValidation.reason || "Seu IP foi bloqueado.",
        variant: "destructive",
      });
      return;
    }

    // Step 2: Attempt login
    const { error } = await signIn(loginEmail, loginPassword);
    
    if (error) {
      // Log failed attempt
      await logLoginAttempt(loginEmail, clientIP, false, error.message);
      
      setIsLoading(false);
      if (error.message.includes("Invalid login credentials")) {
        toast({
          title: "Credenciais inválidas",
          description: "Email ou senha incorretos. Verifique e tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao fazer login",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      // Log successful attempt
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

    // Check if password is pwned
    if (isPasswordPwned) {
      toast({
        title: "Senha comprometida",
        description: "Esta senha foi encontrada em vazamentos de dados. Escolha outra senha mais segura.",
        variant: "destructive",
      });
      return;
    }

    const validation = signupSchema.safeParse({
      email: signupEmail,
      password: signupPassword,
      fullName: signupFullName,
    });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[`signup_${err.path[0]}`] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName);
    setIsLoading(false);

    if (error) {
      if (error.message.includes("User already registered")) {
        toast({
          title: "Usuário já cadastrado",
          description: "Este email já está em uso. Tente fazer login.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao criar conta",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({ title: "Conta criada com sucesso! Você já pode fazer login." });
      navigate("/");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = forgotPasswordSchema.safeParse({ email: forgotEmail });
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[`forgot_${err.path[0]}`] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);

    // Create a password reset request instead of sending email directly
    const { error } = await supabase
      .from("password_reset_requests")
      .insert({
        email: forgotEmail,
        status: "pending",
        requested_at: new Date().toISOString(),
      });

    setIsLoading(false);

    if (error) {
      toast({
        title: "Erro ao solicitar reset",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setForgotPasswordSent(true);
      toast({ 
        title: "Solicitação enviada!", 
        description: "Aguarde a aprovação do gestor para receber o link de recuperação." 
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Forgot Password View
  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
        <Card className="w-full max-w-md shadow-xl border-border/50">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-primary glow-primary">
              <Mail className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <CardTitle className="text-2xl font-display">Esqueci Minha Senha</CardTitle>
              <CardDescription>
                {forgotPasswordSent 
                  ? "Solicitação enviada! Aguarde aprovação." 
                  : "Digite seu email para solicitar recuperação de senha"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {forgotPasswordSent ? (
              <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Sua solicitação foi enviada para <strong>{forgotEmail}</strong>.
                  <br /><br />
                  Um gestor precisa aprovar a solicitação antes que você receba o email de recuperação.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={() => {
                    setShowForgotPassword(false);
                    setForgotPasswordSent(false);
                    setForgotEmail("");
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.forgot_email && (
                    <p className="text-sm text-destructive">{errors.forgot_email}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Enviar Link de Recuperação"
                  )}
                </Button>

                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full" 
                  onClick={() => setShowForgotPassword(false)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar para Login
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-border/50">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-2xl bg-primary glow-primary">
            <Box className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-display">LogiFlow</CardTitle>
            <CardDescription>Logística Gamificada</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-6">
              {ipBlocked && (
                <Alert variant="destructive">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p>{ipBlocked}</p>
                      {lockoutRemaining > 0 && (
                        <div className="flex items-center gap-2 mt-2 text-sm font-medium">
                          <Clock className="h-4 w-4 animate-pulse" />
                          <span>
                            Tempo restante: {Math.floor(lockoutRemaining / 60)}:{String(lockoutRemaining % 60).padStart(2, '0')}
                          </span>
                        </div>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.login_email && (
                    <p className="text-sm text-destructive">{errors.login_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Senha</Label>
                    <Button
                      type="button"
                      variant="link"
                      className="px-0 h-auto font-normal text-xs text-muted-foreground hover:text-primary"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Esqueci minha senha
                    </Button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.login_password && (
                    <p className="text-sm text-destructive">{errors.login_password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="Seu nome"
                      value={signupFullName}
                      onChange={(e) => setSignupFullName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.signup_fullName && (
                    <p className="text-sm text-destructive">{errors.signup_fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {errors.signup_email && (
                    <p className="text-sm text-destructive">{errors.signup_email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="Mínimo 8 caracteres"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                    >
                      {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  <PasswordStrengthIndicator 
                    password={signupPassword} 
                    onStrengthChange={handlePasswordStrengthChange}
                  />
                  {errors.signup_password && (
                    <p className="text-sm text-destructive">{errors.signup_password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar Conta"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}