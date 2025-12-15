import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus, Star, Flame, Package } from "lucide-react";
import { motion } from "framer-motion";

type Period = "weekly" | "monthly";

interface RankingUser {
  id: number;
  name: string;
  avatar: string;
  xp: number;
  deliveries: number;
  streak: number;
  trend: "up" | "down" | "same";
  trendValue: number;
  level: number;
}

const mockRankingData: RankingUser[] = [
  { id: 1, name: "Carlos Silva", avatar: "CS", xp: 12500, deliveries: 156, streak: 45, trend: "up", trendValue: 2, level: 15 },
  { id: 2, name: "Ana Oliveira", avatar: "AO", xp: 11200, deliveries: 142, streak: 38, trend: "up", trendValue: 1, level: 14 },
  { id: 3, name: "Roberto Santos", avatar: "RS", xp: 10800, deliveries: 138, streak: 32, trend: "down", trendValue: 1, level: 13 },
  { id: 4, name: "Maria Costa", avatar: "MC", xp: 9500, deliveries: 125, streak: 28, trend: "same", trendValue: 0, level: 12 },
  { id: 5, name: "João Ferreira", avatar: "JF", xp: 8900, deliveries: 118, streak: 22, trend: "up", trendValue: 3, level: 11 },
  { id: 6, name: "Fernanda Lima", avatar: "FL", xp: 8200, deliveries: 108, streak: 18, trend: "down", trendValue: 2, level: 10 },
  { id: 7, name: "Pedro Almeida", avatar: "PA", xp: 7600, deliveries: 98, streak: 15, trend: "up", trendValue: 1, level: 9 },
  { id: 8, name: "Lucia Martins", avatar: "LM", xp: 7100, deliveries: 92, streak: 12, trend: "same", trendValue: 0, level: 9 },
  { id: 9, name: "Ricardo Souza", avatar: "RS", xp: 6500, deliveries: 85, streak: 8, trend: "down", trendValue: 3, level: 8 },
  { id: 10, name: "Camila Rocha", avatar: "CR", xp: 6000, deliveries: 78, streak: 5, trend: "up", trendValue: 2, level: 7 },
];

function PodiumPlace({ user, place, delay }: { user: RankingUser; place: 1 | 2 | 3; delay: number }) {
  const heights = { 1: "h-32", 2: "h-24", 3: "h-20" };
  const colors = { 
    1: "from-xp to-xp/70", 
    2: "from-muted-foreground to-muted-foreground/70", 
    3: "from-coins to-coins/70" 
  };
  const icons = { 1: Crown, 2: Medal, 3: Medal };
  const Icon = icons[place];
  const order = { 1: "order-2", 2: "order-1", 3: "order-3" };

  return (
    <motion.div
      className={`flex flex-col items-center ${order[place]}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
    >
      {/* Avatar */}
      <motion.div
        className="relative mb-3"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: delay + 0.3 }}
      >
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors[place]} flex items-center justify-center text-xl font-bold text-background shadow-lg`}>
          {user.avatar}
        </div>
        <motion.div
          className="absolute -top-2 -right-2"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Icon className={`w-6 h-6 ${place === 1 ? "text-xp" : place === 2 ? "text-muted-foreground" : "text-coins"}`} />
        </motion.div>
      </motion.div>

      {/* Name and XP */}
      <p className="font-semibold text-foreground text-sm mb-1 text-center">{user.name}</p>
      <p className="text-xs text-muted-foreground mb-2">{user.xp.toLocaleString()} XP</p>

      {/* Podium */}
      <motion.div
        className={`${heights[place]} w-24 bg-gradient-to-t ${colors[place]} rounded-t-lg flex items-center justify-center shadow-lg`}
        initial={{ height: 0 }}
        animate={{ height: place === 1 ? 128 : place === 2 ? 96 : 80 }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
      >
        <span className="text-3xl font-bold text-background">{place}</span>
      </motion.div>
    </motion.div>
  );
}

function TrendIndicator({ trend, value }: { trend: "up" | "down" | "same"; value: number }) {
  if (trend === "same") {
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  }
  
  return (
    <div className={`flex items-center gap-1 ${trend === "up" ? "text-success" : "text-destructive"}`}>
      {trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

export default function Ranking() {
  const [period, setPeriod] = useState<Period>("weekly");

  const topThree = mockRankingData.slice(0, 3);
  const restOfRanking = mockRankingData.slice(3);

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-7 h-7 text-xp" />
              Ranking de Performance
            </h1>
            <p className="text-muted-foreground">Acompanhe os melhores performers da equipe</p>
          </div>

          {/* Period Filter */}
          <div className="flex gap-2 bg-card border border-border rounded-lg p-1">
            <Button
              variant={period === "weekly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("weekly")}
              className={period === "weekly" ? "bg-primary text-primary-foreground" : ""}
            >
              Semanal
            </Button>
            <Button
              variant={period === "monthly" ? "default" : "ghost"}
              size="sm"
              onClick={() => setPeriod("monthly")}
              className={period === "monthly" ? "bg-primary text-primary-foreground" : ""}
            >
              Mensal
            </Button>
          </div>
        </div>

        {/* Podium */}
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-xp" />
              Top 3 da {period === "weekly" ? "Semana" : "Mês"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex justify-center items-end gap-4 pb-4">
              <PodiumPlace user={topThree[1]} place={2} delay={0.2} />
              <PodiumPlace user={topThree[0]} place={1} delay={0} />
              <PodiumPlace user={topThree[2]} place={3} delay={0.4} />
            </div>
          </CardContent>
        </Card>

        {/* Full Ranking Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Medal className="w-5 h-5 text-primary" />
              Ranking Completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Posição</TableHead>
                  <TableHead className="text-muted-foreground">Motorista</TableHead>
                  <TableHead className="text-muted-foreground text-center">Nível</TableHead>
                  <TableHead className="text-muted-foreground text-right">XP</TableHead>
                  <TableHead className="text-muted-foreground text-center">Entregas</TableHead>
                  <TableHead className="text-muted-foreground text-center">Streak</TableHead>
                  <TableHead className="text-muted-foreground text-center">Tendência</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRankingData.map((user, index) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {index < 3 ? (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            index === 0 ? "bg-xp/20 text-xp" :
                            index === 1 ? "bg-muted text-muted-foreground" :
                            "bg-coins/20 text-coins"
                          }`}>
                            {index === 0 ? <Crown className="w-4 h-4" /> : <Medal className="w-4 h-4" />}
                          </div>
                        ) : (
                          <span className="w-8 h-8 flex items-center justify-center text-muted-foreground font-medium">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                          {user.avatar}
                        </div>
                        <span className="font-medium text-foreground">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="border-primary/50 text-primary">
                        Lv. {user.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-xp">{user.xp.toLocaleString()}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{user.deliveries}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="w-4 h-4 text-primary" />
                        <span className="text-foreground">{user.streak} dias</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <TrendIndicator trend={user.trend} value={user.trendValue} />
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
