# 06 · Colocando no ar de graça

O cliente não pode pagar, então tudo abaixo usa **planos gratuitos**.

```mermaid
flowchart LR
    U([Usuário]) --> V[Vercel / Netlify<br/>front estático]
    V -->|/api| R[Render<br/>Web Service free]
    R --> N[(Neon<br/>Postgres free)]
    R --> CL[(Cloudinary<br/>fotos free)]
```

| Peça | Serviço | Limite gratuito (aprox.) | Observação |
|---|---|---|---|
| Front | Vercel ou Netlify | sobra para esse uso | build `npm run build` em `web/` |
| API | Render (Web Service) | 750 h/mês | "dorme" após 15 min sem uso; 1º acesso demora ~30 s |
| Banco | Neon Postgres | 0,5 GB | suficiente para dezenas de milhares de registros |
| Fotos | Cloudinary | ~25 GB | o disco do Render é apagado a cada deploy, por isso as fotos vão para fora |

## Passo a passo

1. **Banco (Neon):** criar projeto, copiar a `DATABASE_URL`.
2. **API:** em `api/prisma/schema.prisma` trocar `provider = "sqlite"` por `provider = "postgresql"`.
3. **Render:** novo *Web Service* apontando para a pasta `api/`
   - Build: `npm install && npx prisma migrate deploy && npm run build`
   - Start: `npm start`
   - Variáveis: `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `WEB_ORIGIN`
     (URL do front), `COOKIE_SECURE=true`, `CLOUDINARY_URL`.
   - Rodar o seed uma vez: `npm run seed`.
4. **Front (Vercel):** projeto apontando para `web/`, variável `VITE_API_URL=https://sua-api.onrender.com`.
5. Entrar com o admin do seed, **trocar a senha** e promover o mediador.

> Dica: para evitar a "soneca" do Render, dá para usar um monitor gratuito (UptimeRobot)
> chamando `/api/health` a cada 10 min.

## Domínio

O endereço `*.vercel.app` é gratuito. Domínio `.com.br` próprio custa ~R$ 40/ano no Registro.br —
é o único custo opcional.
