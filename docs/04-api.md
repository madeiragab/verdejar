# 04 · API REST

Base: `/api` · Formato: JSON · Datas em ISO-8601 · Erros:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Dados inválidos", "details": { } } }
```

Autenticação: `Authorization: Bearer <accessToken>`. O refresh token vai num cookie
`httpOnly` chamado `vj_refresh`, enviado só para `/api/auth/*`.

Legenda: 🌐 público · 🔑 logado · 🛡️ mediador · 👑 admin

## Auth

| Método | Rota | | Descrição |
|---|---|---|---|
| POST | `/auth/register` | 🌐 | `{ name, email, password }` → `{ user, accessToken }` + cookie |
| POST | `/auth/login` | 🌐 | `{ email, password }` → `{ user, accessToken }` + cookie |
| POST | `/auth/refresh` | 🌐 (cookie) | Rotaciona o refresh e devolve novo `accessToken` |
| POST | `/auth/logout` | 🌐 (cookie) | Revoga o refresh token |
| GET | `/auth/me` | 🔑 | Usuário atual |

## Plantas

| Método | Rota | | Descrição |
|---|---|---|---|
| GET | `/plants` | 🌐 | Lista **aprovadas**. Query: `q, state (UF), municipality (código IBGE), biome, light, water, toxicity, lat, lng, radiusKm, sort=recent\|distance\|name, page, limit` |
| GET | `/plants/:id` | 🌐 | Detalhe (aprovada, ou do próprio autor, ou para mediador) + `related` |
| POST | `/plants` | 🔑 | `multipart/form-data` com `photo` + campos (`municipalityCode` = código IBGE) → cria `PENDING` |
| GET | `/plants/mine` | 🔑 | Registros do usuário em qualquer status |
| PUT | `/plants/:id` | 🔑 dono | Edita; volta para `PENDING` |
| DELETE | `/plants/:id` | 🔑 dono / 👑 | Remove |
| GET | `/plants/stats` | 🌐 | Totais por estado e por bioma |

Resposta de lista:

```json
{
  "items": [ { "id": "…", "scientificName": "Handroanthus albus", "popularNames": ["Ipê-amarelo"],
               "municipality": "Lavras", "state": "MG", "distanceKm": 3.2, "photoUrl": "…" } ],
  "page": 1, "limit": 12, "total": 37
}
```

## Moderação

| Método | Rota | | Descrição |
|---|---|---|---|
| GET | `/moderation/plants?status=PENDING` | 🛡️ | Fila de revisão |
| POST | `/moderation/plants/:id/approve` | 🛡️ | `{ note? }` |
| POST | `/moderation/plants/:id/reject` | 🛡️ | `{ note }` (obrigatório) |

## Regiões

| Método | Rota | | Descrição |
|---|---|---|---|
| GET | `/regions/states` | 🌐 | UFs (IBGE, cache 24 h) |
| GET | `/regions/states/:uf/municipalities` | 🌐 | Municípios da UF (IBGE, cache 24 h) |
| GET | `/regions/locate?lat&lng` | 🌐 | Coordenadas → `{ state, municipality, municipalityCode }` (Nominatim + IBGE, cache) |

## Notícias

| Método | Rota | | Descrição |
|---|---|---|---|
| GET | `/news?limit&source` | 🌐 | Últimas notícias agregadas |
| GET | `/news/sources` | 🌐 | Sites configurados |
| POST | `/news/refresh` | 🛡️ | Força a coleta agora |

## Usuários

| Método | Rota | | Descrição |
|---|---|---|---|
| GET | `/users` | 👑 | Lista usuários |
| PATCH | `/users/:id/role` | 👑 | `{ role: "USER" \| "MODERATOR" \| "ADMIN" }` |

## Catálogo

| Método | Rota | | Descrição |
|---|---|---|---|
| GET | `/catalog` | 🌐 | Biomas, níveis de luz/água/toxicidade com rótulos em português |
| GET | `/health` | 🌐 | `{ ok: true }` |
