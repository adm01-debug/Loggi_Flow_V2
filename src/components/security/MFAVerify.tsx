import { useState } from "react";
import { useMFA } from "@/hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, AlertTriangle } from "lucide-react";

interface MFAVerifyProps {
  factorId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  title?: string;
  description?: string;
}

export function MFAVerify({
  factorId,
  onSuccess,
  onCancel,
  title = "Verificação de Dois Fatores",
  description = "Digite o código do seu aplicativo autenticador para continuar.",
}: MFAVerifyProps) {
  const { verifyCode, isLoading } = useMFA();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("O código deve ter 6 dígitos");
      return;
    }

    setError(null);
    
    try {
      await verifyCode(factorId, code);
      onSuccess?.();
    } catch (err) {
      setAttempts((prev) => prev + 1);
      setError("Código inválido. Tente novamente.");
      setCode("");
      
      if (attempts >= 2) {
        setError("Múltiplas tentativas falhas. Verifique se o relógio do seu dispositivo está correto.");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && code.length === 6) {
      handleVerify();
    }
  };

  return (
    <Card className="max-w-sm mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mfa-code">Código de Autenticação</Label>
          <Input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, ""));
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            className="text-center text-2xl tracking-widest"
            autoFocus
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleVerify}
            disabled={isLoading || code.length !== 6}
            className="flex-1"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verificar
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>O código é atualizado a cada 30 segundos.</p>
          <p>Certifique-se de que o relógio do seu dispositivo está correto.</p>
        </div>
      </CardContent>
    </Card>
  );
}
