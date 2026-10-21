# Oficina — Sistema web de gestão de serviços e histórico de manutenção

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
**Troque a senha e o `JWT_SECRET` antes de qualquer uso real.**

Testes: `cd backend && npm test` · Verificação de tipos: `npm run typecheck` (em cada pasta).

## Estrutura

```
backend/
  prisma/schema.prisma        modelo de dados (User, Customer, Vehicle, ServiceOrder, ServiceItem)
  src/
    config/env.ts             variáveis de ambiente validadas
    middlewares/              autenticação/perfis, validação, tratamento de erros
    lib/                      prisma, erros, utilitários HTTP
    modules/<dominio>/        *.routes.ts → *.service.ts → Prisma (+ *.schema.ts com Zod)
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
| POST | /auth/users | Criar usuário (somente ADMIN) | RNF03 |
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
Frontend na **Vercel** (defina `VITE_API_URL` apontando para a API) e backend na **Render** com PostgreSQL gerenciado
(`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`; build: `npm install && npx prisma generate && npm run build`;
start: `npx prisma migrate deploy && npm start`).

## Privacidade (RNF07)
Use apenas dados fictícios ou autorizados. Não versione arquivos `.env`.
