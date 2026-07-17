import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldAlert, Smartphone, Lock, Unlock, Users } from "lucide-react";

interface SecurityScoreCardProps {
  securityScore: number;
  mfaEnabled: boolean;
  knownDevices: number;
  activeSessions: number;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  if (score >= 40) return 'text-warning';
  return 'text-destructive';
};

const getScoreLabel = (score: number) => {
  if (score >= 80) return 'Excelente';
  if (score >= 60) return 'Bom';
  if (score >= 40) return 'Regular';
  return 'Crítico';
};

export function SecurityScoreCard({ securityScore, mfaEnabled, knownDevices, activeSessions }: SecurityScoreCardProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary" />Pontuação de Segurança</CardTitle>
        <CardDescription>Avaliação geral da segurança da sua conta</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="10" fill="none" className="text-muted" />
              <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="10" fill="none" strokeDasharray={`${securityScore * 2.83} 283`} className={getScoreColor(securityScore)} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${getScoreColor(securityScore)}`}>{securityScore}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {securityScore >= 60 ? <ShieldCheck className="h-5 w-5 text-success" /> : <ShieldAlert className="h-5 w-5 text-warning" />}
                <span className="font-medium">{getScoreLabel(securityScore)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  if (securityScore >= 80) return 'Sua conta está bem protegida.';
                  if (securityScore >= 60) return 'Algumas melhorias são recomendadas.';
                  return 'Ação necessária para melhorar a segurança.';
                })()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {mfaEnabled ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20"><Lock className="h-3 w-3 mr-1" />MFA Ativo</Badge>
              ) : (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20"><Unlock className="h-3 w-3 mr-1" />MFA Inativo</Badge>
              )}
              <Badge variant="outline" className="bg-info/10 text-info border-info/20"><Smartphone className="h-3 w-3 mr-1" />{knownDevices} dispositivo(s)</Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20"><Users className="h-3 w-3 mr-1" />{activeSessions} sessão(ões) ativa(s)</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
