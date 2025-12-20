import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Code2, 
  Key, 
  Copy, 
  CheckCircle2,
  ExternalLink,
  Globe,
  Lock,
  Zap,
  Package,
  Truck,
  Users,
  Search
} from 'lucide-react';
import { toast } from 'sonner';

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  params?: { name: string; type: string; required: boolean; description: string }[];
  example?: string;
  response?: string;
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/entregas',
    description: 'Lista todas as entregas',
    params: [
      { name: 'status', type: 'string', required: false, description: 'Filtrar por status' },
      { name: 'limit', type: 'number', required: false, description: 'Limite de resultados (default: 50)' },
      { name: 'offset', type: 'number', required: false, description: 'Offset para paginação' },
    ],
    response: `{
  "data": [
    {
      "id": "uuid",
      "numero_entrega": "ENT-001",
      "status": "em_transito",
      "endereco_entrega": "Rua...",
      "previsao_entrega": "2024-01-15",
      "cliente": { "razao_social": "..." },
      "transportadora": { "nome_fantasia": "..." }
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}`,
  },
  {
    method: 'GET',
    path: '/entregas/:id',
    description: 'Obtém uma entrega específica pelo ID',
    response: `{
  "data": {
    "id": "uuid",
    "numero_entrega": "ENT-001",
    "status": "em_transito",
    ...
  }
}`,
  },
  {
    method: 'GET',
    path: '/coletas',
    description: 'Lista todas as coletas',
    params: [
      { name: 'status', type: 'string', required: false, description: 'Filtrar por status' },
      { name: 'limit', type: 'number', required: false, description: 'Limite de resultados' },
      { name: 'offset', type: 'number', required: false, description: 'Offset para paginação' },
    ],
  },
  {
    method: 'GET',
    path: '/coletas/:id',
    description: 'Obtém uma coleta específica pelo ID',
  },
  {
    method: 'GET',
    path: '/transportadoras',
    description: 'Lista todas as transportadoras',
    params: [
      { name: 'homologada', type: 'boolean', required: false, description: 'Filtrar por status de homologação' },
    ],
  },
  {
    method: 'GET',
    path: '/clientes',
    description: 'Lista todos os clientes',
  },
  {
    method: 'GET',
    path: '/rastrear/:codigo',
    description: 'Rastreia uma entrega ou coleta pelo código',
    response: `{
  "type": "entrega",
  "data": {
    "id": "uuid",
    "numero_entrega": "ENT-001",
    "status": "em_transito",
    "link_rastreamento": "...",
    ...
  }
}`,
  },
  {
    method: 'GET',
    path: '/stats',
    description: 'Obtém estatísticas gerais do sistema',
    response: `{
  "data": {
    "total_entregas": 150,
    "total_coletas": 80,
    "transportadoras_ativas": 5,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`,
  },
  {
    method: 'POST',
    path: '/webhook/status',
    description: 'Recebe atualizações de status (webhook)',
    params: [
      { name: 'tipo', type: 'string', required: true, description: '"entrega" ou "coleta"' },
      { name: 'codigo', type: 'string', required: true, description: 'Código da entrega/coleta' },
      { name: 'status', type: 'string', required: true, description: 'Novo status' },
      { name: 'data_atualizacao', type: 'string', required: false, description: 'Data da atualização (ISO 8601)' },
      { name: 'observacao', type: 'string', required: false, description: 'Observação adicional' },
    ],
    example: `{
  "tipo": "entrega",
  "codigo": "ENT-001",
  "status": "entregue",
  "observacao": "Entregue para porteiro"
}`,
  },
];

const getMethodColor = (method: string) => {
  switch (method) {
    case 'GET': return 'bg-green-500';
    case 'POST': return 'bg-blue-500';
    case 'PUT': return 'bg-amber-500';
    case 'DELETE': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export default function APIDocumentation() {
  const [apiKey, setApiKey] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');

  const generateApiKey = () => {
    const key = `lf_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
    setGeneratedKey(key);
    toast.success('Chave API gerada com sucesso!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Code2 className="w-8 h-8 text-primary" />
              </div>
              API Pública
            </h1>
            <p className="text-muted-foreground mt-1">
              Documentação da API REST para integração externa
            </p>
          </div>
          <Badge variant="outline" className="gap-2 px-4 py-2">
            <Globe className="h-4 w-4" />
            v1.0.0
          </Badge>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="authentication">Autenticação</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="examples">Exemplos</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <Zap className="h-6 w-6 text-green-500" />
                    </div>
                    <div>
                      <p className="font-semibold">RESTful API</p>
                      <p className="text-sm text-muted-foreground">Endpoints JSON padronizados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-blue-500/10">
                      <Lock className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold">API Key Auth</p>
                      <p className="text-sm text-muted-foreground">Autenticação via header</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <Globe className="h-6 w-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-semibold">CORS Enabled</p>
                      <p className="text-sm text-muted-foreground">Aceita requisições de qualquer origem</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Base URL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted font-mono text-sm">
                  <code className="flex-1">{API_BASE_URL}</code>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => copyToClipboard(API_BASE_URL)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recursos Disponíveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Package className="h-5 w-5 text-primary" />
                    <span>Entregas</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Package className="h-5 w-5 text-primary" />
                    <span>Coletas</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Truck className="h-5 w-5 text-primary" />
                    <span>Transportadoras</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Users className="h-5 w-5 text-primary" />
                    <span>Clientes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authentication Tab */}
          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Autenticação via API Key
                </CardTitle>
                <CardDescription>
                  Todas as requisições devem incluir uma chave API válida no header
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted font-mono text-sm">
                  <p className="text-muted-foreground mb-2">Header requerido:</p>
                  <code>x-api-key: sua_chave_api</code>
                </div>

                <div className="space-y-2">
                  <Label>Gerar Nova Chave de Teste</Label>
                  <div className="flex gap-2">
                    <Button onClick={generateApiKey} className="gap-2">
                      <Key className="h-4 w-4" />
                      Gerar Chave
                    </Button>
                    {generatedKey && (
                      <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-muted font-mono text-sm">
                        <code className="flex-1">{generatedKey}</code>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => copyToClipboard(generatedKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Esta é uma chave de demonstração. Em produção, implemente validação adequada.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exemplo de Requisição</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
{`curl -X GET "${API_BASE_URL}/entregas" \\
  -H "x-api-key: lf_sua_chave_aqui" \\
  -H "Content-Type: application/json"`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-4">
            {endpoints.map((endpoint, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <code className="font-mono text-lg">{endpoint.path}</code>
                  </div>
                  <CardDescription>{endpoint.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {endpoint.params && endpoint.params.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Parâmetros</h4>
                      <div className="space-y-2">
                        {endpoint.params.map((param, pIndex) => (
                          <div key={pIndex} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                            <code className="font-mono text-sm">{param.name}</code>
                            <Badge variant="outline" className="text-xs">{param.type}</Badge>
                            {param.required && <Badge variant="destructive" className="text-xs">required</Badge>}
                            <span className="text-sm text-muted-foreground">{param.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {endpoint.example && (
                    <div>
                      <h4 className="font-medium mb-2">Request Body</h4>
                      <pre className="p-3 rounded bg-muted font-mono text-sm overflow-x-auto">
                        {endpoint.example}
                      </pre>
                    </div>
                  )}

                  {endpoint.response && (
                    <div>
                      <h4 className="font-medium mb-2">Response</h4>
                      <pre className="p-3 rounded bg-muted font-mono text-sm overflow-x-auto">
                        {endpoint.response}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>JavaScript / Fetch</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
{`// Listar entregas
const response = await fetch('${API_BASE_URL}/entregas?limit=10', {
  headers: {
    'x-api-key': 'sua_chave_api',
    'Content-Type': 'application/json'
  }
});
const data = await response.json();
console.log(data);`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Python / Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
{`import requests

headers = {
    'x-api-key': 'sua_chave_api',
    'Content-Type': 'application/json'
}

# Rastrear uma entrega
response = requests.get(
    '${API_BASE_URL}/rastrear/ENT-001',
    headers=headers
)
print(response.json())`}
                </pre>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Webhook de Atualização</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 rounded-lg bg-muted font-mono text-sm overflow-x-auto">
{`// Enviar atualização de status via webhook
const response = await fetch('${API_BASE_URL}/webhook/status', {
  method: 'POST',
  headers: {
    'x-api-key': 'sua_chave_api',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    tipo: 'entrega',
    codigo: 'ENT-001',
    status: 'entregue',
    observacao: 'Entregue para o destinatário'
  })
});`}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
