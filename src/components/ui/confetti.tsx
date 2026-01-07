import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

interface ConfettiExplosionProps {
  isActive: boolean;
  onComplete?: () => void;
  particleCount?: number;
  duration?: number;
  colors?: string[];
  origin?: { x: number; y: number };
}

const defaultColors = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9'
];

export function ConfettiExplosion({
  isActive,
  onComplete,
  particleCount = 50,
  duration = 3000,
  colors = defaultColors,
  origin = { x: 50, y: 50 }
}: ConfettiExplosionProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  const generatePieces = useCallback(() => {
    return Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: origin.x + (Math.random() - 0.5) * 20,
      y: origin.y,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.3
    }));
  }, [particleCount, colors, origin]);

  useEffect(() => {
    if (isActive) {
      setPieces(generatePieces());
      const timer = setTimeout(() => {
        setPieces([]);
        onComplete?.();
      }, duration);
      return () => clearTimeout(timer);
    } else {
      setPieces([]);
    }
  }, [isActive, duration, onComplete, generatePieces]);

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `${piece.x}vw`,
                y: `${piece.y}vh`,
                scale: 0,
                rotate: 0,
                opacity: 1
              }}
              animate={{
                x: `${piece.x + (Math.random() - 0.5) * 80}vw`,
                y: `${piece.y + Math.random() * 100 + 20}vh`,
                scale: [0, 1, 1, 0.5],
                rotate: piece.rotation + Math.random() * 720,
                opacity: [1, 1, 1, 0]
              }}
              transition={{
                duration: duration / 1000,
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94]
              }}
              style={{
                position: 'absolute',
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px'
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook para usar confetti facilmente
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const fire = useCallback(() => {
    setIsActive(true);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
  }, []);

  return { isActive, fire, reset };
}

// Mini celebration (estrelas)
interface StarBurstProps {
  isActive: boolean;
  className?: string;
}

export function StarBurst({ isActive, className }: StarBurstProps) {
  if (!isActive) return null;

  const stars = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    angle: (i * 45) * (Math.PI / 180)
  }));

  return (
    <div className={cn("absolute inset-0 pointer-events-none", className)}>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            scale: [0, 1, 0],
            opacity: [1, 1, 0],
            x: Math.cos(star.angle) * 40,
            y: Math.sin(star.angle) * 40
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-yellow-400">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

// Success checkmark animation
interface SuccessCheckProps {
  isVisible: boolean;
  size?: number;
  className?: string;
}

export function SuccessCheck({ isVisible, size = 64, className }: SuccessCheckProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className={cn("relative", className)}
          style={{ width: size, height: size }}
        >
          <motion.svg
            viewBox="0 0 52 52"
            className="w-full h-full"
          >
            {/* Circle */}
            <motion.circle
              cx="26"
              cy="26"
              r="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-green-500"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            {/* Checkmark */}
            <motion.path
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14 27l7 7 16-16"
              className="text-green-500"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.5, ease: "easeOut" }}
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
