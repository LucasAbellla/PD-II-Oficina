# Publicação (deploy)

Frontend na **Vercel** e backend + PostgreSQL na **Render**. Confira os limites do plano gratuito de cada serviço antes de
apresentar (hibernação do backend e retenção do banco mudam com o tempo).

## 1) Banco de dados e backend (Render)
1. Crie um **PostgreSQL** na Render e copie a *Internal/External Database URL*.
2. Crie um **Web Service** apontando para este repositório:
   - *Root Directory:* `backend`
   - *Build Command:* `npm install && npx prisma generate && npm run build`
   - *Start Command:* `npx prisma migrate deploy && npm start`
3. Variáveis de ambiente do serviço:

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | URL do PostgreSQL da Render |
| `JWT_SECRET` | texto longo e aleatório (≥ 32 caracteres) |
| `CORS_ORIGIN` | URL do frontend na Vercel (ex.: `https://oficina.vercel.app`) |
| `PORTAL_TOKEN_DAYS` | `30` |
| `WORKSHOP_NAME` | `JMG Autopeças` |

4. Depois do primeiro deploy, crie o usuário administrador (Shell da Render ou localmente apontando para o banco da Render):
   `npm run seed` (usa `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD`). **Troque a senha no primeiro acesso.**
5. Teste: `https://<seu-backend>.onrender.com/api/health` deve responder `{"status":"ok"}`.

## 2) Frontend (Vercel)
1. Importe o repositório; *Root Directory:* `frontend` (framework Vite).
2. Variável de ambiente: `VITE_API_URL=https://<seu-backend>.onrender.com/api`
3. O arquivo `frontend/vercel.json` já redireciona qualquer rota para o `index.html` (necessário para `/cliente`,
   `/acompanhar/<token>` e demais rotas funcionarem ao abrir o link direto ou atualizar a página).

## 3) Conferência final
- Login de funcionário funciona e a lista de OS carrega (CORS correto).
- Em uma OS, gerar o link de acompanhamento e abri-lo em aba anônima/celular.
- Em *Clientes → Acesso do cliente*, gerar o código e entrar em `/cliente` com placa ou CPF.
- Anexar um PDF em uma OS Concluída e baixá-lo pela área do cliente.
- Registre a URL final e a tag `v1.0.0` no Apêndice C do artigo.
