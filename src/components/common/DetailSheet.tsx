import { ReactNode } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Edit, Trash2, ExternalLink } from "lucide-react";

interface DetailField {
  label: string;
  value: ReactNode;
  fullWidth?: boolean;
}

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  badge?: { label: string; variant?: "default" | "secondary" | "destructive" | "outline" };
  fields: DetailField[];
  actions?: {
    onEdit?: () => void;
    onDelete?: () => void;
    onExternalLink?: () => void;
    custom?: ReactNode;
  };
  children?: ReactNode;
}

export function DetailSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  fields,
  actions,
  children,
}: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="flex items-center gap-2">
                {title}
                {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
              </SheetTitle>
              {subtitle && <SheetDescription>{subtitle}</SheetDescription>}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] mt-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {fields.map((field, i) => (
                <div key={i} className={field.fullWidth ? "col-span-2" : ""}>
                  <p className="text-sm text-muted-foreground">{field.label}</p>
                  <div className="mt-1">{field.value || <span className="text-muted-foreground">-</span>}</div>
                </div>
              ))}
            </div>

            {children && (
              <>
                <Separator />
                {children}
              </>
            )}
          </div>
        </ScrollArea>

        {actions && (
          <SheetFooter className="mt-4">
            <div className="flex items-center gap-2 w-full">
              {actions.onExternalLink && (
                <Button variant="outline" size="sm" onClick={actions.onExternalLink}>
                  <ExternalLink className="w-4 h-4 mr-2" />Abrir
                </Button>
              )}
              {actions.onEdit && (
                <Button variant="outline" size="sm" onClick={actions.onEdit}>
                  <Edit className="w-4 h-4 mr-2" />Editar
                </Button>
              )}
              {actions.onDelete && (
                <Button variant="destructive" size="sm" onClick={actions.onDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />Excluir
                </Button>
              )}
              {actions.custom}
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
