import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

// Enhanced overlay with blur effect
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    blur?: boolean;
  }
>(({ className, blur = true, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/60",
      blur && "backdrop-blur-sm",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

// Content variants for different dialog styles
const dialogContentVariants = cva(
  cn(
    "fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-2rem)] sm:w-full translate-x-[-50%] translate-y-[-50%]",
    "gap-4 border bg-background p-4 sm:p-6 shadow-2xl",
    "max-h-[calc(100vh-2rem)] sm:max-h-[90vh] overflow-y-auto",
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "duration-300"
  ),
  {
    variants: {
      variant: {
        default: cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
          "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]"
        ),
        scale: cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:zoom-out-90 data-[state=open]:zoom-in-90",
          "data-[state=closed]:scale-95 data-[state=open]:scale-100"
        ),
        slideUp: cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-bottom-full data-[state=open]:slide-in-from-bottom-full"
        ),
        slideDown: cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-top-full data-[state=open]:slide-in-from-top-full"
        ),
        slideLeft: cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full"
        ),
        slideRight: cn(
          "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          "data-[state=closed]:slide-out-to-left-full data-[state=open]:slide-in-from-left-full"
        ),
      },
      size: {
        sm: "max-w-sm",
        default: "max-w-lg",
        lg: "max-w-2xl",
        xl: "max-w-4xl",
        full: "max-w-[95vw] max-h-[95vh]",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-md",
        default: "rounded-lg",
        lg: "rounded-xl",
        xl: "rounded-2xl",
      },
      glow: {
        none: "",
        primary: "shadow-[0_0_50px_-12px_hsl(var(--primary))]",
        success: "shadow-[0_0_50px_-12px_hsl(142_76%_36%)]",
        warning: "shadow-[0_0_50px_-12px_hsl(38_92%_50%)]",
        danger: "shadow-[0_0_50px_-12px_hsl(var(--destructive))]",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
      glow: "none",
    }
  }
);

interface DialogContentProps 
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>,
    VariantProps<typeof dialogContentVariants> {
  blur?: boolean;
  hideCloseButton?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, variant, size, rounded, glow, blur, hideCloseButton, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay blur={blur} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(dialogContentVariants({ variant, size, rounded, glow }), className)}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close className={cn(
          "absolute right-3 top-3 sm:right-4 sm:top-4 rounded-full p-2",
          "min-h-[44px] min-w-[44px] flex items-center justify-center",
          "opacity-70 ring-offset-background transition-all",
          "hover:opacity-100 hover:bg-muted hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:pointer-events-none",
          "data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        )}>
          <X className="h-5 w-5" />
          <span className="sr-only">Fechar</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

// Header with optional icon and gradient title
interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  gradient?: boolean;
}

const DialogHeader = ({ className, icon, gradient, children, ...props }: DialogHeaderProps) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props}>
    {icon && (
      <div className="flex justify-center sm:justify-start mb-2">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    )}
    {gradient ? (
      <div className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
        {children}
      </div>
    ) : children}
  </div>
);
DialogHeader.displayName = "DialogHeader";

// Footer with better button alignment
const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:space-x-2",
      "pt-4 border-t border-border/50",
      className
    )} 
    {...props} 
  />
);
DialogFooter.displayName = "DialogFooter";

// Title with optional badge
interface DialogTitleProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title> {
  badge?: React.ReactNode;
}

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  DialogTitleProps
>(({ className, badge, children, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      "flex items-center gap-2",
      className
    )}
    {...props}
  >
    {children}
    {badge}
  </DialogPrimitive.Title>
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description 
    ref={ref} 
    className={cn("text-sm text-muted-foreground", className)} 
    {...props} 
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// Dialog body for scrollable content
const DialogBody = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div 
    className={cn(
      "flex-1 overflow-y-auto py-4",
      "-mx-6 px-6", // Extend to edges for scrollbar
      className
    )} 
    {...props} 
  />
);
DialogBody.displayName = "DialogBody";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogBody,
};
