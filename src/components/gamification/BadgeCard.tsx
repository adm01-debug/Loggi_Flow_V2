import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Shield, Zap, Gem } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeCardProps {
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  unlocked: boolean;
  xpRequirement: number;
}

const tierIcons = {
  bronze: Shield,
  silver: Zap,
  gold: Star,
  platinum: Trophy,
  diamond: Gem,
};

const tierColors = {
  bronze: "text-amber-700 bg-amber-100 dark:bg-amber-900/30",
  silver: "text-slate-400 bg-slate-100 dark:bg-slate-800/30",
  gold: "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30",
  platinum: "text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30",
  diamond: "text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30",
};

export const BadgeCard: React.FC<BadgeCardProps> = ({
  name,
  description,
  tier,
  unlocked,
  xpRequirement,
}) => {
  const Icon = tierIcons[tier];

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:scale-[1.02]",
      !unlocked && "opacity-60 grayscale"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className={cn("p-2 rounded-lg", tierColors[tier])}>
          <Icon className="w-6 h-6" />
        </div>
        <Badge variant={unlocked ? "default" : "secondary"}>
          {unlocked ? "Desbloqueado" : `${xpRequirement} XP`}
        </Badge>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg font-bold mb-1">{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};
