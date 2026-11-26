# Auditoria de acessibilidade e desempenho

Lighthouse 12.8 no Microsoft Edge (modo headless, perfil de celular padrão). As telas internas foram auditadas
com o sistema rodando localmente e os dados de demonstração (`npm run seed && npm run seed:demo`), já
autenticadas como funcionário ou como cliente. Os relatórios completos estão no pacote de evidências.

## Acessibilidade: antes e depois (25/11/2026)

| Tela | Rota | Antes | Depois |
|---|---|---|---|
| Início | `/` | 100 | 100 |
| Login do funcionário | `/login` | 100 | 100 |
| Login do cliente | `/cliente` | 100 | 100 |
| Área do cliente: veículos | `/cliente/veiculos` | 95 | 100 |
| Área do cliente: veículo | `/cliente/veiculos/:id` | 96 | 100 |
| Link de acompanhamento | `/acompanhar/:token` | 95 | 100 |
| Painel | `/painel` | 100 | 100 |
| Ordens de serviço | `/os` | 100 | 100 |
| Detalhe da OS | `/os/:id` | 96 | 100 |
| Clientes | `/clientes` | 100 | 100 |
| Detalhe do cliente | `/clientes/:id` | 95 | 100 |
| Histórico do veículo | `/veiculos/:id/historico` | 92 | 100 |

Problemas encontrados e correção (`frontend/src/styles.css`):

- **Contraste insuficiente** (WCAG 2.1, critério 1.4.3): o cinza dos textos secundários (`--muted: #6b7280`)
  tinha contraste de 4,39:1 sobre o fundo `#f3f4f6`, abaixo do mínimo de 4,5:1. Afetava o link "voltar", os
  rótulos da linha do tempo da OS e textos auxiliares da área do cliente. Trocado por `#5f6773` (5,19:1 sobre o
  fundo e 5,72:1 sobre o branco).
- **Link indistinguível do texto** (critério 1.4.1): o nome do proprietário no histórico do veículo era um link
  diferenciado só pela cor. Links dentro de parágrafos passaram a ser sublinhados.

## Desempenho no ambiente publicado (25/11/2026)

Páginas públicas em https://pd-ii-oficina.vercel.app, perfil de celular com rede simulada.

| Tela | Desempenho | Acessibilidade | Boas práticas | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| Início | 100 | 100 | 100 | 1,2 s | 1,2 s | 0 ms | 0 |
| Login do cliente | 100 | 100 | 100 | 1,2 s | 1,2 s | 0 ms | 0 |
| Login do funcionário | 100 | 100 | 100 | 1,2 s | 1,2 s | 0 ms | 0 |

As telas internas e o link de acompanhamento dependem de login ou de um link gerado no sistema publicado; a
correção de contraste entra em produção no próximo deploy da `main`.
