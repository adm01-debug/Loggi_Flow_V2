import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { X, GripHorizontal, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// ============================================
// BOTTOM SHEET COMPONENT
// ============================================
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  snapPoints?: number[];
  defaultSnapPoint?: number;
  showHandle?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  snapPoints = [0.4, 0.7, 0.95],
  defaultSnapPoint = 0,
  showHandle = true,
  showCloseButton = true,
  closeOnBackdrop = true,
  footer,
  className
}) => {
  const [currentSnap, setCurrentSnap] = useState(defaultSnapPoint);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();
  
  const currentHeight = snapPoints[currentSnap];
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    // Close if dragged down fast or far
    if (velocity > 500 || offset > 200) {
      if (currentSnap > 0) {
        setCurrentSnap(currentSnap - 1);
      } else {
        onClose();
      }
      return;
    }
    
    // Expand if dragged up fast
    if (velocity < -500 || offset < -100) {
      if (currentSnap < snapPoints.length - 1) {
        setCurrentSnap(currentSnap + 1);
      }
      return;
    }
    
    // Snap to nearest point based on current position
    const windowHeight = window.innerHeight;
    const currentY = windowHeight * (1 - currentHeight) + offset;
    const currentPercentage = 1 - (currentY / windowHeight);
    
    let nearestSnap = 0;
    let nearestDistance = Math.abs(snapPoints[0] - currentPercentage);
    
    snapPoints.forEach((point, index) => {
      const distance = Math.abs(point - currentPercentage);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestSnap = index;
      }
    });
    
    if (currentPercentage < 0.2) {
      onClose();
    } else {
      setCurrentSnap(nearestSnap);
    }
  };

  // Reset to default snap when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentSnap(defaultSnapPoint);
    }
  }, [isOpen, defaultSnapPoint]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          
          {/* Sheet */}
          <motion.div
            ref={constraintsRef}
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-3xl shadow-2xl",
              "flex flex-col max-h-[95vh]",
              className
            )}
            initial={{ y: '100%' }}
            animate={{ 
              y: `${(1 - currentHeight) * 100}%`,
              height: `${currentHeight * 100}vh`
            }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300 
            }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
          >
            {/* Handle */}
            {showHandle && (
              <div 
                className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="w-12 h-1.5 rounded-full bg-muted-foreground/30" />
              </div>
            )}
            
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div>
                  {title && (
                    <h3 className="text-lg font-semibold">{title}</h3>
                  )}
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                
                {showCloseButton && (
                  <motion.button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-muted transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-5 w-5" />
                  </motion.button>
                )}
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="p-4 border-t border-border/50 bg-background">
                {footer}
              </div>
            )}
            
            {/* Safe area padding for iOS */}
            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================
// BOTTOM SHEET FORM
// ============================================
interface BottomSheetFormProps extends Omit<BottomSheetProps, 'footer'> {
  onSubmit: () => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  disabled?: boolean;
  success?: boolean;
}

export const BottomSheetForm: React.FC<BottomSheetFormProps> = ({
  onSubmit,
  submitLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading,
  disabled,
  success,
  onClose,
  children,
  ...props
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit();
  };

  return (
    <BottomSheet
      {...props}
      onClose={onClose}
      footer={
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          
          <motion.div className="flex-1">
            <Button
              type="submit"
              className="w-full"
              disabled={disabled || loading}
              onClick={handleSubmit as any}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processando...</span>
                  </motion.div>
                ) : success ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    <span>Sucesso!</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {submitLabel}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {children}
      </form>
    </BottomSheet>
  );
};

// ============================================
// ACTION SHEET (Simple Options)
// ============================================
interface ActionSheetOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
  onSelect: (id: string) => void;
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  isOpen,
  onClose,
  title,
  options,
  onSelect
}) => {
  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            className="fixed inset-x-4 bottom-4 z-50 space-y-2"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Options */}
            <div className="bg-background rounded-2xl overflow-hidden shadow-2xl">
              {title && (
                <div className="px-4 py-3 border-b border-border/50">
                  <p className="text-sm text-muted-foreground text-center font-medium">
                    {title}
                  </p>
                </div>
              )}
              
              {options.map((option, index) => (
                <motion.button
                  key={option.id}
                  className={cn(
                    "w-full px-4 py-3.5 flex items-center justify-center gap-3",
                    "text-base font-medium transition-colors",
                    "hover:bg-muted active:bg-muted/80",
                    index !== options.length - 1 && "border-b border-border/50",
                    option.variant === 'destructive' && "text-destructive",
                    option.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !option.disabled && handleSelect(option.id)}
                  disabled={option.disabled}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={!option.disabled ? { scale: 0.98 } : undefined}
                >
                  {option.icon}
                  {option.label}
                </motion.button>
              ))}
            </div>
            
            {/* Cancel Button */}
            <motion.button
              className={cn(
                "w-full px-4 py-3.5 bg-background rounded-2xl",
                "text-base font-semibold text-primary",
                "hover:bg-muted transition-colors shadow-2xl"
              )}
              onClick={onClose}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancelar
            </motion.button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// ============================================
// EXPANDABLE BOTTOM BAR
// ============================================
interface ExpandableBottomBarProps {
  collapsed: React.ReactNode;
  expanded: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
}

export const ExpandableBottomBar: React.FC<ExpandableBottomBarProps> = ({
  collapsed,
  expanded,
  isExpanded: controlledExpanded,
  onToggle
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded ?? internalExpanded;
  
  const handleToggle = () => {
    const newState = !isExpanded;
    setInternalExpanded(newState);
    onToggle?.(newState);
  };

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 z-40 bg-background border-t border-border shadow-lg"
      animate={{
        height: isExpanded ? 'auto' : 'auto'
      }}
    >
      {/* Toggle Button */}
      <div 
        className="flex justify-center py-2 cursor-pointer"
        onClick={handleToggle}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </motion.div>
      </div>
      
      {/* Content */}
      <AnimatePresence mode="wait">
        {isExpanded ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="px-4 pb-4"
          >
            {expanded}
          </motion.div>
        ) : (
          <motion.div
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-4 pb-4"
          >
            {collapsed}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Safe area padding */}
      <div className="h-safe-area-inset-bottom" />
    </motion.div>
  );
};

// ============================================
// QUICK ACTION FAB
// ============================================
interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
}

interface QuickActionFABProps {
  actions: QuickAction[];
  onSelect: (id: string) => void;
  icon?: React.ReactNode;
}

export const QuickActionFAB: React.FC<QuickActionFABProps> = ({
  actions,
  onSelect,
  icon
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-16 right-0 space-y-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                className="flex items-center gap-2 px-4 py-2 bg-background rounded-full shadow-lg border border-border whitespace-nowrap"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  onSelect(action.id);
                  setIsOpen(false);
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-sm font-medium">{action.label}</span>
                <div className={cn("p-1 rounded-full", action.color || "bg-primary/10 text-primary")}>
                  {action.icon}
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main FAB */}
      <motion.button
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        {icon || <GripHorizontal className="h-6 w-6" />}
      </motion.button>
    </div>
  );
};

export default {
  BottomSheet,
  BottomSheetForm,
  ActionSheet,
  ExpandableBottomBar,
  QuickActionFAB
};
