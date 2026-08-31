import { Card, CardContent } from "@/components/ui/card";
import { Globe, Shield, AlertTriangle } from "lucide-react";

interface GeoBlockingStatsProps {
  activeRulesCount: number;
  totalRulesCount: number;
  blockedAttemptsCount: number;
}

export function GeoBlockingStats({ activeRulesCount, totalRulesCount, blockedAttemptsCount }: GeoBlockingStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <Globe className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Países Permitidos</p>
              <p className="text-2xl font-bold">{activeRulesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <Shield className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total na Whitelist</p>
              <p className="text-2xl font-bold">{totalRulesCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tentativas Bloqueadas</p>
              <p className="text-2xl font-bold">{blockedAttemptsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
