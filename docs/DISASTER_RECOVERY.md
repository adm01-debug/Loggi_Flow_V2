# Plano de Recuperação de Desastres (DR) — LogiFlow

## 🎯 Objetivos (SLOs)
- **RPO (Recovery Point Objective):** 24 horas (último backup diário).
- **RTO (Recovery Time Objective):** 4 horas após a detecção do desastre.

## 📁 Backups
Os backups são gerenciados automaticamente pela Lovable Cloud / Supabase.
- **Frequência:** Diária.
- **Retenção:** 30 dias.
- **Localização:** Regiões redundantes da AWS/GCP (dependendo da região do projeto).

## 🆘 Cenários de Crise

### 1. Corrupção de Banco de Dados
1. Identificar o último ponto de restauração íntegro no dashboard do Supabase.
2. Iniciar o processo de restauração (Point-in-Time Recovery - PITR se disponível).
3. Notificar os usuários sobre a indisponibilidade temporária.

### 2. Falha Crítica em Edge Function
1. Realizar o rollback imediato para a última versão estável via CLI:
   `supabase functions deploy <function-name> --version <previous-timestamp>`
2. Verificar logs em `AdminTelemetria.tsx`.

### 3. Perda de Acesso ao Provedor (Lovable/Supabase)
1. Ativar o plano de contingência: redeploy em nova instância Supabase usando as migrations em `supabase/migrations/`.
2. Atualizar as variáveis de ambiente no frontend.
3. Apontar o DNS para o novo domínio de contingência.

## 📞 Contatos de Emergência
- Líder de Infra: [nome@email.com]
- Suporte Supabase: [support@supabase.com]
- Suporte Lovable: [Priority Support no Dashboard]
