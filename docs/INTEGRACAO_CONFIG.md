# Configuração de Integrações - Loggi Flow

## 📋 Visão Geral

Este documento descreve como configurar as integrações externas do sistema Loggi Flow.

---

## 🚚 Lalamove

### Obter Credenciais

1. Acesse [Lalamove Developer Portal](https://developers.lalamove.com/)
2. Crie uma conta de desenvolvedor
3. Obtenha as credenciais:
   - `API_KEY`: Chave de API
   - `API_SECRET`: Segredo para assinatura HMAC

### Configurar no Supabase

```bash
# Via Supabase CLI
supabase secrets set LALAMOVE_API_KEY=your_api_key
supabase secrets set LALAMOVE_API_SECRET=your_api_secret
supabase secrets set LALAMOVE_ENV=sandbox  # ou 'production'
```

### Registrar Webhook

Configure o webhook no painel Lalamove para receber atualizações:

```
URL: https://[PROJECT_REF].supabase.co/functions/v1/lalamove-webhook
Method: POST
Events: ORDER_STATUS_CHANGED, DRIVER_LOCATION_UPDATED
```

---

## 🗺️ Mapbox

### Obter Token

1. Acesse [Mapbox](https://account.mapbox.com/)
2. Crie uma conta ou faça login
3. Vá em "Access Tokens"
4. Copie o token público ou crie um novo

### Configurar no Supabase

```bash
supabase secrets set MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
```

### Uso no Frontend

O token é obtido automaticamente pela Edge Function `get-mapbox-token`.

---

## 🔐 Variáveis de Ambiente Necessárias

### Supabase Edge Functions

| Variável | Descrição | Obrigatório |
|----------|-----------|-------------|
| `LALAMOVE_API_KEY` | Chave API Lalamove | Sim (para rastreamento) |
| `LALAMOVE_API_SECRET` | Segredo Lalamove | Sim (para rastreamento) |
| `LALAMOVE_ENV` | `sandbox` ou `production` | Não (default: sandbox) |
| `MAPBOX_ACCESS_TOKEN` | Token público Mapbox | Sim (para mapas) |

### Como Verificar

```bash
# Listar secrets configurados
supabase secrets list

# Testar Edge Function
curl -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/get-mapbox-token' \
  -H 'Authorization: Bearer [ANON_KEY]'
```

---

## 📡 Webhooks n8n

Para integrar com n8n, configure webhooks que disparam em eventos específicos.

### Eventos Disponíveis

| Evento | Tabela | Trigger |
|--------|--------|---------|
| Nova Coleta | `coletas` | INSERT |
| Coleta Atualizada | `coletas` | UPDATE |
| Nova Entrega | `entregas` | INSERT |
| Entrega Finalizada | `entregas` | UPDATE (status = 'entregue') |
| Nova Ocorrência | `ocorrencias` | INSERT |

### Exemplo de Trigger para n8n

```sql
-- Criar função para chamar webhook
CREATE OR REPLACE FUNCTION notify_n8n_webhook()
RETURNS trigger AS $$
DECLARE
  webhook_url TEXT := 'https://seu-n8n.com/webhook/loggi-flow';
BEGIN
  -- Enviar para n8n via pg_net (extensão Supabase)
  PERFORM net.http_post(
    url := webhook_url,
    body := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'event', TG_OP,
      'old', OLD,
      'new', NEW
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar em coletas
CREATE TRIGGER notify_n8n_coletas
AFTER INSERT OR UPDATE ON coletas
FOR EACH ROW EXECUTE FUNCTION notify_n8n_webhook();
```

---

## 🔗 Integração Bitrix24

### Webhook Principal

```
URL: https://promobrindes.bitrix24.com.br/rest/1/[WEBHOOK_CODE]/
```

### SPAs Relacionadas

| SPA | EntityTypeId | Prefixo |
|-----|--------------|---------|
| EXPEDIÇÃO | 1502 | UF_CRM_194_ |
| LALAMOVE | 1690 | UF_CRM_276_ |

### Sincronização Recomendada

Configure no n8n:
1. Trigger: Supabase Database Change
2. HTTP Request: POST para Bitrix24 REST API
3. Mapeamento de campos conforme documentação SPA

---

## ✅ Checklist de Configuração

- [ ] Criar conta Lalamove Developer
- [ ] Obter API Key e Secret Lalamove
- [ ] Configurar secrets no Supabase
- [ ] Registrar webhook Lalamove
- [ ] Criar conta Mapbox
- [ ] Obter token Mapbox
- [ ] Configurar MAPBOX_ACCESS_TOKEN
- [ ] Testar Edge Functions
- [ ] Configurar webhooks n8n (opcional)
- [ ] Configurar integração Bitrix24 (opcional)

---

## 🆘 Troubleshooting

### Erro "LALAMOVE_API_KEY not set"

```bash
supabase secrets set LALAMOVE_API_KEY=your_key
supabase functions deploy lalamove-tracking
```

### Mapas não carregam

1. Verificar se token Mapbox está configurado
2. Verificar se token tem permissões corretas
3. Testar endpoint `get-mapbox-token`

### Webhooks não disparam

1. Verificar URL do webhook
2. Verificar se extensão `pg_net` está habilitada
3. Verificar logs do Supabase

---

*Última atualização: Dezembro 2024*
