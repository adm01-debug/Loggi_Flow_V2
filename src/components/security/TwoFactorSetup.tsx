import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/ui/use-toast";
import { useAuth } from "@/hooks/auth/useAuth";
import { 
  Shield, 
  ShieldCheck, 
  ShieldOff, 
  Loader2, 
  QrCode,
  Copy,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface TwoFactorSetupProps {
  onStatusChange?: () => void;
}

export function TwoFactorSetup({ onStatusChange }: TwoFactorSetupProps) {
  const [isEnabling, setIsEnabling] = useState(false);
  const [, setIsDisabling] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [copied, setCopied] = useState(false);

  const { toast } = useToast();

  // Check MFA status on mount
  useState(() => {
    checkMfaStatus();
  });

  const checkMfaStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const totpFactors = data.totp || [];
      const verifiedFactor = totpFactors.find(f => f.status === 'verified');
      setMfaEnabled(!!verifiedFactor);
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
      }
    } catch {
      // Error handled by MFA hook
    }
  };

  const handleEnableMfa = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'LogiFlow Authenticator'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setIsEnabling(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao configurar 2FA",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAndEnable = async () => {
    if (!factorId || verificationCode.length !== 6) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verificationCode,
      });

      if (error) throw error;

      setMfaEnabled(true);
      setIsEnabling(false);
      setVerificationCode("");
      toast({ title: "2FA ativado com sucesso!" });
      onStatusChange?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Código inválido";
      toast({
        title: "Código inválido",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!factorId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) throw error;

      setMfaEnabled(false);
      setFactorId(null);
      setShowDisableDialog(false);
      toast({ title: "2FA desativado" });
      onStatusChange?.();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao desativar 2FA",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação de Dois Fatores (2FA)
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta usando um aplicativo autenticador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              {mfaEnabled ? (
                <div className="p-2 rounded-full bg-success/10">
                  <ShieldCheck className="h-6 w-6 text-success" />
                </div>
              ) : (
                <div className="p-2 rounded-full bg-warning/10">
                  <ShieldOff className="h-6 w-6 text-warning" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {mfaEnabled ? "2FA Ativado" : "2FA Desativado"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {mfaEnabled 
                    ? "Sua conta está protegida com autenticação de dois fatores"
                    : "Ative para aumentar a segurança da sua conta"
                  }
                </p>
              </div>
            </div>
            
            {mfaEnabled ? (
              <Button 
                variant="outline" 
                onClick={() => setShowDisableDialog(true)}
                className="text-destructive hover:text-destructive"
              >
                Desativar
              </Button>
            ) : (
              <Button onClick={handleEnableMfa} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Configurando...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Ativar 2FA
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Aplicativos recomendados:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Google Authenticator</li>
              <li>Microsoft Authenticator</li>
              <li>Authy</li>
              <li>1Password</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Enable 2FA Dialog */}
      <Dialog open={isEnabling} onOpenChange={setIsEnabling}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Configurar 2FA
            </DialogTitle>
            <DialogDescription>
              Escaneie o QR code com seu aplicativo autenticador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code para 2FA" className="w-48 h-48" />
              </div>
            )}

            {secret && (
              <div className="space-y-2">
                <Label>Ou insira este código manualmente:</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    value={secret} 
                    readOnly 
                    className="font-mono text-xs"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={copySecret}
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Digite o código de verificação:</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={verificationCode}
                  onChange={setVerificationCode}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEnabling(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleVerifyAndEnable}
              disabled={verificationCode.length !== 6 || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar e Ativar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA Confirmation */}
      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Desativar 2FA
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar a autenticação de dois fatores?
              <br /><br />
              Isso tornará sua conta menos segura e você perderá a proteção adicional contra acessos não autorizados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisableMfa}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Desativando...
                </>
              ) : (
                "Desativar 2FA"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
