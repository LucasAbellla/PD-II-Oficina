# Oficina — Sistema web de gestão de serviços e histórico de manutenção

[![CI](https://github.com/LucasAbellla/PD-II-Oficina/actions/workflows/ci.yml/badge.svg)](https://github.com/LucasAbellla/PD-II-Oficina/actions/workflows/ci.yml)

Projeto de Desenvolvimento II (Unisenac, 2026/2) — MVP para pequenas oficinas mecânicas:
clientes → veículos → ordens de serviço → serviços realizados → histórico do veículo.

## Stack
- **Frontend:** React 18 + TypeScript + Vite + React Router
- **Backend:** Node.js + Express + TypeScript (Zod para validação, JWT para autenticação)
- **Banco:** PostgreSQL 16 via Prisma ORM

## Requisitos
Node.js 20+, Docker (para o PostgreSQL local) e Git.

## Como executar

```bash
# 1) Banco de dados
docker compose up -d

# 2) Backend
cd backend
cp .env.example .env            # ajuste JWT_SECRET
npm install
npx prisma migrate dev              # aplica a migração inicial versionada
npm run seed                    # cria usuário admin + dados FICTÍCIOS de demonstração
npm run dev                     # http://localhost:3333/api/health

# 3) Frontend (outro terminal)
cd frontend
npm install
npm run dev                     # http://localhost:5173
```

Login inicial (definido no `.env` do backend): `admin@oficina.local` / `admin12345`.
**Troque a senha (ícone de chave no menu, "Alterar senha") e o `JWT_SECRET` antes de qualquer uso real.**
Os logins dos funcionários são criados pelo ADMIN na tela **Usuários**.

## Testes e CI

| Comando | Onde | O que cobre |
|---|---|---|
| `npm test` | backend | Regras de status, validações e rotas sem banco |
| `npm run test:integration` | backend | Fluxo T1–T6 da validação e regras de negócio contra o PostgreSQL |
| `npm test` | frontend | Máscaras/formatação e cliente HTTP |
| `npm run typecheck` | ambos | Verificação de tipos |

Os testes de integração usam o banco `oficina_test` (recriado a cada execução) no mesmo PostgreSQL do
`docker compose`; para outro endereço, defina `TEST_DATABASE_URL` (o nome do banco precisa terminar em `_test`).

O GitHub Actions (`.github/workflows/ci.yml`) roda tipos, testes e build do backend e do frontend a cada push na
`main` e em todo pull request.

## Estrutura

```
backend/
  prisma/schema.prisma        modelo de dados (User, Customer, Vehicle, ServiceOrder, ServiceItem)
  src/
    config/env.ts             variáveis de ambiente validadas
    middlewares/              autenticação/perfis, validação, tratamento de erros
    lib/                      prisma, erros, utilitários HTTP
    modules/<dominio>/        *.routes.ts → *.service.ts → Prisma (+ *.schema.ts com Zod)
  test/                       testes de integração da API (banco de teste)
frontend/
  src/api/client.ts           cliente HTTP (token JWT)
  src/auth/                   contexto de autenticação
  src/pages/                  telas (OS, clientes, veículos, histórico)
```

## Como expandir (extensibilidade)
1. **Novo módulo (ex.: estoque, orçamento):** crie `backend/src/modules/<nome>/` com `schema`, `service` e `routes`
   e registre o router em `backend/src/app.ts`. Adicione os modelos em `schema.prisma` e rode `prisma migrate dev`.
2. **Novo status de OS:** edite apenas `modules/service-orders/status.ts` (+ enum no Prisma e rótulos no frontend).
3. **Novos perfis/permissões:** inclua o valor no enum `Role` e use `requireRole(...)` nas rotas.
4. **Nova tela:** crie a página em `frontend/src/pages/` e adicione a rota em `App.tsx`.

## Endpoints principais (prefixo `/api`)
| Método | Rota | Descrição | Requisito |
|---|---|---|---|
| POST | /auth/login | Autenticação (retorna JWT) | — |
| GET/POST | /auth/users | Listar / criar usuários (somente ADMIN) | RNF03 |
| PUT | /auth/users/:id | Editar nome, perfil e situação (ativo/desativado) (somente ADMIN) | RNF03 |
| PUT | /auth/users/:id/password | Definir nova senha de um usuário (somente ADMIN) | RNF03 |
| PATCH | /auth/me/password | Trocar a própria senha (informando a atual) | RNF03 |
| GET/POST | /customers | Listar (busca) / cadastrar cliente | RF01, RF02 |
| GET/PUT | /customers/:id | Consultar / editar cliente | RF02 |
| GET/POST | /vehicles | Listar (busca) / cadastrar veículo | RF03, RF04 |
| GET/PUT | /vehicles/:id | Consultar / editar veículo | RF04 |
| GET | /vehicles/:id/history | Histórico de OS do veículo | RF08 |
| GET/POST | /service-orders | Listar (filtro por status e busca por nº, placa, cliente ou problema) / abrir OS | RF05 |
| GET | /service-orders/summary | Quantidade de OS por status | RF07 |
| GET | /service-orders/:id | Detalhe da OS | RF05 |
| PATCH | /service-orders/:id/status | Alterar status (regras de transição) | RF07 |
| POST/DELETE | /service-orders/:id/items | Registrar/remover serviço realizado | RF06 |

## Publicação
Backend e banco na **Render** (arquivo `render.yaml`) e frontend na **Vercel** (`frontend/vercel.json`).
A Render só publica um commit da `main` depois que o CI passa; a Vercel publica a cada push na `main`
e gera uma prévia para cada PR.

1. **Render:** *New → Blueprint*, escolha este repositório. São criados a API (`oficina-api`) e o banco
   (`oficina-db`); o `JWT_SECRET` é gerado automaticamente. As migrações rodam a cada deploy.
2. **Vercel:** *Add New → Project*, este repositório, *Root Directory* `frontend` (o preset Vite é detectado).
   Variável `VITE_API_URL` = `https://<api>.onrender.com/api`.
3. Na Render, preencha `CORS_ORIGIN` com o endereço da Vercel (ex.: `https://oficina.vercel.app`).
4. Usuário inicial: rode o seed uma vez a partir da sua máquina, usando a *External Database URL* do banco:
   ```bash
   cd backend
   DATABASE_URL="<external database url>" SEED_ADMIN_PASSWORD="<senha forte>" npm run seed
   ```

No plano gratuito a API "dorme" após 15 min sem uso (a primeira requisição leva cerca de 1 min) e o banco
gratuito da Render expira 30 dias após a criação (mais 14 de carência); abra o sistema alguns minutos antes
de uma demonstração.

## Privacidade (RNF07)
Use apenas dados fictícios ou autorizados. Não versione arquivos `.env`.
