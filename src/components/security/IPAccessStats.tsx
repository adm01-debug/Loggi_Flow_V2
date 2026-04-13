import { Shield, ShieldBan, Globe } from "lucide-react";

interface IPAccessStatsProps {
  whitelistCount: number;
  blacklistCount: number;
  currentIP: string | null;
}

export function IPAccessStats({ whitelistCount, blacklistCount, currentIP }: IPAccessStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="p-2 rounded-full bg-success/10">
          <Shield className="h-5 w-5 text-success" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Whitelist</p>
          <p className="text-lg font-bold">{whitelistCount}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="p-2 rounded-full bg-destructive/10">
          <ShieldBan className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Blacklist</p>
          <p className="text-lg font-bold">{blacklistCount}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="p-2 rounded-full bg-primary/10">
          <Globe className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Seu IP</p>
          <p className="text-sm font-mono">{currentIP || "Carregando..."}</p>
        </div>
      </div>
    </div>
  );
}
