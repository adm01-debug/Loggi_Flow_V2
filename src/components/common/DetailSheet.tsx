import * as React from "react";
import { X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface DetailSection {
  label: string;
  value: React.ReactNode;
  fullWidth?: boolean;
}

interface DetailTab {
  id: string;
  label: string;
  content: React.ReactNode;
  badge?: number;
}

interface DetailSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  sections?: DetailSection[];
  tabs?: DetailTab[];
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  side?: "left" | "right";
  className?: string;
  children?: React.ReactNode;
}

export function DetailSheet({
  open,
  onClose,
  title,
  description,
  sections,
  tabs,
  actions,
  footer,
  side = "right",
  className,
  children,
}: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side={side} className={cn("w-full sm:max-w-lg", className)}>
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle>{title}</SheetTitle>
              {description && (
                <SheetDescription>{description}</SheetDescription>
              )}
            </div>
            {actions}
          </div>
        </SheetHeader>

        <div className="mt-6 flex-1 overflow-y-auto">
          {sections && sections.length > 0 && (
            <div className="grid gap-4">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className={cn(
                    "grid gap-1",
                    section.fullWidth ? "col-span-2" : ""
                  )}
                >
                  <dt className="text-sm font-medium text-muted-foreground">
                    {section.label}
                  </dt>
                  <dd className="text-sm">{section.value || "-"}</dd>
                </div>
              ))}
            </div>
          )}

          {sections && tabs && <Separator className="my-6" />}

          {tabs && tabs.length > 0 && (
            <Tabs defaultValue={tabs[0].id} className="w-full">
              <TabsList className="w-full justify-start">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="gap-2">
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                        {tab.badge}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {tab.content}
                </TabsContent>
              ))}
            </Tabs>
          )}

          {children}
        </div>

        {footer && (
          <SheetFooter className="mt-6">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Helper para criar seções facilmente
export function createDetailSections(
  data: Record<string, any>,
  labels: Record<string, string>
): DetailSection[] {
  return Object.entries(labels).map(([key, label]) => ({
    label,
    value: data[key],
  }));
}

export default DetailSheet;
