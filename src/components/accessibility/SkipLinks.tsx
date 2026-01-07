import { Button } from "@/components/ui/button";

interface SkipLink {
  id: string;
  label: string;
}

const defaultLinks: SkipLink[] = [
  { id: "main-content", label: "Ir para conteúdo principal" },
  { id: "main-navigation", label: "Ir para navegação" },
  { id: "search", label: "Ir para busca" },
];

interface SkipLinksProps {
  links?: SkipLink[];
}

export function SkipLinks({ links = defaultLinks }: SkipLinksProps) {
  const handleSkip = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav
      aria-label="Links de atalho"
      className="sr-only focus-within:not-sr-only focus-within:fixed focus-within:top-0 focus-within:left-0 focus-within:z-[100] focus-within:p-4 focus-within:bg-background focus-within:shadow-lg"
    >
      <ul className="flex flex-col gap-2">
        {links.map((link) => (
          <li key={link.id}>
            <Button
              variant="default"
              size="sm"
              onClick={() => handleSkip(link.id)}
              className="focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {link.label}
            </Button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
