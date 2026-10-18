# Verdejar · Backend

API REST do Verdejar: autenticação JWT, registros de plantas com moderação, regiões (IBGE),
localização (OpenStreetMap) e notícias por RSS.

**Stack:** Node.js 20+ · TypeScript · Express · Prisma · PostgreSQL · Zod · Vitest

## Rodando

```bash
cp .env.example .env
npm install
npm run db:start     # terminal 1 — PostgreSQL local (fica rodando)
npm run setup        # terminal 2 — aplica as migrations e carrega o conteúdo inicial
npm run dev          # API em http://localhost:3333/api
```

Prefere Docker? `docker compose up -d` na raiz do projeto sobe o mesmo banco na mesma porta.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | API com recarga automática |
| `npm run build` / `npm start` | compila para `dist/` e roda em produção |
| `npm run typecheck` | checagem de tipos |
| `npm test` | testes automatizados |
| `npm run db:start` | PostgreSQL local sem Docker (dados em `.pgdata/`) |
| `npm run db:migrate` | cria uma migration nova depois de mudar o `schema.prisma` |
| `npm run db:deploy` | aplica as migrations pendentes |
| `npm run db:seed` | estados, biomas, fontes de notícias, usuários e plantas iniciais |
| `npm run db:reset` | zera o banco e roda tudo de novo |
| `npm run db:studio` | interface visual para navegar nas tabelas |

## Estrutura

```
src/
├── server.ts            sobe o HTTP e agenda a coleta de notícias
├── app.ts               middlewares globais e rotas
├── config/env.ts        variáveis de ambiente
├── lib/                 prisma, tokens JWT, erros HTTP, cache, storage de fotos, geo, texto
├── middlewares/         autenticação/papéis, validação Zod, upload, tratamento de erros
└── modules/<módulo>/
    ├── *.routes.ts      rotas e middlewares
    ├── *.schemas.ts     validação de entrada
    ├── *.controller.ts  HTTP ↔ serviço
    ├── *.service.ts     regras de negócio
    └── *.mapper.ts      banco → JSON público
prisma/
├── schema.prisma        modelo de dados
├── migrations/          SQL versionado
└── seed/                dados iniciais
tests/                   testes (Vitest)
```

Modelo de dados e decisões: [docs/03-modelo-de-dados.md](../docs/03-modelo-de-dados.md) ·
Endpoints: [docs/04-api.md](../docs/04-api.md)

## Contas criadas pelo seed

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | `admin@verdejar.app` | `verdejar123` |
| Mediador | `mediador@verdejar.app` | `verdejar123` |
| Colaboradora | `maria@exemplo.com` | `verdejar123` |
