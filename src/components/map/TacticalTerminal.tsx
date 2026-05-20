import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, ChevronRight, Zap, ShieldCheck, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";


interface LogEntry {
  id: string;
  timestamp: string;
  module: string;
  message: string;
  level: 'info' | 'warn' | 'crit';
}

export function TacticalTerminal() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const modules = ["GEO_INT", "BIO_SYNC", "ROUTE_OPT", "NEXUS_CORE", "SAT_FUSION"];
    const messages = [
      "Broadcasting telemetry packet to NODE_SP_01",
      "Analyzing atmospheric interference for Sat_Fusion",
      "Bio_Sync: Heart_rate variance within nominal parameters",
      "Nexus_Grid: Recalculating topology for optimal routing",
      "Scanning risk zones via high-altitude SAR imaging",
      "Encrypted handshake successful with CD_CENTRAL",
      "Buffer overflow prevented in telemetry gateway",
      "Drone_Follow: Adjusting gimbal for high-speed tracking"
    ];

    const interval = setInterval(() => {
      const newEntry: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 }),
        module: modules[Math.floor(Math.random() * modules.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        level: Math.random() > 0.9 ? 'warn' : 'info'
      };

      setEntries(prev => [...prev.slice(-49), newEntry]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries]);

  return (
    <div className="fixed bottom-6 left-6 z-[60] flex flex-col items-start gap-3 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[450px] h-[220px] bg-black/90 backdrop-blur-3xl border border-cyan-500/20 rounded-[1.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.8)] pointer-events-auto overflow-hidden flex flex-col"
          >
            <div className="px-4 py-2 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-3 h-3 text-cyan-500" />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Nexus_Tactical_Terminal</span>
              </div>
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
              </div>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex-1 p-4 font-mono text-[9px] overflow-y-auto space-y-1 custom-scrollbar"
            >
              {entries.map((entry) => (
                <div key={entry.id} className="flex gap-3 leading-tight group">
                  <span className="text-white/20 shrink-0">[{entry.timestamp}]</span>
                  <span className={cn(
                    "shrink-0 px-1 rounded",
                    entry.level === 'warn' ? "bg-amber-500/10 text-amber-500" : "bg-cyan-500/10 text-cyan-500"
                  )}>{entry.module}</span>
                  <span className="text-white/60 group-hover:text-white transition-colors">{entry.message}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
                <ChevronRight className="w-3 h-3" />
                <span className="w-1.5 h-3 bg-cyan-500" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "pointer-events-auto h-12 rounded-2xl px-6 font-black uppercase tracking-widest transition-all border flex items-center gap-3",
          isOpen 
            ? "bg-cyan-500 text-black border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.4)]" 
            : "bg-black/80 text-cyan-500 border-cyan-500/30 backdrop-blur-xl hover:bg-cyan-500/10"
        )}
      >
        <div className="relative">
          <Cpu className={cn("w-4 h-4", isOpen && "animate-spin")} />
          {!isOpen && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-black animate-ping" />}
        </div>
        Terminal_v4
      </Button>
    </div>
  );
}

const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');
