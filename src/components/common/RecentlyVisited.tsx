import { History } from "lucide-react";
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

export function RecentlyVisited() {
  const { recentPages } = useNavigationHistory();

  // Skip if less than 2 pages visited
  if (recentPages.length < 2) return null;

  // Show only pages that aren't the current one
  const otherPages = recentPages.slice(1, 6);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          aria-label="Páginas recentes"
        >
          <History className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Visitadas recentemente
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {otherPages.map((page) => (
          <DropdownMenuItem key={page.path} asChild>
            <Link
              to={page.path}
              className={cn(
                "flex items-center gap-2 cursor-pointer",
                "text-sm"
              )}
            >
              <span className="truncate">{page.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
