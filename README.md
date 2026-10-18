# 🌱 Verdejar

**Plantas do Brasil, região por região.** Um site público onde qualquer pessoa descobre as plantas
que crescem perto dela — com foto, bioma, clima, necessidade de luz e água, uso medicinal,
toxicidade e curiosidades. Quem cria conta pode enviar novos registros, que só vão ao ar depois
de revisados por um **mediador**.

| | |
|---|---|
| 📍 **Perto de mim** | detecta a localização e já mostra as plantas mais próximas, num mapa |
| 🔎 **Explorar** | filtros por estado, município (lista do IBGE), bioma, luz, água e toxicidade |
| 📸 **Contribuir** | foto, local no mapa, dados da espécie e a fonte consultada |
| 🛡️ **Moderação** | fila de revisão com aprovar / recusar com observação |
| 🙋 **Crédito opcional** | o nome do colaborador só aparece se ele autorizar |
| 📰 **Notícias** | clima e meio ambiente puxadas por RSS de O Eco, ClimaInfo, Agência Brasil, G1 e MetSul |
| 💸 **Custo zero** | só serviços com plano gratuito (veja o guia de deploy) |

## Documentação

| | |
|---|---|
| [01 · Requisitos](docs/01-requisitos.md) | o que o cliente pediu, atores e requisitos |
| [02 · Arquitetura](docs/02-arquitetura.md) | diagramas de contexto e contêineres, decisões, segurança |
| [03 · Modelo de dados](docs/03-modelo-de-dados.md) | diagrama ER e ciclo de vida da moderação |
| [04 · API](docs/04-api.md) | todos os endpoints REST |
| [05 · Fluxos](docs/05-fluxos.md) | sequência do JWT, envio/moderação, localização, notícias |
| [06 · Deploy gratuito](docs/06-deploy-gratuito.md) | Vercel + Render + Neon + Cloudinary |

## Stack

- **Front:** React 18 · TypeScript · Vite · React Router · Leaflet/OpenStreetMap
- **API:** Node.js · Express · TypeScript · Prisma · Zod · JWT (access + refresh rotativo) · bcrypt
- **Banco:** SQLite no desenvolvimento, Postgres em produção

```
verdejar/
├── docs/   arquitetura, diagramas (Mermaid) e guias
├── api/    API REST
└── web/    site (SPA)
```

## Rodando localmente

Requisitos: **Node.js 20+**.

```bash
# 1. API
cd api
cp .env.example .env
npm install
npm run setup        # cria o banco SQLite e carrega as plantas iniciais
npm run dev          # http://localhost:3333/api

# 2. Site (em outro terminal)
cd web
npm install
npm run dev          # http://localhost:5173
```

### Contas de exemplo (criadas pelo seed)

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | `admin@verdejar.app` | `verdejar123` |
| Mediador | `mediador@verdejar.app` | `verdejar123` |
| Colaborador | `maria@exemplo.com` | `verdejar123` |

> Troque essas senhas antes de publicar.

## Créditos

Fotos do conteúdo inicial: Wikimedia Commons (licenças livres, crédito em cada registro).
Mapas © colaboradores do OpenStreetMap. Estados e municípios: API de Localidades do IBGE.
