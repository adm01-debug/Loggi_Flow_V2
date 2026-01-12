import { useState, useEffect } from "react";
import { useMFA } from "@/hooks/useMFA";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Smartphone, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface MFAEnrollProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function MFAEnroll({ onComplete, onCancel }: MFAEnrollProps) {
  const { startEnrollment, verifyEnrollment, enrollmentData, isLoading } = useMFA();
  const [verificationCode, setVerificationCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"start" | "verify">("start");

  useEffect(() => {
    if (enrollmentData) {
      setStep("verify");
    }
  }, [enrollmentData]);

  const handleStartEnrollment = async () => {
    try {
      await startEnrollment("LogiFlow Authenticator");
    } catch {
      // Error handled by useMFA hook
    }
  };

  const handleVerify = async () => {
    if (!enrollmentData || verificationCode.length !== 6) {
      toast.error("Digite um código de 6 dígitos");
      return;
    }

    try {
      await verifyEnrollment(enrollmentData.id, verificationCode);
      onComplete?.();
    } catch {
      // Error handled by useMFA hook
    }
  };

  const copySecret = async () => {
    if (enrollmentData?.totp.secret) {
      await navigator.clipboard.writeText(enrollmentData.totp.secret);
      setCopied(true);
      toast.success("Código copiado!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (step === "start") {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Configurar Autenticação 2FA</CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta usando um aplicativo autenticador.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>1. Baixe um aplicativo autenticador:</p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>Google Authenticator</li>
              <li>Microsoft Authenticator</li>
              <li>Authy</li>
              <li>1Password</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleStartEnrollment} 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continuar
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Escaneie o QR Code</CardTitle>
        <CardDescription>
          Use seu aplicativo autenticador para escanear o código abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {enrollmentData?.totp.qr_code && (
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg">
              <img 
                src={enrollmentData.totp.qr_code} 
                alt="QR Code para 2FA"
                className="w-48 h-48"
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Ou digite o código manualmente:
          </Label>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
              {enrollmentData?.totp.secret}
            </code>
            <Button variant="outline" size="icon" onClick={copySecret}>
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="code">Código de Verificação</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
            className="text-center text-2xl tracking-widest"
          />
          <p className="text-xs text-muted-foreground text-center">
            Digite o código de 6 dígitos do seu aplicativo
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={handleVerify} 
            disabled={isLoading || verificationCode.length !== 6}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar e Ativar
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
