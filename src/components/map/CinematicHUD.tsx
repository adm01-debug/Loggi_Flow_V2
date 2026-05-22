import { motion } from "framer-motion";
import { Satellite, Navigation, Crosshair, Wifi } from "lucide-react";
import { useIsMobile } from "@/hooks";

export function CinematicHUD({ isLiveData, lastSync }: { isLiveData?: boolean; lastSync?: Date }) {
  const isMobile = useIsMobile();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Corner Brackets */}
      {!isMobile && (
        <>
          <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-cyan-500/30 rounded-tl-3xl" />
          <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-cyan-500/30 rounded-tr-3xl" />
          <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-cyan-500/30 rounded-bl-3xl" />
          <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-cyan-500/30 rounded-br-3xl" />
        </>
      )}

      {/* Top Center Metrics */}
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 flex items-center gap-3 sm:gap-8 bg-black/40 backdrop-blur-3xl px-4 sm:px-8 py-2 sm:py-3 rounded-full border border-white/5 shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <Satellite className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-cyan-500 animate-pulse" />
          <span className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-[0.1em] sm:tracking-[0.2em]">{isLiveData ? (isMobile ? "SAT_LOCK" : "SAT_LOCK: 14_FIXED") : "RESTORED"}</span>
        </div>
        <div className="w-px h-3 sm:h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <Navigation className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-500" />
          <span className="text-[8px] sm:text-[9px] font-black text-white uppercase tracking-[0.1em] sm:tracking-[0.2em]">{isLiveData ? (isMobile ? "HDOP_OK" : "HDOP: 0.82") : lastSync?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        {!isMobile && (
          <>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <Wifi className="w-3.5 h-3.5 text-success" />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">SIGNAL: NOMINAL</span>
            </div>
          </>
        )}
      </motion.div>

      {/* Floating Coordinates */}
      {!isMobile && (
        <div className="absolute bottom-32 left-12 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Crosshair className="w-4 h-4 text-cyan-500" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Grid_Reference_X_245</span>
          </div>
          <div className="font-mono text-[14px] font-black text-cyan-500/50 flex flex-col">
            <span>LAT: -23.550523</span>
            <span>LNG: -46.633308</span>
          </div>
        </div>
      )}

      {/* Side Scanners */}
      {!isMobile && (
        <div className="absolute top-1/2 left-8 -translate-y-1/2 flex flex-col gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1 h-8 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  animate={{ height: ['20%', '80%', '40%'] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                  className="w-full bg-cyan-500/40"
                />
              </div>
              <span className="text-[7px] font-black text-white/10 uppercase tracking-widest">S_{i}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
