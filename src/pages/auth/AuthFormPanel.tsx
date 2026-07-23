/* eslint-disable max-lines */
import { motion } from "framer-motion";
import {
  Truck,
  Loader2,
  Mail,
  Lock,
  User,
  Shield,
  Eye,
  EyeOff,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthIndicator } from "@/components/auth/PasswordStrengthIndicator";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/ui/micro-interactions";
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
  activeTab,
  setActiveTab,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  showLoginPassword,
  setShowLoginPassword,
  signupEmail,
  setSignupEmail,
  signupPassword,
  setSignupPassword,
  signupFullName,
  setSignupFullName,
  showSignupPassword,
  setShowSignupPassword,
  isLoading,
  errors,
  ipBlocked,
  lockoutRemaining,
  handleLogin,
  handleSignup,
  onForgotPassword,
  onPasswordStrengthChange,
}: AuthFormPanelProps) {
  return (
    <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col items-center justify-center gap-4 p-4 sm:p-6 md:p-8 relative z-10 min-h-[100dvh]">
      <FadeIn direction="up" duration={0.6} className="w-full max-w-md">
        <Card className="shadow-[0_20px_80px_rgba(0,0,0,0.5)] border-primary/20 backdrop-blur-3xl bg-black/90 overflow-hidden mx-auto rounded-[2.5rem]">
          {/* Mobile logo */}
          <div className="lg:hidden text-center pt-8 pb-4">
            <div className="inline-flex items-center gap-3">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 flex items-center justify-center shadow-[0_8px_20px_rgba(var(--primary-rgb),0.4)]"
              >
                <Truck className="w-6 h-6 text-white" />
              </motion.div>
              <span className="font-display text-2xl font-black italic tracking-tighter uppercase">
                LogiFlow
              </span>
            </div>
          </div>

          <CardHeader className="text-center space-y-3 pt-6 lg:pt-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CardTitle className="text-3xl font-black italic tracking-tighter uppercase text-white leading-none">
                {activeTab === "login" ? "Acesso ao Hub" : "Ingressar na Rede"}
              </CardTitle>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <CardDescription className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70">
                {activeTab === "login"
                  ? "Central de Comando Nexus"
                  : "Protocolo de Expansão Ativo"}
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="relative z-10 pb-10 px-8">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-auto p-1.5 bg-sidebar-accent/50 rounded-2xl border border-white/5 mb-8">
                <TabsTrigger
                  value="login"
                  className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[11px] transition-all"
                >
                  Entrar
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-xl py-3 data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[11px] transition-all"
                >
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
                                <span>
                                  Tempo restante:{" "}
                                  {Math.floor(lockoutRemaining / 60)}:
                                  {String(lockoutRemaining % 60).padStart(
                                    2,
                                    "0",
                                  )}
                                </span>
                              </div>
                            )}
                          </AlertDescription>
                        </Alert>
                      </StaggerItem>
                    )}
                    <form onSubmit={handleLogin} className="space-y-4">
                      <StaggerItem>
                        <div className="space-y-3">
                          <Label
                            htmlFor="login-email"
                            className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 ml-1"
                          >
                            Protocolo_Email
                          </Label>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                              id="login-email"
                              type="email"
                              placeholder="seu@email.com"
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                            />
                          </div>
                          {errors.login_email && (
                            <p className="text-[10px] font-black uppercase text-destructive tracking-widest mt-1 ml-1">
                              {errors.login_email}
                            </p>
                          )}
                        </div>
                      </StaggerItem>
                      <StaggerItem>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between px-1">
                            <Label
                              htmlFor="login-password"
                              className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40"
                            >
                              Código_Acesso
                            </Label>
                            <Button
                              type="button"
                              variant="link"
                              className="px-0 h-auto text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                              onClick={onForgotPassword}
                            >
                              Resetar Hub
                            </Button>
                          </div>
                          <div className="relative group">
                            <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                            <Input
                              id="login-password"
                              type={showLoginPassword ? "text" : "password"}
                              placeholder="••••••••"
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              className="pl-12 pr-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-white/5"
                              onClick={() =>
                                setShowLoginPassword(!showLoginPassword)
                              }
                            >
                              {showLoginPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </Button>
                          </div>
                          {errors.login_password && (
                            <p className="text-[10px] font-black uppercase text-destructive tracking-widest mt-1 ml-1">
                              {errors.login_password}
                            </p>
                          )}
                        </div>
                      </StaggerItem>
                      <StaggerItem>
                        <Button
                          type="submit"
                          className="w-full h-14 font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] hover:shadow-primary/50 transition-all hover:scale-[1.03] active:scale-[0.97] rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-3 h-5 w-5 animate-spin" />{" "}
                              SINCRONIZANDO...
                            </>
                          ) : (
                            "AUTORIZAR_ACESSO"
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
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-3">
                      <Label
                        htmlFor="signup-name"
                        className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 ml-1"
                      >
                        Protocolo_Identidade
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          id="signup-name"
                          placeholder="Nome do Comandante"
                          value={signupFullName}
                          onChange={(e) => setSignupFullName(e.target.value)}
                          className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                        />
                      </div>
                      {errors.signup_fullName && (
                        <p className="text-[10px] font-black uppercase text-destructive tracking-widest mt-1 ml-1">
                          {errors.signup_fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="signup-email"
                        className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 ml-1"
                      >
                        Hub_Email
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="seu@email.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                        />
                      </div>
                      {errors.signup_email && (
                        <p className="text-[10px] font-black uppercase text-destructive tracking-widest mt-1 ml-1">
                          {errors.signup_email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="signup-password"
                        className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 ml-1"
                      >
                        Senha_Segurança
                      </Label>
                      <div className="relative group">
                        <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          className="pl-12 pr-12 h-14 rounded-2xl bg-white/5 border-white/10 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 hover:bg-white/5"
                          onClick={() =>
                            setShowSignupPassword(!showSignupPassword)
                          }
                        >
                          {showSignupPassword ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </Button>
                      </div>
                      {errors.signup_password && (
                        <p className="text-[10px] font-black uppercase text-destructive tracking-widest mt-1 ml-1">
                          {errors.signup_password}
                        </p>
                      )}
                      <PasswordStrengthIndicator
                        password={signupPassword}
                        onStrengthChange={onPasswordStrengthChange}
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-14 font-black text-xs uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(var(--primary-rgb),0.3)] hover:shadow-primary/50 transition-all hover:scale-[1.03] active:scale-[0.97] rounded-2xl bg-gradient-to-r from-primary via-primary/90 to-primary/80"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-3 h-5 w-5 animate-spin" />{" "}
                          INICIALIZANDO...
                        </>
                      ) : (
                        "INJETAR_CONTA_REDE"
                      )}
                    </Button>
                    <SocialLoginButtons isLoading={isLoading} />
                  </form>
                </motion.div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </FadeIn>

      <div className="relative w-full max-w-md px-4 pb-6 mt-4 text-center pointer-events-none">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-[11px] leading-relaxed text-muted-foreground/50 max-w-md mx-auto font-medium"
        >
          Este sistema é propriedade intelectual exclusiva da{" "}
          <span className="text-foreground/70 font-bold uppercase tracking-wider">
            Brasil Marcas
          </span>
          .
          <br />
          Protegido pela Lei nº 9.609/98. Uso estritamente profissional e
          autorizado.
          <br />
          <span className="font-black mt-2 inline-block text-[12px] text-primary/60 tracking-widest uppercase">
            © 2026 LogiFlow • Rumo à Excelência 10/10
          </span>
        </motion.p>
      </div>
    </div>
  );
}
