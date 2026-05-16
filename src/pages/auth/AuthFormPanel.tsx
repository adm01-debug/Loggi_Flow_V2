import { useState } from "react";
import { motion } from "framer-motion";
import { Box, Loader2, Mail, Lock, User, Shield, Eye, EyeOff, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/micro-interactions";
import { SocialLoginButtons } from "./SocialLoginButtons";

interface AuthFormPanelProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  // Login
  loginEmail: string;
  setLoginEmail: (v: string) => void;
  loginPassword: string;
  setLoginPassword: (v: string) => void;
  showLoginPassword: boolean;
  setShowLoginPassword: (v: boolean) => void;
  // Signup
  signupEmail: string;
  setSignupEmail: (v: string) => void;
  signupPassword: string;
  setSignupPassword: (v: string) => void;
  signupFullName: string;
  setSignupFullName: (v: string) => void;
  showSignupPassword: boolean;
  setShowSignupPassword: (v: boolean) => void;
  // State
  isLoading: boolean;
  errors: Record<string, string>;
  ipBlocked: string | null;
  lockoutRemaining: number;
  // Handlers
  handleLogin: (e: React.FormEvent) => void;
  handleSignup: (e: React.FormEvent) => void;
  onForgotPassword: () => void;
  onPasswordStrengthChange: (isStrong: boolean, isPwned: boolean) => void;
}

export function AuthFormPanel({
  activeTab, setActiveTab,
  loginEmail, setLoginEmail, loginPassword, setLoginPassword,
  showLoginPassword, setShowLoginPassword,
  signupEmail, setSignupEmail, signupPassword, setSignupPassword,
  signupFullName, setSignupFullName, showSignupPassword, setShowSignupPassword,
  isLoading, errors, ipBlocked, lockoutRemaining,
  handleLogin, handleSignup, onForgotPassword, onPasswordStrengthChange,
}: AuthFormPanelProps) {
  return (
    <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-4 sm:p-6 md:p-8 relative z-10 min-h-[100dvh] lg:min-h-0">
      <FadeIn direction="up" duration={0.6} className="w-full max-w-md">
        <Card className="shadow-2xl border-border/50 backdrop-blur-xl bg-card/95 overflow-hidden mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden text-center pt-6 pb-2">
            <div className="inline-flex items-center gap-2 mb-1">
              <motion.div whileHover={{ rotate: [0, -10, 10, 0] }} className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-md shadow-primary/30">
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
                {activeTab === "login" ? "Entre para acessar seu dashboard" : "Comece a otimizar sua logística hoje"}
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="relative z-10 pb-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 h-11">
                <TabsTrigger value="login" className="text-sm font-medium data-[state=active]:shadow-md transition-all">Entrar</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm font-medium data-[state=active]:shadow-md transition-all">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <motion.div key={`tab-login-${activeTab}`} initial={{ opacity: 0, x: activeTab === "login" ? 0 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
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
                            <Input id="login-email" type="email" placeholder="seu@email.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="pl-10 h-12" />
                          </div>
                          {errors.login_email && <p className="text-sm text-destructive">{errors.login_email}</p>}
                        </div>
                      </StaggerItem>
                      <StaggerItem>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="login-password">Senha</Label>
                            <Button type="button" variant="link" className="px-0 h-auto text-xs text-primary hover:text-primary/80" onClick={onForgotPassword}>Esqueceu a senha?</Button>
                          </div>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input id="login-password" type={showLoginPassword ? "text" : "password"} placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="pl-10 pr-10 h-12" />
                            <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                              {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          {errors.login_password && <p className="text-sm text-destructive">{errors.login_password}</p>}
                        </div>
                      </StaggerItem>
                      <StaggerItem>
                        <Button type="submit" className="w-full h-12 font-semibold text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
                          {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Entrando...</> : "Entrar"}
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
                <motion.div key={`tab-signup-${activeTab}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Nome completo</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input id="signup-name" placeholder="João Silva" value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} className="pl-10 h-12" />
                      </div>
                      {errors.signup_fullName && <p className="text-sm text-destructive">{errors.signup_fullName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input id="signup-email" type="email" placeholder="seu@email.com" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} className="pl-10 h-12" />
                      </div>
                      {errors.signup_email && <p className="text-sm text-destructive">{errors.signup_email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Senha</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input id="signup-password" type={showSignupPassword ? "text" : "password"} placeholder="••••••••" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} className="pl-10 pr-10 h-12" />
                        <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => setShowSignupPassword(!showSignupPassword)}>
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      {errors.signup_password && <p className="text-sm text-destructive">{errors.signup_password}</p>}
                      <PasswordStrengthIndicator password={signupPassword} onStrengthChange={onPasswordStrengthChange} />
                    </div>
                    <Button type="submit" className="w-full h-12 font-semibold text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Criando conta...</> : "Criar Conta Gratuita"}
                    </Button>
                    <SocialLoginButtons isLoading={isLoading} />
                  </form>
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </FadeIn>
      
      <div className="absolute bottom-4 left-0 right-0 px-8 text-center pointer-events-none">
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 1, duration: 1 }}
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
