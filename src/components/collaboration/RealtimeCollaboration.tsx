import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Eye, Edit, MessageCircle, MousePointer2, Users } from 'lucide-react';

// ============================================
// REALTIME COLLABORATION INDICATORS
// Show who is viewing/editing in real-time
// ============================================

export interface CollaboratorPresence {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'viewing' | 'editing' | 'typing' | 'idle';
  color: string;
  lastActivity: Date;
  cursorPosition?: { x: number; y: number };
  currentField?: string;
}

// ============================================
// COLLABORATOR AVATARS - Stack of active users
// ============================================

interface CollaboratorAvatarsProps {
  collaborators: CollaboratorPresence[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

export function CollaboratorAvatars({
  collaborators,
  maxVisible = 4,
  size = 'md',
  showStatus = true,
}: CollaboratorAvatarsProps) {
  const visible = collaborators.slice(0, maxVisible);
  const overflow = collaborators.length - maxVisible;

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const statusIcons = {
    viewing: Eye,
    editing: Edit,
    typing: MessageCircle,
    idle: Users,
  };

  return (
    <TooltipProvider>
      <div className="flex items-center -space-x-2">
        {visible.map((collaborator, index) => {
          const StatusIcon = statusIcons[collaborator.status];
          return (
            <Tooltip key={collaborator.id}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ scale: 0, x: -10 }}
                  animate={{ scale: 1, x: 0 }}
                  exit={{ scale: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  <Avatar
                    className={cn(
                      sizeClasses[size],
                      "border-2 border-background ring-2 cursor-pointer transition-transform hover:scale-110 hover:z-10"
                    )}
                    style={{ boxShadow: `0 0 0 2px ${collaborator.color}` }}
                  >
                    <AvatarImage src={collaborator.avatar} alt={collaborator.name} />
                    <AvatarFallback style={{ backgroundColor: collaborator.color }}>
                      {collaborator.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {showStatus && collaborator.status !== 'idle' && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 rounded-full p-0.5",
                        collaborator.status === 'editing' && "bg-green-500",
                        collaborator.status === 'typing' && "bg-blue-500",
                        collaborator.status === 'viewing' && "bg-amber-500",
                      )}
                    >
                      <StatusIcon className="h-2.5 w-2.5 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-center">
                  <p className="font-medium">{collaborator.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {collaborator.status === 'viewing' && 'Visualizando'}
                    {collaborator.status === 'editing' && 'Editando'}
                    {collaborator.status === 'typing' && 'Digitando...'}
                    {collaborator.status === 'idle' && 'Inativo'}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
        
        {overflow > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  sizeClasses[size],
                  "rounded-full bg-muted flex items-center justify-center border-2 border-background font-medium"
                )}
              >
                +{overflow}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>+{overflow} outros colaboradores</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}

// ============================================
// LIVE CURSOR - Show other users' cursors
// ============================================

interface LiveCursorProps {
  collaborator: CollaboratorPresence;
  containerRef: React.RefObject<HTMLElement>;
}

export function LiveCursor({ collaborator, containerRef }: LiveCursorProps) {
  if (!collaborator.cursorPosition) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        x: collaborator.cursorPosition.x,
        y: collaborator.cursorPosition.y,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="absolute pointer-events-none z-50"
      style={{ left: 0, top: 0 }}
    >
      <MousePointer2 
        className="h-5 w-5 drop-shadow-md" 
        style={{ color: collaborator.color, fill: collaborator.color }}
      />
      <div
        className="ml-4 -mt-1 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap shadow-lg"
        style={{ backgroundColor: collaborator.color }}
      >
        {collaborator.name.split(' ')[0]}
      </div>
    </motion.div>
  );
}

// ============================================
// EDITING INDICATOR - Show when someone is editing a field
// ============================================

interface EditingIndicatorProps {
  collaborator: CollaboratorPresence;
  className?: string;
}

export function EditingIndicator({ collaborator, className }: EditingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn("flex items-center gap-1.5 text-xs", className)}
      style={{ color: collaborator.color }}
    >
      <div 
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: collaborator.color }}
      />
      <span className="font-medium">{collaborator.name.split(' ')[0]}</span>
      <span className="text-muted-foreground">está editando...</span>
    </motion.div>
  );
}

// ============================================
// TYPING INDICATOR - Animated dots
// ============================================

interface TypingIndicatorProps {
  collaborators: CollaboratorPresence[];
}

export function TypingIndicator({ collaborators }: TypingIndicatorProps) {
  const typingUsers = collaborators.filter(c => c.status === 'typing');
  
  if (typingUsers.length === 0) return null;

  const names = typingUsers.map(u => u.name.split(' ')[0]);
  const displayText = names.length === 1 
    ? `${names[0]} está digitando`
    : names.length === 2 
    ? `${names.join(' e ')} estão digitando`
    : `${names.slice(0, 2).join(', ')} e outros estão digitando`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 text-sm text-muted-foreground"
    >
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
      <span>{displayText}</span>
    </motion.div>
  );
}

// ============================================
// PRESENCE INDICATOR - Compact status badge
// ============================================

interface PresenceIndicatorProps {
  count: number;
  status?: 'active' | 'idle';
}

export function PresenceIndicator({ count, status = 'active' }: PresenceIndicatorProps) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "gap-1.5",
        status === 'active' && "border-green-500 text-green-600",
        status === 'idle' && "border-muted text-muted-foreground"
      )}
    >
      <span 
        className={cn(
          "w-2 h-2 rounded-full",
          status === 'active' && "bg-green-500 animate-pulse",
          status === 'idle' && "bg-muted-foreground"
        )} 
      />
      {count} {count === 1 ? 'online' : 'online'}
    </Badge>
  );
}

// ============================================
// COLLABORATION WRAPPER - Full container
// ============================================

interface CollaborationWrapperProps {
  children: React.ReactNode;
  collaborators: CollaboratorPresence[];
  showCursors?: boolean;
  className?: string;
}

export function CollaborationWrapper({
  children,
  collaborators,
  showCursors = true,
  className,
}: CollaborationWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {children}
      
      {showCursors && (
        <AnimatePresence>
          {collaborators
            .filter(c => c.cursorPosition)
            .map(collaborator => (
              <LiveCursor
                key={collaborator.id}
                collaborator={collaborator}
                containerRef={containerRef}
              />
            ))}
        </AnimatePresence>
      )}
    </div>
  );
}

export default CollaboratorAvatars;
