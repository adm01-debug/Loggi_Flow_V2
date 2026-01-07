import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const Tabs = TabsPrimitive.Root;

const tabsListVariants = cva("inline-flex items-center justify-center", {
  variants: {
    variant: {
      default: "rounded-xl bg-muted/50 p-1.5 gap-1",
      pills: "gap-2",
      underline: "border-b border-border gap-0",
      segment: "rounded-full bg-muted p-1 gap-0.5",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

interface TabsListProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>,
    VariantProps<typeof tabsListVariants> {}

const TabsList = React.forwardRef<React.ElementRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, variant, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
);
TabsList.displayName = TabsPrimitive.List.displayName;

const tabsTriggerVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: [
          "rounded-lg px-4 py-2 text-sm text-muted-foreground",
          "hover:text-foreground hover:bg-background/50",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md",
        ].join(" "),
        pills: [
          "rounded-full px-4 py-2 text-sm text-muted-foreground border border-transparent",
          "hover:text-foreground hover:bg-muted",
          "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-md",
        ].join(" "),
        underline: [
          "relative px-4 py-3 text-sm text-muted-foreground rounded-none",
          "hover:text-foreground",
          "data-[state=active]:text-primary",
          "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent after:transition-colors",
          "data-[state=active]:after:bg-primary",
        ].join(" "),
        segment: [
          "rounded-full px-4 py-1.5 text-sm text-muted-foreground",
          "hover:text-foreground",
          "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
        ].join(" "),
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>,
    VariantProps<typeof tabsTriggerVariants> {
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

const TabsTrigger = React.forwardRef<React.ElementRef<typeof TabsPrimitive.Trigger>, TabsTriggerProps>(
  ({ className, variant, icon, badge, children, ...props }, ref) => (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(tabsTriggerVariants({ variant }), className)}
      {...props}
    >
      {icon}
      {children}
      {badge}
    </TabsPrimitive.Trigger>
  )
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> & { animated?: boolean }
>(({ className, animated = false, children, ...props }, ref) => {
  // Simplified TabsContent - animation should be handled externally with AnimatePresence
  // Setting animated=false by default to prevent duplicate key issues
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };