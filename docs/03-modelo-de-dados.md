# 03 · Modelo de dados

```mermaid
erDiagram
    USER ||--o{ PLANT : "envia"
    USER ||--o{ PLANT : "revisa"
    USER ||--o{ REFRESH_TOKEN : "possui"

    USER {
        string id PK
        string name
        string email UK
        string passwordHash
        string role "USER | MODERATOR | ADMIN"
        datetime createdAt
    }

    PLANT {
        string id PK
        string scientificName
        string popularNames "separados por vírgula"
        string family
        string description
        string biome "AMAZONIA | CERRADO | ..."
        string climate
        string light "SOL_PLENO | MEIA_SOMBRA | SOMBRA"
        string water "BAIXA | MEDIA | ALTA"
        string medicinalUse
        string toxicityLevel "NENHUMA | BAIXA | MODERADA | ALTA | DESCONHECIDA"
        string toxicityNotes
        string curiosities
        string photoUrl
        string photoCredit
        string state "UF"
        string municipality
        float latitude
        float longitude
        string source "referência usada"
        string sourceUrl
        string status "PENDING | APPROVED | REJECTED"
        string reviewNote
        boolean showContributor
        string contributorId FK
        string reviewedById FK
        datetime reviewedAt
        datetime createdAt
        datetime updatedAt
    }

    REFRESH_TOKEN {
        string id PK
        string tokenHash UK
        string userId FK
        datetime expiresAt
        datetime revokedAt
    }

    NEWS_ITEM {
        string id PK
        string title
        string link UK
        string summary
        string imageUrl
        string sourceName
        datetime publishedAt
    }
```

## Decisões

- **Um registro = uma planta em um lugar.** É exatamente o que o cliente descreveu ("subir a foto,
  colocar os dados da região e a fonte"). A mesma espécie pode aparecer várias vezes, em cidades
  diferentes — isso é desejável para "plantas por região". A página da planta mostra também
  "outros registros desta espécie".
- **Enumerações como texto.** SQLite não tem `enum`; os valores válidos são garantidos pelo Zod
  na API e ficam listados em `api/src/lib/catalog.ts`.
- **Status de moderação no próprio registro.** Fila simples: `PENDING → APPROVED` ou
  `PENDING → REJECTED → (colaborador edita) → PENDING`.
- **Refresh tokens guardados como hash SHA-256** → vazamento do banco não entrega sessões válidas.

## Ciclo de vida de um registro

```mermaid
stateDiagram-v2
    [*] --> PENDING: colaborador envia
    PENDING --> APPROVED: mediador aprova
    PENDING --> REJECTED: mediador recusa (com observação)
    REJECTED --> PENDING: colaborador corrige e reenvia
    APPROVED --> PENDING: colaborador edita (volta para revisão)
    APPROVED --> [*]: removido
```
