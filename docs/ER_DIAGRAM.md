# ER Diagram - LogiFlow (Core Entities)

```mermaid
erDiagram
    PROFILES ||--o{ USER_ROLES : has
    PROFILES {
        uuid id PK
        text email
        text full_name
        text cargo
    }
    
    TRANSPORTADORAS ||--o{ ENTREGAS : handles
    TRANSPORTADORAS {
        uuid id PK
        text nome_fantasia
        text cnpj
        boolean homologada
        int score_performance
    }
    
    CLIENTES ||--o{ ENTREGAS : receives
    CLIENTES {
        uuid id PK
        text razao_social
        text cnpj
        text cep
    }
    
    FORNECEDORES ||--o{ COLETAS : provides
    FORNECEDORES {
        uuid id PK
        text razao_social
        text cnpj
    }
    
    ENTREGAS ||--o{ OCORRENCIAS : has
    ENTREGAS {
        uuid id PK
        uuid transportadora_id FK
        uuid cliente_id FK
        text status
        numeric valor_frete
    }
    
    COLETAS ||--o{ RASTREAMENTO_HISTORICO : tracked_by
    COLETAS {
        uuid id PK
        uuid fornecedor_id FK
        text status
    }
    
    AUDIT_LOGS {
        uuid id PK
        text table_name
        uuid user_id FK
        jsonb old_data
        jsonb new_data
    }
```
