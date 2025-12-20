import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Crown, TrendingUp, Star, Flame, Package, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";

type Period = "weekly" | "monthly" | "all";

interface RankingUser {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  coins: number;
  position: number;
}

function PodiumPlace({ user, place, delay }: { user: RankingUser; place: 1 | 2 | 3; delay: number }) {
  const heights = { 1: "h-32", 2: "h-24", 3: "h-20" };
  const colors = { 1: "from-amber-400 to-amber-600", 2: "from-slate-300 to-slate-500", 3: "from-orange-400 to-orange-600" };
  const icons = { 1: Crown, 2: Medal, 3: Medal };
  const Icon = icons[place];
  const order = { 1: "order-2", 2: "order-1", 3: "order-3" };

  return (
    <motion.div className={`flex flex-col items-center ${order[place]}`} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay }}>
      <motion.div className="relative mb-3" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4, delay: delay + 0.3 }}>
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors[place]} flex items-center justify-center text-white font-bold text-xl shadow-lg ${place === 1 ? "ring-4 ring-amber-400/30" : ""}`}>{user.avatar}</div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-background rounded-full flex items-center justify-center shadow"><Icon className={`w-4 h-4 ${place === 1 ? "text-amber-500" : place === 2 ? "text-slate-400" : "text-orange-500"}`} /></div>
      </motion.div>
      <p className="font-semibold text-sm text-center truncate max-w-[100px]">{user.name}</p>
      <div className="flex items-center gap-1 mt-1"><Star className="w-3 h-3 text-amber-500" /><span className="text-xs font-medium">Nv. {user.level}</span></div>
      <motion.div className={`${heights[place]} w-20 bg-gradient-to-t ${colors[place]} rounded-t-lg mt-2 flex items-end justify-center pb-2`} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: delay + 0.5 }}>
        <span className="text-white font-bold text-lg">{place}º</span>
      </motion.div>
      <div className="bg-muted/50 w-20 py-2 rounded-b-lg text-center"><p className="text-sm font-bold text-primary">{user.xp.toLocaleString()} XP</p></div>
    </motion.div>
  );
}

export default function Ranking() {
  const [period, setPeriod] = useState<Period>("all");

  const { data: ranking = [], isLoading } = useQuery({
    queryKey: ["ranking", period],
    queryFn: async () => {
      // Buscar user_levels ordenado por total_xp
      const { data: levels, error } = await supabase.from("user_levels").select("*").order("total_xp", { ascending: false }).limit(50);
      if (error) throw error;
      
      // Buscar perfis dos usuários
      const userIds = (levels || []).map((l) => l.user_id);
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      
      const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));
      
      return (levels || []).map((l, idx) => {
        const profile = profilesMap.get(l.user_id);
        const name = profile?.full_name || `Usuário ${l.user_id.slice(0, 6)}`;
        return {
          id: l.user_id,
          name,
          avatar: name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
          xp: l.total_xp,
          level: l.level,
          streak: l.streak_days,
          coins: l.coins,
          position: idx + 1,
        } as RankingUser;
      });
    },
  });

  const top3 = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display text-foreground flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/10"><Trophy className="w-6 h-6 text-amber-500" /></div>
              Ranking
            </h1>
            <p className="text-muted-foreground mt-1">Os melhores colaboradores por XP</p>
          </div>
          <div className="flex gap-2">
            <Button variant={period === "weekly" ? "default" : "outline"} size="sm" onClick={() => setPeriod("weekly")}>Semana</Button>
            <Button variant={period === "monthly" ? "default" : "outline"} size="sm" onClick={() => setPeriod("monthly")}>Mês</Button>
            <Button variant={period === "all" ? "default" : "outline"} size="sm" onClick={() => setPeriod("all")}>Geral</Button>
          </div>
        </div>

        {isLoading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}

        {!isLoading && ranking.length === 0 && (
          <Card><CardContent className="flex flex-col items-center py-12"><Users className="w-12 h-12 text-muted-foreground/30 mb-4" /><p className="text-muted-foreground">Nenhum usuário no ranking ainda</p><p className="text-sm text-muted-foreground mt-1">Complete atividades para ganhar XP!</p></CardContent></Card>
        )}

        {!isLoading && ranking.length > 0 && (
          <>
            {/* Pódio */}
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-500" />Pódio</CardTitle></CardHeader>
              <CardContent>
                <div className="flex justify-center items-end gap-4 py-4">
                  {top3[1] && <PodiumPlace user={top3[1]} place={2} delay={0.1} />}
                  {top3[0] && <PodiumPlace user={top3[0]} place={1} delay={0} />}
                  {top3[2] && <PodiumPlace user={top3[2]} place={3} delay={0.2} />}
                </div>
              </CardContent>
            </Card>

            {/* Stats dos Top 3 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3.map((user, idx) => (
                <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + idx * 0.1 }}>
                  <Card className={idx === 0 ? "border-amber-500/30 bg-amber-500/5" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${idx === 0 ? "bg-gradient-to-br from-amber-400 to-amber-600" : idx === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500" : "bg-gradient-to-br from-orange-400 to-orange-600"}`}>{user.avatar}</div>
                        <div className="flex-1 min-w-0"><p className="font-semibold truncate">{user.name}</p><p className="text-sm text-muted-foreground">{user.xp.toLocaleString()} XP</p></div>
                        <Badge variant="outline" className={idx === 0 ? "bg-amber-500/10 text-amber-600" : ""}>{user.position}º</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="text-center p-2 bg-muted/50 rounded"><Star className="w-4 h-4 mx-auto text-amber-500 mb-1" /><p className="text-sm font-medium">Nv. {user.level}</p></div>
                        <div className="text-center p-2 bg-muted/50 rounded"><Flame className="w-4 h-4 mx-auto text-orange-500 mb-1" /><p className="text-sm font-medium">{user.streak} dias</p></div>
                        <div className="text-center p-2 bg-muted/50 rounded"><Package className="w-4 h-4 mx-auto text-primary mb-1" /><p className="text-sm font-medium">{user.coins} 🪙</p></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Tabela completa */}
            {rest.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Classificação Completa</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead className="w-16">#</TableHead><TableHead>Usuário</TableHead><TableHead className="text-right">XP</TableHead><TableHead className="text-right">Nível</TableHead><TableHead className="text-right">Streak</TableHead><TableHead className="text-right">Moedas</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {rest.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.position}º</TableCell>
                          <TableCell><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{user.avatar}</div><span>{user.name}</span></div></TableCell>
                          <TableCell className="text-right font-medium">{user.xp.toLocaleString()}</TableCell>
                          <TableCell className="text-right"><Badge variant="outline">Nv. {user.level}</Badge></TableCell>
                          <TableCell className="text-right"><div className="flex items-center justify-end gap-1"><Flame className="w-4 h-4 text-orange-500" />{user.streak}</div></TableCell>
                          <TableCell className="text-right">{user.coins} 🪙</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
