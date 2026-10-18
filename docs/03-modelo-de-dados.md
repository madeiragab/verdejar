# 03 · Modelo de dados

Banco **PostgreSQL**, modelado com **Prisma** (`backend/prisma/schema.prisma`) e versionado por
**migrations** (`backend/prisma/migrations/`). Tabelas e colunas em `snake_case`; chaves primárias UUID,
exceto tabelas de referência que usam o código oficial (UF, código IBGE, código do bioma).

## Diagrama entidade-relacionamento

```mermaid
erDiagram
    users ||--o{ refresh_tokens : "tem sessões"
    users ||--o{ plant_records : "envia"
    users ||--o{ reviews : "registra ação"

    states ||--o{ municipalities : "possui"
    municipalities ||--o{ plant_records : "localiza"
    biomes ||--o{ plant_records : "classifica"
    species ||--o{ plant_records : "é observada em"

    plant_records ||--|{ popular_names : "nomes populares"
    plant_records ||--o{ photos : "fotos"
    plant_records ||--|{ sources : "fontes"
    plant_records ||--|{ reviews : "histórico de moderação"

    news_sources ||--o{ news_items : "publica"

    users {
        uuid id PK
        varchar name
        varchar email UK
        text password_hash
        enum role "USER | MODERATOR | ADMIN"
        timestamp created_at
        timestamp updated_at
    }
    refresh_tokens {
        uuid id PK
        char64 token_hash UK "SHA-256 do token"
        uuid user_id FK
        timestamp expires_at
        timestamp revoked_at
    }
    states {
        char2 uf PK
        int ibge_code UK
        varchar name
        varchar region
    }
    municipalities {
        int ibge_code PK "código oficial IBGE"
        varchar name
        char2 state_uf FK
    }
    biomes {
        varchar code PK "CERRADO, CAATINGA…"
        varchar name
        text description
    }
    species {
        uuid id PK
        varchar scientific_name UK
        varchar family
    }
    plant_records {
        uuid id PK
        uuid species_id FK
        int municipality_code FK
        varchar biome_code FK
        float latitude
        float longitude
        text description
        varchar climate
        enum light "SOL_PLENO | MEIA_SOMBRA | SOMBRA"
        enum water "BAIXA | MEDIA | ALTA"
        text medicinal_use
        enum toxicity_level "NENHUMA … ALTA | DESCONHECIDA"
        text toxicity_notes
        text curiosities
        enum status "PENDING | APPROVED | REJECTED"
        bool show_contributor "consentimento de crédito"
        uuid contributor_id FK
        text search_text "busca sem acento"
        timestamp published_at
    }
    popular_names {
        uuid id PK
        uuid record_id FK
        varchar name
        smallint position
    }
    photos {
        uuid id PK
        uuid record_id FK
        text url
        varchar credit
        smallint position "0 = capa"
    }
    sources {
        uuid id PK
        uuid record_id FK
        varchar citation
        varchar url
    }
    reviews {
        uuid id PK
        uuid record_id FK
        uuid actor_id FK
        enum action "SUBMITTED | RESUBMITTED | APPROVED | REJECTED"
        text note
        timestamp created_at
    }
    news_sources {
        varchar id PK
        varchar name
        text feed_url
        text site_url
        bool active
    }
    news_items {
        uuid id PK
        varchar source_id FK
        text title
        text link UK
        text summary
        text image_url
        timestamp published_at
    }
```

## Decisões de modelagem

| Decisão | Por quê |
|---|---|
| **`species` separada de `plant_records`** | A espécie (táxon) é uma só; o que se repete são as observações dela em lugares diferentes. Permite "outros registros desta espécie" e evita duplicar o nome científico. |
| **Registro guarda luz, água, toxicidade etc.** | São afirmações do colaborador naquele envio, revisadas pelo mediador junto com a foto e a fonte. Se ficassem na espécie, um envio novo alteraria dados já aprovados de outras pessoas. |
| **`popular_names`, `photos` e `sources` em tabelas próprias (1:N)** | Uma planta tem vários nomes populares, pode ter várias fotos e várias referências. Nada de listas em texto separadas por vírgula. |
| **`reviews` como histórico** | Em vez de só um campo "observação", cada envio, reenvio, aprovação e recusa vira uma linha — auditoria completa de quem fez o quê e quando. O status atual fica desnormalizado em `plant_records.status` para consultas rápidas. |
| **`states` e `municipalities` com códigos do IBGE** | Chave oficial e estável; nomes iguais em estados diferentes (ex.: "Bom Jesus") não se confundem. Municípios são criados sob demanda, buscando no IBGE no primeiro registro. |
| **`biomes` como tabela** | Permite descrição e futuras traduções sem mudar código. Luz, água, toxicidade e papéis são `enum` do Postgres porque são fixos. |
| **`search_text`** | Texto normalizado (sem acento, minúsculo) com nome científico, nomes populares, família e município. Busca por "ipe" encontra "Ipê" com um `LIKE` simples e indexável. |
| **`news_sources` no banco** | Incluir ou desativar um site de notícias não exige deploy. |
| **Refresh tokens com hash** | Um vazamento do banco não entrega sessões válidas. |
| **Exclusões** | Apagar um registro apaga nomes, fotos, fontes e histórico (`CASCADE`). Apagar um usuário mantém os registros dele, sem autor (`SET NULL`). |

## Ciclo de vida de um registro

```mermaid
stateDiagram-v2
    [*] --> PENDING: colaborador envia (review SUBMITTED)
    PENDING --> APPROVED: mediador aprova (review APPROVED)
    PENDING --> REJECTED: mediador recusa com observação (review REJECTED)
    REJECTED --> PENDING: colaborador corrige (review RESUBMITTED)
    APPROVED --> PENDING: colaborador edita (review RESUBMITTED)
    APPROVED --> REJECTED: mediador tira do ar
    APPROVED --> [*]: removido
```

## Comandos

```bash
npm run db:start     # sobe o Postgres local (sem Docker)
npm run db:migrate   # cria uma nova migration a partir do schema.prisma
npm run db:deploy    # aplica as migrations (produção)
npm run db:seed      # dados de referência + conteúdo inicial
npm run db:reset     # apaga tudo, reaplica migrations e seed
npm run db:studio    # abre o Prisma Studio para navegar nas tabelas
```
