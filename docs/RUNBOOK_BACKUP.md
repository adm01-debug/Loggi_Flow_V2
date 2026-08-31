# 📑 Runbook: Backup & Disaster Recovery - LogiFlow

> **Versão:** 1.0
> **Status:** Ativo
> **Responsabilidade:** DevOps / SRE

## 1. Estratégia de Backup
O LogiFlow utiliza a infraestrutura do Lovable Cloud (Supabase), que oferece backups automáticos diários. No entanto, para conformidade e segurança adicional, seguimos o protocolo abaixo.

### 1.1 Backups Automatizados
- **Frequência:** Diária (凌晨 - Madrugada).
- **Retenção:** 30 dias (Plano Pro).
- **Tipo:** Point-in-Time Recovery (PITR) disponível para restauração até o segundo exato.

### 1.2 Backups Manuais (Snapshots)
Antes de migrações críticas, realizar exportação manual:
```bash
# Exemplo via CLI (Sessão Administrativa)
supabase db dump -f backup_$(date +%Y%m%d).sql
```

## 2. Protocolo de Restauração (Restore)

### 2.1 Cenário: Corrupção de Dados Pequena
Se apenas algumas linhas foram afetadas:
1. Identificar o `record_id` na tabela `public.audit_logs`.
2. Reverter manualmente via `UPDATE` usando os dados do campo `old_record`.

### 2.2 Cenário: Falha Total do Banco
1. Acessar o Dashboard do Lovable Cloud -> Connectors -> Database.
2. Selecionar "Restore from Backup".
3. Escolher o snapshot mais recente (ou o ponto no tempo anterior ao incidente).
4. Validar integridade após o reinício:
   - Rodar `SELECT count(*) FROM public.entregas;`
   - Verificar logs de autenticação.

## 3. Teste de Integridade Semestral
Todo mês de Janeiro e Julho, a equipe deve:
1. Criar um projeto de teste paralelo.
2. Restaurar o backup de produção nesse ambiente.
3. Executar a suíte de testes `npm run test` para garantir que o esquema e os dados estão funcionais.

## 4. Contatos de Emergência
- Suporte Lovable Cloud: via In-app Chat.
- DBA de Plantão: (Ver escala no Bitrix24).
