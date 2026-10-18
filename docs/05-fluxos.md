# 05 · Fluxos

## Login e renovação do token (JWT)

```mermaid
sequenceDiagram
    autonumber
    participant B as Navegador
    participant A as API
    participant D as Banco

    B->>A: POST /auth/login {email, senha}
    A->>D: busca usuário
    A->>A: bcrypt.compare
    A->>D: salva hash(refresh), expira em 7d
    A-->>B: 200 {user, accessToken (15 min)}<br/>Set-Cookie: vj_refresh (httpOnly)

    Note over B: accessToken fica só em memória

    B->>A: GET /plants/mine<br/>Authorization: Bearer access
    A-->>B: 200

    Note over B,A: 15 minutos depois…
    B->>A: GET /plants/mine (token expirado)
    A-->>B: 401 TOKEN_EXPIRED
    B->>A: POST /auth/refresh (cookie)
    A->>D: valida hash, revoga o antigo, cria novo
    A-->>B: 200 {accessToken} + novo cookie
    B->>A: repete GET /plants/mine
    A-->>B: 200
```

Ao recarregar a página o front chama `/auth/refresh` uma vez para recuperar a sessão
(o access token não é salvo em `localStorage`, o que reduz o risco de XSS roubar a sessão).

## Envio e moderação de um registro

```mermaid
sequenceDiagram
    autonumber
    actor C as Colaborador
    participant W as Front
    participant A as API
    actor M as Mediador

    C->>W: preenche formulário + foto + fonte<br/>marca "exibir meu nome"
    W->>A: POST /plants (multipart)
    A->>A: valida (Zod), salva foto
    A-->>W: 201 status=PENDING
    W-->>C: "Recebido! Aguardando revisão"

    M->>W: abre Moderação
    W->>A: GET /moderation/plants?status=PENDING
    A-->>W: fila
    alt informações conferem
        M->>W: Aprovar
        W->>A: POST /moderation/plants/:id/approve
        A-->>W: APPROVED → aparece no site
    else algo errado
        M->>W: Recusar + observação
        W->>A: POST /moderation/plants/:id/reject {note}
        A-->>W: REJECTED
        C->>W: vê a observação em "Minhas contribuições", corrige
        W->>A: PUT /plants/:id → volta a PENDING
    end
```

## Página inicial com localização

```mermaid
flowchart TD
    A[Abre o site] --> B{Permite localização?}
    B -- sim --> C[GET /regions/locate]
    C --> D["Você está em Lavras · MG"]
    D --> E[GET /plants?lat&lng&sort=distance]
    E --> F[Cards + mapa com as mais próximas]
    B -- não --> G[Seletor de estado]
    G --> H[GET /plants?state=UF]
    H --> F
    F --> I[Filtrar por município / bioma / busca]
```

## Coleta de notícias

```mermaid
flowchart LR
    T[(timer 60 min<br/>ou POST /news/refresh)] --> P[para cada fonte RSS]
    P --> X[baixa e interpreta o XML]
    X --> U[upsert por link]
    U --> L[(NEWS_ITEM)]
    L --> G[GET /news]
```

Fontes iniciais (configuráveis em `api/src/modules/news/sources.ts`):
O Eco, ClimaInfo, Agência Brasil – Meio Ambiente, G1 Natureza e MetSul Meteorologia.
Cada notícia leva o link para o site original (o conteúdo continua sendo deles).
