# Onboarding do Desenvolvedor — LogiFlow

## 🚀 Checklist 0 → Deploy (Meta: < 4 horas)

Este guia visa tornar o novo desenvolvedor produtivo no menor tempo possível.

### 1. Requisitos Iniciais (15 min)
- [ ] Instalar Node.js 20+
- [ ] Instalar Docker Desktop (para Supabase Local, opcional)
- [ ] Acesso ao repositório no GitHub
- [ ] Acesso ao dashboard da Lovable

### 2. Configuração do Ambiente (45 min)
```bash
git clone https://github.com/usuario/logiflow.git
cd logiflow
npm install
cp .env.example .env
```
- Solicitar `SUPABASE_URL` e `SUPABASE_ANON_KEY` ao líder técnico.

### 3. Arquitetura e Padrões (60 min)
- [ ] Ler `docs/ARCHITECTURE.md`
- [ ] Entender o padrão **400 linhas/arquivo** (ESLint enforced)
- [ ] Familiarizar-se com `src/integrations/supabase/client.ts`

### 4. Primeiro Commit (90 min)
- [ ] Criar uma nova branch `feat/onboarding-<nome>`
- [ ] Adicionar um log de telemetria em uma página existente usando `useTelemetry`
- [ ] Rodar testes: `npm test`
- [ ] Abrir Pull Request

### 5. Deploy em Preview (30 min)
- [ ] Verificar o build automático no GitHub Actions
- [ ] Validar a mudança no ambiente de preview da Lovable

## 📚 Documentação de Apoio
- `docs/HOOKS_COMPONENTS_API.md`: Guia de componentes UI.
- `docs/MIGRATION-GUIDE.md`: Como lidar com o banco de dados.
