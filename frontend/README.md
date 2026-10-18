# Verdejar · Frontend

Site do Verdejar: página inicial com as plantas mais próximas, exploração com filtros e mapa,
ficha de cada planta, envio de contribuições, painel de moderação e notícias.

**Stack:** React 18 · TypeScript · Vite · React Router · Leaflet (OpenStreetMap) · Lucide

## Rodando

Com o [backend](../backend) rodando em `http://localhost:3333`:

```bash
npm install
npm run dev        # http://localhost:5173
```

Em desenvolvimento o Vite repassa `/api` e `/uploads` para o backend, então não é preciso configurar nada.
Em produção, defina `VITE_API_URL` (veja `.env.example`).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | checagem de tipos + build de produção em `dist/` |
| `npm run preview` | serve o build localmente |
| `npm run typecheck` | só a checagem de tipos |

## Estrutura

```
src/
├── api/          cliente HTTP (access token em memória, refresh automático) e tipos
├── services/     uma função por endpoint da API
├── auth/         contexto de sessão (login, cadastro, logout)
├── components/   layout, cards, mapa, seletores de região…
├── pages/        uma página por rota
├── lib/          hooks (localização, IBGE), rótulos e formatação
└── styles/       CSS com tokens de cor e tipografia
```

| Rota | Página |
|---|---|
| `/` | Perto de mim |
| `/explorar` | Lista e mapa com filtros |
| `/plantas/:id` | Ficha da planta |
| `/noticias` | Notícias de clima e meio ambiente |
| `/entrar`, `/cadastro` | Login e cadastro |
| `/contribuir`, `/contribuir/:id` | Enviar ou corrigir um registro |
| `/minhas-contribuicoes` | Status dos envios |
| `/moderacao` | Fila do mediador |
| `/admin` | Usuários e papéis |
