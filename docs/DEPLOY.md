# Publicação (deploy)

Backend + PostgreSQL na **Render** (definidos em `render.yaml`) e frontend na **Vercel** (`frontend/vercel.json`).
A Render só publica um commit da `main` depois que o CI passa; a Vercel publica a cada push na `main` e gera uma
prévia para cada PR.

## 1) Banco de dados e backend (Render)
1. *New → Blueprint*, escolha este repositório e a branch `main`.
2. A Render cria o banco `oficina-db` e a API `oficina-api`. O `JWT_SECRET` é gerado automaticamente.
   Ela pede o `CORS_ORIGIN`: use `http://localhost:5173` por enquanto e troque no passo 3 da Vercel.
3. As migrações rodam a cada deploy (`prisma migrate deploy` no start).
4. Teste: `https://<seu-backend>.onrender.com/api/health` deve responder `{"status":"ok"}`.

Variáveis do serviço (já definidas no `render.yaml`, exceto `CORS_ORIGIN`):

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | ligada ao banco `oficina-db` |
| `JWT_SECRET` | gerado pela Render |
| `CORS_ORIGIN` | URL do frontend na Vercel (ex.: `https://oficina.vercel.app`) |
| `PORTAL_TOKEN_DAYS` | `30` |
| `WORKSHOP_NAME` | `JMG Autopeças` |

### Usuário administrador
Rode o seed uma vez a partir da sua máquina, com a *External Database URL* do banco (Render → `oficina-db` → Connect):

```powershell
cd backend
$env:DATABASE_URL="<external database url>"; $env:SEED_ADMIN_PASSWORD="<senha forte>"; npm run seed
```

**Troque a senha no primeiro acesso.**

## 2) Frontend (Vercel)
1. *Add New → Project*, este repositório. Na tela de importação, use **Import single project** na pasta `frontend`
   (não use o preset *Services*).
2. Variável de ambiente: `VITE_API_URL=https://<seu-backend>.onrender.com/api` (é lida no build; se mudar, faça *Redeploy*).
3. Volte na Render e troque `CORS_ORIGIN` pela URL da Vercel, sem barra no final.

O `frontend/vercel.json` redireciona qualquer rota para o `index.html` (necessário para `/cliente`,
`/acompanhar/<token>` e demais rotas funcionarem ao abrir o link direto ou atualizar a página).

## 3) Limites do plano gratuito
- A API "dorme" após 15 min sem uso; a primeira requisição leva cerca de 1 min. Abra o sistema antes de apresentar.
- O banco gratuito da Render expira 30 dias após a criação (mais 14 de carência). Anote a data e confira se cobre a defesa.

## 4) Conferência final
- Login de funcionário funciona e a lista de OS carrega (CORS correto).
- Em uma OS, gerar o link de acompanhamento e abri-lo em aba anônima/celular.
- Em *Clientes → Acesso do cliente*, gerar o código e entrar em `/cliente` com placa ou CPF.
- Anexar um PDF em uma OS Concluída e baixá-lo pela área do cliente.
- Registre a URL final e a tag `v1.0.0` no Apêndice C do artigo.
