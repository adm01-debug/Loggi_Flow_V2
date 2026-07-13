// Shared badge severity helpers for observability cards.
type BadgeVariant = "default" | "destructive" | "secondary" | "outline";

/** critical → destructive, warning → default, else → secondary */
export function severityVariantDefault(s: string): BadgeVariant {
  if (s === "critical") return "destructive";
  if (s === "warning") return "default";
  return "secondary";
}

/** critical → destructive, warning → secondary, else → outline */
export function severityVariantMuted(s: string): BadgeVariant {
  if (s === "critical") return "destructive";
  if (s === "warning") return "secondary";
  return "outline";
}

/** critical → destructive, warning → default, info → secondary, else → outline */
export function severityVariantExtended(s: string): BadgeVariant {
  if (s === "critical") return "destructive";
  if (s === "warning") return "default";
  if (s === "info") return "secondary";
  return "outline";
}
