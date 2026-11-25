import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Code,
  Copy,
  CheckCircle2,
  Book,
  Shield,
  Server,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/components/common/FilterBar";
import { useFilters } from "@/hooks/common/useFilters";
import { sanitizarUrlSupabase } from "@/lib/supabaseEnv";

interface Endpoint {
  id: string;
  method: string;
  path: string; // caminho relativo ex. /functions/v1/predict-delays
  auth: boolean;
  description: string;
  category: string;
}

// Edge functions reais do Supabase (supabase/functions/<nome>/index.ts).
// A base real é resolvida do ambiente em runtime; ver APIDocumentation para uso.
const endpoints: Endpoint[] = [
  {
    id: "latency",
    method: "POST",
    path: "/functions/v1/predict-delays",
    auth: true,
    description: "Prever atrasos (IA) com base no histórico",
    category: "ia",
  },
  {
    id: "carrier",
    method: "POST",
    path: "/functions/v1/smart-carrier-selection",
    auth: true,
    description: "Seleção inteligente de transportadora",
    category: "ia",
  },
  {
    id: "assistant",
    method: "POST",
    path: "/functions/v1/ai-logistics-assistant",
    auth: true,
    description: "Assistente de IA da plataforma",
    category: "ia",
  },
  {
    id: "geocode",
    method: "POST",
    path: "/functions/v1/geocode-address",
    auth: true,
    description: "Geocodificar endereço (Nominatim)",
    category: "integracao",
  },
  {
    id: "weather",
    method: "POST",
    path: "/functions/v1/get-weather-data",
    auth: false,
    description: "Clima atual para previsões",
    category: "integracao",
  },
  {
    id: "webhook-status",
    method: "POST",
    path: "/functions/v1/webhook-status",
    auth: true,
    description: "Status de webhooks de transportadoras",
    category: "integracao",
  },
  {
    id: "normalize",
    method: "POST",
    path: "/functions/v1/normalize-freight-response",
    auth: true,
    description: "Normalizar resposta de frete",
    category: "integracao",
  },
  {
    id: "resend",
    method: "POST",
    path: "/functions/v1/resend-email",
    auth: true,
    description: "Envio de e-mail transacional",
    category: "comunicacao",
  },
  {
    id: "send-password-reset",
    method: "POST",
    path: "/functions/v1/send-password-reset",
    auth: false,
    description: "Enviar link de redefinição de senha",
    category: "auth",
  },
  {
    id: "secure-store",
    method: "POST",
    path: "/functions/v1/secure-store",
    auth: true,
    description: "Armazenar credenciais de integrações",
    category: "seguranca",
  },
  {
    id: "lgpd",
    method: "POST",
    path: "/functions/v1/lgpd-erase-user",
    auth: true,
    description: "Apagamento de dados do usuário (LGPD)",
    category: "seguranca",
  },
  {
    id: "check-password-breach",
    method: "POST",
    path: "/functions/v1/check-password-breach",
    auth: true,
    description: "Verificar senha em vazamentos",
    category: "seguranca",
  },
  {
    id: "rodonaves",
    method: "POST",
    path: "/functions/v1/rodonaves-api",
    auth: true,
    description: "Integração com Rodonaves",
    category: "transportadora",
  },
  {
    id: "lalamove",
    method: "POST",
    path: "/functions/v1/lalamove-api",
    auth: true,
    description: "Integração com Lalamove",
    category: "transportadora",
  },
  {
    id: "melhor-envio",
    method: "POST",
    path: "/functions/v1/melhor-envio-api",
    auth: true,
    description: "Integração com Melhor Envio",
    category: "transportadora",
  },
  {
    id: "carrier-webhook",
    method: "POST",
    path: "/functions/v1/carrier-webhook-receiver",
    auth: false,
    description: "Receber webhooks de transportadoras",
    category: "transportadora",
  },
];

const methodColors: Record<string, string> = {
  GET: "bg-success/15 text-success",
  POST: "bg-info/15 text-info",
  PUT: "bg-warning/15 text-warning",
  DELETE: "bg-destructive/15 text-destructive",
};

const categoryLabels: Record<string, string> = {
  ia: "IA",
  integracao: "Integração",
  comunicacao: "Comunicação",
  auth: "Auth",
  seguranca: "Segurança",
  transportadora: "Transportadora",
};

export default function APIDocumentation() {
  const [copied, setCopied] = useState<string | null>(null);
  const [methodFilter, setMethodFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const baseUrl = sanitizarUrlSupabase(import.meta.env.VITE_SUPABASE_URL) ?? "";
  const fullBase = baseUrl ? `${baseUrl}/functions/v1` : null;

  const { filteredData, filters, setSearch, clearFilters, hasActiveFilters } =
    useFilters(endpoints, {
      search: { fields: ["path", "description"] as (keyof Endpoint)[] },
    });

  const fullyFilteredData = filteredData.filter((endpoint) => {
    if (methodFilter !== "all" && endpoint.method !== methodFilter)
      return false;
    if (categoryFilter !== "all" && endpoint.category !== categoryFilter)
      return false;
    return true;
  });

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success("Copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-display flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted/50">
                <Code className="w-6 h-6 text-muted-foreground" />
              </div>
              API Documentation
            </h1>
            <p className="text-muted-foreground mt-1">
              Edge functions do Supabase (Supabase Functions)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card text-center">
            <Code className="w-5 h-5 text-info mx-auto mb-2" />
            <p className="text-2xl font-bold">{endpoints.length}</p>
            <p className="text-xs text-muted-foreground">Endpoints</p>
          </div>
          <div className="stat-card text-center">
            <Server className="w-5 h-5 text-warning mx-auto mb-2" />
            <p className="text-2xl font-bold">Functions</p>
            <p className="text-xs text-muted-foreground">Runtime</p>
          </div>
          <div className="stat-card text-center">
            <Shield className="w-5 h-5 text-success mx-auto mb-2" />
            <p className="text-2xl font-bold">
              {endpoints.filter((e) => e.auth).length}
            </p>
            <p className="text-xs text-muted-foreground">Com auth JWT</p>
          </div>
          <div className="stat-card text-center">
            <Book className="w-5 h-5 text-accent-foreground mx-auto mb-2" />
            <p className="text-2xl font-bold">v1</p>
            <p className="text-xs text-muted-foreground">Versão</p>
          </div>
        </div>

        {fullBase === null && (
          <div className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
            <Info className="w-4 h-4 mt-0.5 text-warning" />
            <span>
              Base URL do Supabase não configurada no ambiente. Os endpoints
              abaixo usam o caminho relativo{" "}
              <code className="font-mono">/functions/v1/…</code>.
            </span>
          </div>
        )}
        {fullBase !== null && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <span className="font-mono text-xs text-muted-foreground">
              Base URL real
            </span>
            <div className="font-mono text-xs break-all mt-1">{fullBase}</div>
          </div>
        )}

        <Tabs defaultValue="endpoints">
          <TabsList>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="auth">Autenticação</TabsTrigger>
            <TabsTrigger value="examples">Exemplos</TabsTrigger>
          </TabsList>

          <TabsContent value="endpoints" className="space-y-4">
            <FilterBar
              search={filters.search}
              onSearchChange={setSearch}
              searchPlaceholder="Buscar endpoint..."
              status={methodFilter}
              onStatusChange={setMethodFilter}
              statusOptions={[{ value: "POST", label: "POST" }]}
              statusLabel="Método"
              extraFilters={[
                {
                  key: "category",
                  value: categoryFilter,
                  onChange: setCategoryFilter,
                  options: Object.keys(categoryLabels).map((k) => ({
                    value: k,
                    label: categoryLabels[k],
                  })),
                  label: "Categoria",
                },
              ]}
              hasActiveFilters={
                hasActiveFilters ||
                methodFilter !== "all" ||
                categoryFilter !== "all"
              }
              onClearFilters={() => {
                clearFilters();
                setMethodFilter("all");
                setCategoryFilter("all");
              }}
              totalFiltered={fullyFilteredData.length}
              totalOriginal={endpoints.length}
            />

            <div className="space-y-2">
              {fullyFilteredData.map((e) => (
                <div
                  key={e.id}
                  className="card-interactive flex items-center gap-4"
                >
                  <Badge
                    className={cn(
                      "font-mono w-16 justify-center",
                      methodColors[e.method],
                    )}
                  >
                    {e.method}
                  </Badge>
                  <code className="flex-1 font-mono text-sm break-all">
                    {e.path}
                  </code>
                  <span className="text-sm text-muted-foreground">
                    {e.description}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline">
                      {categoryLabels[e.category]}
                    </Badge>
                    {e.auth ? (
                      <Badge className="bg-success/15 text-success">JWT</Badge>
                    ) : (
                      <Badge variant="secondary">Público</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      copyToClipboard(
                        e.auth && fullBase
                          ? `${fullBase}/${e.path.split("/functions/v1/")[1]}`
                          : e.path,
                        e.id,
                      )
                    }
                  >
                    {copied === e.id ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="auth" className="card-base p-6">
            <h3 className="font-semibold mb-4">Autenticação</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Funções marcadas como{" "}
              <Badge className="bg-success/15 text-success">JWT</Badge> exigem o
              header Authorization com o token da sessão do usuário logado.
              Funções <Badge variant="secondary">Público</Badge> não exigem, mas
              só devem ser chamadas pelo front-of-front (nunca exponha
              segredos).
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <p>Authorization: Bearer {"<seu_token>"}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Componentes reutilizáveis no front:{" "}
              <code className="font-mono">callFunction</code> (padrão)
            </p>
          </TabsContent>

          <TabsContent value="examples" className="card-base p-6">
            <h3 className="font-semibold mb-4">Exemplo de Requisição</h3>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`curl -X POST ${fullBase ?? "https://<ref>.supabase.co"}/predict-delays \\
  -H "Authorization: Bearer <token>" -H "apikey: <anon_key>" \\
  -H "Content-Type: application/json"`}</pre>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
