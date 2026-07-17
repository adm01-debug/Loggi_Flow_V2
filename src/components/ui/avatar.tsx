import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Avatar variants
const avatarVariants = cva(
  "relative flex shrink-0 overflow-hidden",
  {
    variants: {
      size: {
        xs: "h-6 w-6 text-[10px]",
        sm: "h-8 w-8 text-xs",
        default: "h-10 w-10 text-sm",
        lg: "h-12 w-12 text-base",
        xl: "h-16 w-16 text-lg",
        "2xl": "h-20 w-20 text-xl",
      },
      shape: {
        circle: "rounded-full",
        square: "rounded-lg",
      },
      ring: {
        none: "",
        default: "ring-2 ring-background",
        primary: "ring-2 ring-primary",
        success: "ring-2 ring-success",
        warning: "ring-2 ring-warning",
        danger: "ring-2 ring-destructive",
      },
      status: {
        none: "",
        online: "",
        offline: "",
        busy: "",
        away: "",
      }
    },
    defaultVariants: {
      size: "default",
      shape: "circle",
      ring: "none",
      status: "none",
    }
  }
);

// Status indicator styles
const statusStyles = {
  online: "bg-success",
  offline: "bg-muted-foreground",
  busy: "bg-destructive",
  away: "bg-warning",
};

// Status indicator sizes based on avatar size
const statusSizeMap = {
  xs: "h-1.5 w-1.5 border",
  sm: "h-2 w-2 border",
  default: "h-2.5 w-2.5 border-2",
  lg: "h-3 w-3 border-2",
  xl: "h-3.5 w-3.5 border-2",
  "2xl": "h-4 w-4 border-2",
};

interface AvatarProps 
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>,
    VariantProps<typeof avatarVariants> {
  badge?: React.ReactNode;
  badgePosition?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
}

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarProps
>(({ className, size, shape, ring, status, badge, badgePosition = "bottom-right", ...props }, ref) => {
  const showStatus = status && status !== "none";
  
  const badgePositionStyles = {
    "top-right": "-top-1 -right-1",
    "bottom-right": "-bottom-1 -right-1",
    "top-left": "-top-1 -left-1",
    "bottom-left": "-bottom-1 -left-1",
  };

  const statusPositionStyles = {
    xs: { "bottom-right": "bottom-0 right-0" },
    sm: { "bottom-right": "bottom-0 right-0" },
    default: { "bottom-right": "-bottom-0.5 -right-0.5" },
    lg: { "bottom-right": "-bottom-0.5 -right-0.5" },
    xl: { "bottom-right": "-bottom-1 -right-1" },
    "2xl": { "bottom-right": "-bottom-1 -right-1" },
  };

  return (
    <div className="relative inline-flex">
      <AvatarPrimitive.Root
        ref={ref}
        className={cn(avatarVariants({ size, shape, ring }), className)}
        {...props}
      />
      
      {/* Status indicator */}
      {showStatus && (
        <span 
          className={cn(
            "absolute rounded-full border-background",
            statusStyles[status],
            statusSizeMap[size || "default"],
            statusPositionStyles[size || "default"]["bottom-right"],
            "animate-pulse"
          )}
        />
      )}

      {/* Badge */}
      {badge && (
        <span 
          className={cn(
            "absolute flex items-center justify-center",
            badgePositionStyles[badgePosition]
          )}
        >
          {badge}
        </span>
      )}
    </div>
  );
});
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image 
    ref={ref} 
    className={cn(
      "aspect-square h-full w-full object-cover",
      "transition-opacity duration-300",
      className
    )} 
    {...props} 
  />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

// Fallback variants
const avatarFallbackVariants = cva(
  "flex h-full w-full items-center justify-center font-medium",
  {
    variants: {
      variant: {
        default: "bg-muted text-muted-foreground",
        primary: "bg-primary/10 text-primary",
        gradient: "bg-gradient-to-br from-primary to-primary/60 text-primary-foreground",
        success: "bg-success/10 text-success",
        warning: "bg-warning/10 text-warning",
        danger: "bg-destructive/10 text-destructive",
      }
    },
    defaultVariants: {
      variant: "default",
    }
  }
);

interface AvatarFallbackProps 
  extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>,
    VariantProps<typeof avatarFallbackVariants> {}

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  AvatarFallbackProps
>(({ className, variant, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(avatarFallbackVariants({ variant }), className)}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

// Avatar group for stacked avatars
interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  max?: number;
  size?: "xs" | "sm" | "default" | "lg" | "xl" | "2xl";
  children: React.ReactNode;
}

const AvatarGroup = ({ max = 4, size = "default", children, className, ...props }: AvatarGroupProps) => {
  const childrenArray = React.Children.toArray(children);
  const displayedChildren = childrenArray.slice(0, max);
  const remainingCount = childrenArray.length - max;

  const overlapMap = {
    xs: "-ml-2",
    sm: "-ml-2.5",
    default: "-ml-3",
    lg: "-ml-4",
    xl: "-ml-5",
    "2xl": "-ml-6",
  };

  return (
    <div 
      className={cn("flex items-center", className)} 
      {...props}
    >
      {displayedChildren.map((child, index) => (
        <div 
          key={index}
          className={cn(
            index > 0 && overlapMap[size],
            "ring-2 ring-background rounded-full"
          )}
        >
          {child}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <Avatar 
          size={size} 
          className={cn(overlapMap[size], "ring-2 ring-background")}
        >
          <AvatarFallback variant="primary">
            +{remainingCount}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};

// Badge for avatar (like notification count)
interface AvatarBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count?: number;
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  dot?: boolean;
}

const AvatarBadge = ({ 
  count, 
  variant = "danger", 
  dot, 
  className, 
  children,
  ...props 
}: AvatarBadgeProps) => {
  const variantStyles = {
    default: "bg-muted text-muted-foreground",
    primary: "bg-primary text-primary-foreground",
    success: "bg-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    danger: "bg-destructive text-destructive-foreground",
  };

  if (dot) {
    return (
      <span 
        className={cn(
          "h-2.5 w-2.5 rounded-full border-2 border-background",
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <span 
      className={cn(
        "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold",
        "flex items-center justify-center border-2 border-background",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {(() => {
        if (children) return children;
        if (count === undefined) return null;
        return count > 99 ? "99+" : count;
      })()}
    </span>
  );
};

export { 
  Avatar, 
  AvatarImage, 
  AvatarFallback, 
  AvatarGroup,
  AvatarBadge,
  avatarVariants,
};
