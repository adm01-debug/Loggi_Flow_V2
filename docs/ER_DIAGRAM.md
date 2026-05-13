# 🗺️ Diagrama de Entidade-Relacionamento (ER) — LogiFlow

```mermaid
erDiagram
    profiles ||--o{ user_roles : has
    profiles ||--o{ audit_logs : generates
    profiles ||--o{ user_levels : progress
    
    entregas }o--|| clientes : ships_to
    entregas }o--|| transportadoras : assigned_to
    entregas ||--o{ ocorrencias : has
    entregas ||--o{ delivery_receipts : verified_by
    
    coletas }o--|| fornecedores : from
    coletas }o--|| transportadoras : assigned_to
    coletas ||--o{ audit_logs : tracked
    
    transportadoras ||--o{ tabelas_frete : defines
    
    business_rules ||--o{ automation_logs : triggers
    
    %% Core Attributes
    entregas {
        uuid id PK
        text numero_entrega
        text status
        timestamp deleted_at
        integer version
    }
    
    audit_logs {
        uuid id PK
        timestamp created_at PK
        text table_name
        jsonb old_data
        jsonb new_data
    }
```

## 📝 Notas de Arquitetura

1.  **Partitioning:** A tabela `audit_logs` é particionada mensalmente por `created_at`.
2.  **Soft Delete:** Campos `deleted_at` em tabelas operacionais impedem a perda de dados acidental.
3.  **Concurrency:** O campo `version` em `entregas` e `coletas` permite Optimistic Locking via triggers.
4.  **Security:** Todas as tabelas são blindadas via RLS nativo do Supabase.
