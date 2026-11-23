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
**Troque a senha (ícone de chave no menu, "Alterar senha") e o `JWT_SECRET` antes de qualquer uso real.**
Os logins dos funcionários são criados pelo ADMIN na tela **Usuários**.

Dados de demonstração para capturas de tela (fictícios): `npm run seed && npm run seed:demo` (clientes com código `123456`).

Testes: `cd backend && npm test` · Verificação de tipos: `npm run typecheck` (em cada pasta).

## Diferenciais (o que planilha e WhatsApp não fazem)
- **Link de acompanhamento por OS** (`/acompanhar/<token>`): o funcionário gera um link somente leitura e envia ao cliente pelo
  WhatsApp (link `wa.me`, sem integração com API). O cliente vê, sem login e pelo celular, o status com linha do tempo, os
  serviços realizados e o histórico do veículo. Token aleatório de 192 bits, validade configurável (`PORTAL_TOKEN_DAYS`),
  revogável; não expõe CPF, telefone, observações internas nem nomes de funcionários; placa parcialmente oculta.
- **Área do cliente** (`/cliente`): entrando com a **placa**, o cliente vê só aquele veículo; entrando com o **CPF**, vê todos
  os veículos do cadastro. Em ambos os casos informa um **código de acesso de 6 dígitos** gerado pelo funcionário em
  *Clientes → detalhe → Acesso do cliente* (exibido uma única vez; o banco guarda só o hash). Bloqueio de 15 min após 5 erros,
  limite de tentativas por IP, erro genérico e sessão de 2 h só na aba.
- **Nota fiscal em PDF:** o funcionário anexa na OS (Concluída/Entregue, até 5 MB, tabela `OrderInvoice`, bytea) e o cliente
  baixa na área dele. O sistema **não emite** nota fiscal: guarda e entrega o PDF emitido no sistema fiscal da oficina.
- **Linha do tempo de status** (quem e quando) e **Painel** (`/painel`): OS em aberto, por status, veículos que retornaram e
  tempo médio por etapa — base para medir o tempo de atendimento.

Demonstração (seed): placa `ABC1D23` ou CPF `529.982.247-25`, código `123456`.

> Ao atualizar um banco existente: `npx prisma migrate dev` (aplica a migração `20261113120000_area_cliente_e_nota_fiscal`,
> que também preenche o CPF de clientes já cadastrados). Em produção: `npx prisma migrate deploy`.

## Estrutura

```
backend/
  prisma/schema.prisma        modelo de dados (User, Customer, Vehicle, ServiceOrder, ServiceItem)
  src/
    config/env.ts             variáveis de ambiente validadas
    middlewares/              autenticação/perfis, validação, tratamento de erros
    lib/                      prisma, erros, utilitários HTTP
    modules/<dominio>/        *.routes.ts → *.service.ts → Prisma (+ *.schema.ts com Zod)
    modules/public/           link público por OS (sem login, acesso por token)
    modules/client/           área do cliente (placa/CPF + código, sessão própria)
    modules/dashboard/        indicadores e tempos médios por etapa
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
| POST/DELETE | /service-orders/:id/share | Gerar/renovar e revogar o link do cliente | Diferencial |
| PUT/GET/DELETE | /service-orders/:id/invoice | Anexar/baixar/remover nota fiscal (funcionário) | Diferencial |
| POST/DELETE | /customers/:id/access-pin | Gerar/revogar código de acesso do cliente | Diferencial |
| GET | /dashboard | Indicadores e tempos médios | Diferencial |
| GET | /public/orders/:token | Acompanhamento por link (**sem login**) | Diferencial |
| POST | /client/login | Login do cliente (placa ou CPF + código) | Diferencial |
| GET | /client/vehicles, /client/vehicles/:id | Veículos e atendimentos do cliente | Diferencial |
| GET | /client/orders/:id/invoice | Baixar nota fiscal (OS pronta) | Diferencial |

## Publicação
Frontend na **Vercel** (defina `VITE_API_URL` apontando para a API) e backend na **Render** com PostgreSQL gerenciado
(`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`; build: `npm install && npx prisma generate && npm run build`;
start: `npx prisma migrate deploy && npm start`). Veja `docs/DEPLOY.md`.

## Publicação, CI e fluxo de trabalho
- Passo a passo de deploy (Vercel + Render): [`docs/DEPLOY.md`](docs/DEPLOY.md)
- CI no GitHub Actions (typecheck, testes e build): `.github/workflows/ci.yml`
- Fluxo de ramos/PR, tag da versão final e contribuição por integrante: [`docs/FLUXO_GIT.md`](docs/FLUXO_GIT.md)

## Privacidade (RNF07)
Use apenas dados fictícios ou autorizados. Não versione arquivos `.env`.
