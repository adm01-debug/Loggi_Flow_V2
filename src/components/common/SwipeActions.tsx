import { useState, useRef, ReactNode } from 'react';
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { Trash2, Edit, Copy, Check, Star, Archive, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================
// SWIPE ACTIONS COMPONENT
// Mobile-first swipe gestures for list items
// ============================================

export interface SwipeAction {
  id: string;
  icon: ReactNode;
  label: string;
  color: string;
  bgColor: string;
  onClick: () => void;
}

interface SwipeActionsProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  className?: string;
  disabled?: boolean;
}

export function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  className,
  disabled = false,
}: SwipeActionsProps) {
  const [isOpen, setIsOpen] = useState<'left' | 'right' | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  const leftActionsWidth = leftActions.length * 70;
  const rightActionsWidth = rightActions.length * 70;

  const backgroundLeft = useTransform(
    x,
    [0, leftActionsWidth],
    ['rgba(0,0,0,0)', 'rgba(34, 197, 94, 0.1)']
  );

  const backgroundRight = useTransform(
    x,
    [-rightActionsWidth, 0],
    ['rgba(239, 68, 68, 0.1)', 'rgba(0,0,0,0)']
  );

  const handleDragEnd = (_: never, info: PanInfo) => {
    if (disabled) return;

    const offset = info.offset.x;
    const velocity = info.velocity.x;

    if (offset > threshold || velocity > 500) {
      setIsOpen('left');
    } else if (offset < -threshold || velocity < -500) {
      setIsOpen('right');
    } else {
      setIsOpen(null);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.onClick();
    setIsOpen(null);
  };

  const close = () => setIsOpen(null);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      {/* Left Actions Background */}
      {leftActions.length > 0 && (
        <motion.div
          className="absolute inset-y-0 left-0 flex items-center"
          style={{ background: backgroundLeft }}
        >
          <AnimatePresence>
            {isOpen === 'left' && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex"
              >
                {leftActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleActionClick(action)}
                    className={cn(
                      "w-[70px] h-full flex flex-col items-center justify-center gap-1",
                      action.bgColor
                    )}
                  >
                    <span className={action.color}>{action.icon}</span>
                    <span className={cn("text-xs font-medium", action.color)}>
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Right Actions Background */}
      {rightActions.length > 0 && (
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center"
          style={{ background: backgroundRight }}
        >
          <AnimatePresence>
            {isOpen === 'right' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex"
              >
                {rightActions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleActionClick(action)}
                    className={cn(
                      "w-[70px] h-full flex flex-col items-center justify-center gap-1",
                      action.bgColor
                    )}
                  >
                    <span className={action.color}>{action.icon}</span>
                    <span className={cn("text-xs font-medium", action.color)}>
                      {action.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{ left: -rightActionsWidth, right: leftActionsWidth }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{
          x: isOpen === 'left' ? leftActionsWidth : isOpen === 'right' ? -rightActionsWidth : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        style={{ x }}
        className="relative bg-background cursor-grab active:cursor-grabbing"
        onClick={isOpen ? close : undefined}
      >
        {children}
      </motion.div>
    </div>
  );
}

// ============================================
// PREDEFINED SWIPE ACTION PRESETS
// ============================================

export const swipeActionPresets = {
  delete: (onClick: () => void): SwipeAction => ({
    id: 'delete',
    icon: <Trash2 className="h-5 w-5" />,
    label: 'Excluir',
    color: 'text-white',
    bgColor: 'bg-red-500',
    onClick,
  }),

  edit: (onClick: () => void): SwipeAction => ({
    id: 'edit',
    icon: <Edit className="h-5 w-5" />,
    label: 'Editar',
    color: 'text-white',
    bgColor: 'bg-blue-500',
    onClick,
  }),

  duplicate: (onClick: () => void): SwipeAction => ({
    id: 'duplicate',
    icon: <Copy className="h-5 w-5" />,
    label: 'Duplicar',
    color: 'text-white',
    bgColor: 'bg-purple-500',
    onClick,
  }),

  complete: (onClick: () => void): SwipeAction => ({
    id: 'complete',
    icon: <Check className="h-5 w-5" />,
    label: 'Concluir',
    color: 'text-white',
    bgColor: 'bg-green-500',
    onClick,
  }),

  favorite: (onClick: () => void): SwipeAction => ({
    id: 'favorite',
    icon: <Star className="h-5 w-5" />,
    label: 'Favorito',
    color: 'text-white',
    bgColor: 'bg-amber-500',
    onClick,
  }),

  archive: (onClick: () => void): SwipeAction => ({
    id: 'archive',
    icon: <Archive className="h-5 w-5" />,
    label: 'Arquivar',
    color: 'text-white',
    bgColor: 'bg-gray-500',
    onClick,
  }),

  more: (onClick: () => void): SwipeAction => ({
    id: 'more',
    icon: <MoreHorizontal className="h-5 w-5" />,
    label: 'Mais',
    color: 'text-white',
    bgColor: 'bg-gray-600',
    onClick,
  }),
};

export default SwipeActions;