# Diagramas

Fonte dos diagramas usados no artigo (o GitHub desenha os blocos `mermaid`).

## Casos de uso

```mermaid
flowchart LR
  AT(["Atendente"])
  AD(["Administrador"])
  CL(["Cliente da oficina"])
  AD -. "também é" .-> AT

  subgraph S["Sistema da oficina"]
    direction TB
    UC1(["Cadastrar e editar cliente · RF01–02"])
    UC2(["Cadastrar e editar veículo · RF03–04"])
    UC3(["Abrir OS · RF05"])
    UC4(["Registrar serviços · RF06"])
    UC5(["Alterar status com linha do tempo · RF07, RF09"])
    UC6(["Consultar histórico do veículo · RF08"])
    UC7(["Buscar placa, cliente ou OS · RF17"])
    UC8(["Gerar link de acompanhamento · RF10"])
    UC9(["Gerar código de acesso · RF12"])
    UC10(["Anexar nota fiscal · RF13"])
    UC11(["Ver painel · RF15"])
    UC12(["Gerenciar usuários · RF16"])
    UC13(["Acompanhar a OS pelo link · RF10"])
    UC14(["Entrar na área do cliente · RF11"])
    UC15(["Baixar nota fiscal · RF14"])
  end

  AT --- UC1 & UC2 & UC3 & UC4 & UC5 & UC6 & UC7 & UC8 & UC9 & UC10 & UC11
  AD --- UC12
  CL --- UC13 & UC14 & UC15
```

## Modelo de dados

Nomes conceituais; no código: `User`, `Customer`, `Vehicle`, `ServiceOrder`, `ServiceItem`, `StatusEvent`,
`CustomerAccess` e `OrderInvoice` (`backend/prisma/schema.prisma`).

```mermaid
erDiagram
  USUARIO ||--o{ ORDEM_SERVICO : abre
  USUARIO |o--o{ EVENTO_STATUS : registra
  USUARIO |o--o{ NOTA_FISCAL : envia
  CLIENTE ||--o{ VEICULO : possui
  CLIENTE ||--o| ACESSO_CLIENTE : tem
  VEICULO ||--o{ ORDEM_SERVICO : recebe
  ORDEM_SERVICO ||--o{ SERVICO_REALIZADO : contem
  ORDEM_SERVICO ||--o{ EVENTO_STATUS : "linha do tempo"
  ORDEM_SERVICO ||--o| NOTA_FISCAL : anexa

  USUARIO {
    uuid id PK
    texto nome
    texto email UK
    texto senha_hash
    enum perfil
    booleano ativo
  }
  CLIENTE {
    uuid id PK
    texto nome
    texto cpf_cnpj
    texto documento_digitos
    texto telefone
    texto email
    texto observacoes
  }
  VEICULO {
    uuid id PK
    texto placa UK
    texto marca
    texto modelo
    inteiro ano
    texto cor
    uuid cliente_id FK
  }
  ORDEM_SERVICO {
    uuid id PK
    inteiro numero UK
    uuid veiculo_id FK
    uuid aberta_por FK
    enum status
    texto problema_relatado
    inteiro km_entrada
    datahora abertura
    datahora encerramento
    texto token_link UK
    datahora validade_link
  }
  SERVICO_REALIZADO {
    uuid id PK
    uuid os_id FK
    texto descricao
    texto observacoes
    datahora executado_em
  }
  EVENTO_STATUS {
    uuid id PK
    uuid os_id FK
    enum status_anterior
    enum novo_status
    datahora data_hora
    uuid usuario_id FK
  }
  ACESSO_CLIENTE {
    uuid cliente_id PK, FK
    texto hash_codigo
    inteiro tentativas_falhas
    datahora bloqueado_ate
  }
  NOTA_FISCAL {
    uuid id PK
    uuid os_id FK, UK
    texto nome_arquivo
    inteiro tamanho_bytes
    bytes conteudo_pdf
    datahora enviada_em
    uuid enviada_por FK
  }
```

## Arquitetura

```mermaid
flowchart TB
  F["Funcionário<br/>(navegador)"]
  C["Cliente<br/>(celular, link ou área do cliente)"]

  subgraph V["Vercel"]
    SPA["SPA React + TypeScript<br/>Vite · React Router"]
  end

  subgraph R["Render"]
    direction TB
    MW["Middlewares<br/>Helmet · CORS · limite por IP<br/>JWT funcionário · JWT cliente · Zod"]
    MOD["Módulos (rota → serviço)<br/>auth · customers · vehicles<br/>service-orders · dashboard<br/>public · client"]
    PR["Prisma ORM"]
    DB[("PostgreSQL 16")]
    MW --> MOD --> PR --> DB
  end

  subgraph G["GitHub"]
    direction TB
    REPO["Repositório<br/>backend · frontend · docs"]
    CI["GitHub Actions<br/>tipos · testes · build"]
    REPO --> CI
  end

  F --> SPA
  C --> SPA
  SPA -- "HTTPS · JSON /api" --> MW
  REPO -. "deploy a cada push" .-> V
  CI -. "deploy após CI verde" .-> MW
```
