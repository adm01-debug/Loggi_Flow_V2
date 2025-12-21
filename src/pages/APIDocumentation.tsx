import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Code, Copy, CheckCircle2, ExternalLink, Search, Book, Zap, Shield, Globe } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { FilterBar } from "@/components/common/FilterBar";
import { useFilters, FilterConfig } from "@/hooks/useFilters";

interface Endpoint { id: string; method: string; path: string; description: string; category: string; }

const endpoints: Endpoint[] = [
  { id: "1", method: "GET", path: "/api/entregas", description: "Listar todas entregas", category: "entregas" },
  { id: "2", method: "GET", path: "/api/entregas/:id", description: "Buscar entrega por ID", category: "entregas" },
  { id: "3", method: "POST", path: "/api/entregas", description: "Criar nova entrega", category: "entregas" },
  { id: "4", method: "PUT", path: "/api/entregas/:id", description: "Atualizar entrega", category: "entregas" },
  { id: "5", method: "GET", path: "/api/coletas", description: "Listar todas coletas", category: "coletas" },
  { id: "6", method: "POST", path: "/api/coletas", description: "Criar nova coleta", category: "coletas" },
  { id: "7", method: "GET", path: "/api/clientes", description: "Listar clientes", category: "clientes" },
  { id: "8", method: "GET", path: "/api/transportadoras", description: "Listar transportadoras", category: "transportadoras" },
  { id: "9", method: "POST", path: "/api/predict-delays", description: "Prever atrasos (IA)", category: "ia" },
  { id: "10", method: "POST", path: "/api/smart-carrier", description: "Seleção inteligente de transportadora", category: "ia" },
];

const methodColors: Record<string, string> = { GET: "bg-green-100 text-green-700", POST: "bg-blue-100 text-blue-700", PUT: "bg-amber-100 text-amber-700", DELETE: "bg-red-100 text-red-700" };

const filterConfig: FilterConfig<Endpoint>[] = [
  { key: "search", type: "search", fields: ["path", "description"] },
  { key: "method", type: "select", field: "method", options: [{ value: "GET", label: "GET" }, { value: "POST", label: "POST" }, { value: "PUT", label: "PUT" }, { value: "DELETE", label: "DELETE" }] },
  { key: "category", type: "select", field: "category", options: [{ value: "entregas", label: "Entregas" }, { value: "coletas", label: "Coletas" }, { value: "clientes", label: "Clientes" }, { value: "transportadoras", label: "Transportadoras" }, { value: "ia", label: "IA" }] }
];

export default function APIDocumentation() {
  const [copied, setCopied] = useState<string | null>(null);
  const { filteredData, filters, setFilter, clearFilters, hasActiveFilters } = useFilters(endpoints, filterConfig);

  const copyToClipboard = (text: string, id: string) => { navigator.clipboard.writeText(text); setCopied(id); toast.success("Copiado!"); setTimeout(() => setCopied(null), 2000); };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div><h1 className="text-display flex items-center gap-3"><div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-slate-400/20 to-slate-600/10"><Code className="w-6 h-6 text-slate-500" /></div>API Documentation</h1><p className="text-muted-foreground mt-1">Documentação da API REST</p></div>
          <Button variant="outline"><ExternalLink className="w-4 h-4 mr-2" />Swagger UI</Button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card text-center"><Globe className="w-5 h-5 text-blue-500 mx-auto mb-2" /><p className="text-2xl font-bold">{endpoints.length}</p><p className="text-xs text-muted-foreground">Endpoints</p></div>
          <div className="stat-card text-center"><Zap className="w-5 h-5 text-amber-500 mx-auto mb-2" /><p className="text-2xl font-bold">REST</p><p className="text-xs text-muted-foreground">Protocolo</p></div>
          <div className="stat-card text-center"><Shield className="w-5 h-5 text-green-500 mx-auto mb-2" /><p className="text-2xl font-bold">JWT</p><p className="text-xs text-muted-foreground">Auth</p></div>
          <div className="stat-card text-center"><Book className="w-5 h-5 text-purple-500 mx-auto mb-2" /><p className="text-2xl font-bold">v1</p><p className="text-xs text-muted-foreground">Versão</p></div>
        </div>
        <Tabs defaultValue="endpoints"><TabsList><TabsTrigger value="endpoints">Endpoints</TabsTrigger><TabsTrigger value="auth">Autenticação</TabsTrigger><TabsTrigger value="examples">Exemplos</TabsTrigger></TabsList>
          <TabsContent value="endpoints" className="space-y-4">
            <FilterBar searchValue={filters.search as string || ""} onSearchChange={(v) => setFilter("search", v)} searchPlaceholder="Buscar endpoint..." filters={[{ key: "method", label: "Método", type: "select", value: filters.method as string || "", options: [{ value: "", label: "Todos" }, { value: "GET", label: "GET" }, { value: "POST", label: "POST" }, { value: "PUT", label: "PUT" }], onChange: (v) => setFilter("method", v || undefined) }, { key: "category", label: "Categoria", type: "select", value: filters.category as string || "", options: [{ value: "", label: "Todas" }, { value: "entregas", label: "Entregas" }, { value: "coletas", label: "Coletas" }, { value: "ia", label: "IA" }], onChange: (v) => setFilter("category", v || undefined) }]} onClearFilters={clearFilters} hasActiveFilters={hasActiveFilters} totalCount={filteredData.length} filteredCount={filteredData.length} />
            <div className="space-y-2">{filteredData.map((e) => (
              <div key={e.id} className="card-interactive flex items-center gap-4">
                <Badge className={cn("font-mono w-16 justify-center", methodColors[e.method])}>{e.method}</Badge>
                <code className="flex-1 font-mono text-sm">{e.path}</code>
                <span className="text-sm text-muted-foreground">{e.description}</span>
                <Badge variant="outline">{e.category}</Badge>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(e.path, e.id)}>{copied === e.id ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</Button>
              </div>
            ))}</div>
          </TabsContent>
          <TabsContent value="auth" className="card-base p-6"><h3 className="font-semibold mb-4">Autenticação</h3><p className="text-sm text-muted-foreground mb-4">Todas as requisições devem incluir o header Authorization com um token JWT válido.</p><div className="bg-muted p-4 rounded-lg font-mono text-sm"><p>Authorization: Bearer {'<seu_token>'}</p></div></TabsContent>
          <TabsContent value="examples" className="card-base p-6"><h3 className="font-semibold mb-4">Exemplo de Requisição</h3><pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">{`curl -X GET https://api.loggi-flow.com/api/entregas \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json"`}</pre></TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
