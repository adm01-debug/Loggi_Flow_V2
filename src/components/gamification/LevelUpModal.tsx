import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamification } from "@/hooks/gamification/useGamification";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, ArrowUpCircle, Coins, Zap } from "lucide-react";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

export function LevelUpModal() {
  const { userLevel, levelProgress } = useGamification();
  const [show, setShow] = useState(false);
  const [lastLevel, setLastLevel] = useState<number | null>(null);
  const { width, height } = useWindowSize();

  useEffect(() => {
    if (userLevel?.level && lastLevel !== null && userLevel.level > lastLevel) {
      setShow(true);
    }
    if (userLevel?.level) {
      setLastLevel(userLevel.level);
    }
  }, [userLevel?.level, lastLevel]);

  if (!userLevel) return null;

  return (
    <Dialog open={show} onOpenChange={setShow}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none bg-transparent shadow-none">
        <AnimatePresence>
          {show && (
            <>
              <Confetti
                width={width}
                height={height}
                recycle={false}
                numberOfPieces={200}
                colors={["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"]}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5, rotate: 10 }}
                className="relative bg-gradient-to-b from-primary/20 via-background to-background rounded-3xl p-8 border border-primary/20 shadow-2xl backdrop-blur-xl text-center"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

                <div className="relative mx-auto w-24 h-24 mb-6">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 10,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                  />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl">
                    <span className="text-4xl font-black text-primary-foreground">
                      {userLevel.level}
                    </span>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-2 -right-2 bg-warning rounded-full p-1.5 shadow-lg"
                  >
                    <Star className="w-5 h-5 text-warning-foreground fill-current" />
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-3xl font-black tracking-tight mb-2">
                    NÍVEL SUPERIOR!
                  </h2>
                  {userLevel?.rank && (
                    <Badge
                      variant="outline"
                      className="mb-4 text-xs font-black px-4 py-1 uppercase tracking-widest border-2"
                      style={{
                        borderColor: userLevel.rank.color,
                        color: userLevel.rank.color,
                        backgroundColor: `${userLevel.rank.color}10`,
                      }}
                    >
                      PATENTE: {userLevel.rank.name}
                    </Badge>
                  )}
                  <p className="text-muted-foreground mb-8">
                    Parabéns! Sua eficiência operacional levou você a um novo
                    patamar.
                  </p>
                </motion.div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <Zap className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-xl font-bold">{userLevel.total_xp}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">
                      XP Total
                    </p>
                  </div>
                  <div className="bg-warning/5 p-4 rounded-2xl border border-warning/10">
                    <Coins className="w-5 h-5 text-warning mx-auto mb-1" />
                    <p className="text-xl font-bold">{userLevel.coins}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">
                      Moedas
                    </p>
                  </div>
                </div>

                <Button
                  onClick={() => setShow(false)}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 group"
                >
                  Continuar Jornada
                  <ArrowUpCircle className="ml-2 w-5 h-5 group-hover:translate-y-[-2px] transition-transform" />
                </Button>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <Trophy className="w-4 h-4 text-warning" />
                  <span className="text-xs font-semibold text-muted-foreground tracking-wide">
                    NOVA CONQUISTA DISPONÍVEL
                  </span>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
