import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

interface SortIconProps {
  dir: "asc" | "desc" | null;
}

export function SortIcon({ dir }: SortIconProps) {
  if (!dir) return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
  return dir === "asc" ? (
    <ChevronUp className="w-4 h-4" />
  ) : (
    <ChevronDown className="w-4 h-4" />
  );
}
