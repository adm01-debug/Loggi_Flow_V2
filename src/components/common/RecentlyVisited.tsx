import { History, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigationHistory } from "@/hooks/useNavigationHistory";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function RecentlyVisited() {
  const { recentPages } = useNavigationHistory();

  // Show even with 1 page to allow quick navigation
  if (recentPages.length === 0) return null;

  // Show only pages that aren't the current one for "Other" pages
  const otherPages = recentPages.slice(1, 8);

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all active:scale-90"
                aria-label="Atalhos de páginas recentes"
              >
                <History className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs font-medium">Acesso Rápido / Recentes</p>
          </TooltipContent>
          
          <DropdownMenuContent align="end" className="w-64 border-2 border-primary/5 shadow-xl animate-in zoom-in-95 duration-200">
            <DropdownMenuLabel className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 py-2">
              Visitadas recentemente
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {otherPages.length > 0 ? (
              otherPages.map((page, idx) => (
                <DropdownMenuItem key={`${page.path}-${idx}`} asChild>
                  <Link
                    to={page.path}
                    className={cn(
                      "flex items-center justify-between gap-2 cursor-pointer py-2.5 px-3 group transition-colors",
                      "hover:bg-primary/5"
                    )}
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                        {page.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate opacity-70">
                        {page.path}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                  </Link>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground italic">
                Apenas a página atual no histórico
              </div>
            )}
            {recentPages.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/" className="justify-center text-xs font-bold text-primary hover:bg-primary/5 cursor-pointer py-2">
                    Ver Dashboard Principal
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </Tooltip>
    </TooltipProvider>
  );
}
