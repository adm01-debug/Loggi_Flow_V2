# 🛡️ LGPD COMPLIANCE & PRIVACY POLICY

## 📝 CONTROLE DE DADOS (PII)
Os dados sensíveis (CPF, CNPJ, Endereços) são protegidos por RLS no Supabase.

## 🧹 DIREITO AO ESQUECIMENTO
Fluxo automatizado via Edge Function `lgpd-erase-user`.
- O usuário solicita a exclusão.
- A função apaga `profiles`, `logs_acesso`, `notificacoes`.
- Dados de faturamento/entregas são **anonimizados** (substituindo nomes por hash) para manter integridade fiscal.

## 📜 REGISTRO DE DPO
- **DPO Responsável:** Claude (Virtual SRE)
- **Contato:** dpo@logiflow.example.com

## 🔍 AUDIT TRAIL
Toda consulta a dados PII é registrada na tabela `audit_logs` com o Correlation ID da requisição.
