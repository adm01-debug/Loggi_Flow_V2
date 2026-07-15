import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, Award, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RankUser {
  id: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  achievements: number;
}

interface RankingPodiumProps {
  top3: RankUser[];
}

const podiumColors = ["from-warning to-warning/80", "from-muted-foreground/60 to-muted-foreground", "from-warning/80 to-warning/60"];
const podiumIcons = [Crown, Medal, Award];
const podiumHeights = ["h-28", "h-20", "h-14"];
const podiumBg = ["bg-gradient-to-t from-warning to-warning/80", "bg-gradient-to-t from-muted-foreground to-muted-foreground/60", "bg-gradient-to-t from-warning/60 to-warning/80"];

export function RankingPodium({ top3 }: RankingPodiumProps) {
  if (top3.length === 0) return null;

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-background to-muted/20 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-warning/10 blur-3xl rounded-full" />
      <div className="relative flex items-end justify-center gap-4 pt-4 pb-2">
        {[1, 0, 2].map((pos) => {
          const user = top3[pos];
          if (!user) return null;
          const Icon = podiumIcons[pos];
          return (
            <motion.div
              key={pos}
              className={cn("text-center", pos === 0 && "order-2", pos === 1 && "order-1", pos === 2 && "order-3")}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: [0, 0.1, 0.2][pos] ?? 0 }}
            >
              <div className="relative">
                <div className={cn("w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center mx-auto mb-2 shadow-lg ring-4 ring-background", podiumColors[pos])}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={`Avatar de ${user.name}`} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <Icon className="w-8 h-8 text-white" />
                  )}
                </div>
                {pos === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Sparkles className="w-6 h-6 text-warning animate-pulse" />
                  </div>
                )}
              </div>
              <p className="font-bold text-sm truncate max-w-24">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.xp.toLocaleString()} XP</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <Badge variant="outline" className="text-xs">Nv. {user.level}</Badge>
                <Badge variant="secondary" className="text-xs"><Trophy className="w-3 h-3 mr-0.5" />{user.achievements}</Badge>
              </div>
              <div className={cn("w-20 mx-auto mt-3 rounded-t-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", podiumHeights[pos], podiumBg[pos])}>
                {pos + 1}º
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
