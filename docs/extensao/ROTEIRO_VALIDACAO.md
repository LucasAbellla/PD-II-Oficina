# Roteiro da sessão de validação com a JMG Autopeças

Base para as Seções 4.3 e 5.2 do artigo e para a planilha `Coleta_de_Evidencias_Marco3.xlsx`.
Duração estimada: 30 a 40 minutos por participante.

## Antes da sessão

- [ ] Termo de autorização ([TERMO_AUTORIZACAO.md](TERMO_AUTORIZACAO.md)) impresso; a Parte 1 assinada pelo responsável antes de começar.
- [ ] Impressas, por participante: uma ficha de tarefas (Parte A) e um questionário (Parte C). Uma ficha de tempo (Parte B) e uma de feedback (Parte D) para a sessão.
- [ ] Papéis definidos: **condutor** (explica e lê as tarefas, não ajuda) e **observador** (cronometra e anota). De preferência, o condutor não é o integrante com vínculo com a oficina.
- [ ] Dez minutos antes, abrir https://oficina-api-os65.onrender.com/api/health para acordar a API (no plano gratuito ela dorme).
- [ ] Conferir no sistema publicado os dados de demonstração (clientes "(demo)", placas DEM1A11 a DEM4D44).
- [ ] Um usuário ATENDENTE de teste para cada participante, criado pelo ADMIN em Usuários.
- [ ] O arquivo [nota-fiscal-teste.pdf](nota-fiscal-teste.pdf) salvo no computador da sessão.
- [ ] Veículos da comparação de tempo cadastrados (ver Parte B).
- [ ] Reserva: sistema rodando localmente num notebook, caso o ambiente publicado falhe.

Regras de observação: o tempo começa quando o condutor termina de ler a tarefa e para quando o participante diz
que terminou. Qualquer dica da equipe conta como **intervenção**. Se o participante ficar mais de 2 minutos parado,
o condutor ajuda e o observador marca "sem intervenção = N".

## Parte A · Tarefas T1 a T8

Dados fictícios por participante (a placa não pode repetir):

| Participante | Cliente | CPF | Placa | Veículo |
|---|---|---|---|---|
| P1 | Carlos Teste | 123.456.789-09 | TST1A23 | Fiat Uno 2012, prata |
| P2 | Paula Teste | 987.654.321-00 | TST2B34 | VW Fox 2014, branco |
| P3 | Rafael Teste | 246.813.579-28 | TST3C45 | Ford Ka 2018, preto |

Telefone do cliente: o celular do observador, para receber o link na T7.

| Tarefa | O que o condutor pede | Termina quando |
|---|---|---|
| T1 | Cadastre o cliente e o veículo da tabela acima. | o veículo aparece no cadastro do cliente |
| T2 | Abra uma OS para esse veículo: "barulho na suspensão dianteira", 85.000 km. | a OS aparece com status Aberta |
| T3 | Registre dois serviços: "troca dos amortecedores dianteiros" e "alinhamento". | os dois serviços aparecem na OS |
| T4 | Leve a OS até Entregue. | o status mostra Entregue |
| T5 | Qual foi o último serviço feito no Gol de placa DEM2B22? | o participante responde (diagnóstico elétrico) |
| T6 | Usando a busca, em que situação está a OS do veículo DEM3C33? | o participante responde (em andamento) |
| T7 | Gere o link de acompanhamento da sua OS e envie ao cliente pelo WhatsApp; o observador abre no celular. | a página de acompanhamento abre no celular |
| T8 | Anexe a nota fiscal de teste na sua OS, gere o código de acesso do cliente, entre em "Sou cliente" com a placa e o código e baixe a nota. | o PDF é baixado na área do cliente |

**Ficha de tarefas.** Participante: P____  Data: ___/___/2026

| Tarefa | Concluída? | Sem intervenção? | Tempo (s) | Dificuldades / observações |
|---|---|---|---|---|
| T1 | ☐ S ☐ N | ☐ S ☐ N | | |
| T2 | ☐ S ☐ N | ☐ S ☐ N | | |
| T3 | ☐ S ☐ N | ☐ S ☐ N | | |
| T4 | ☐ S ☐ N | ☐ S ☐ N | | |
| T5 | ☐ S ☐ N | ☐ S ☐ N | | |
| T6 | ☐ S ☐ N | ☐ S ☐ N | | |
| T7 | ☐ S ☐ N | ☐ S ☐ N | | |
| T8 | ☐ S ☐ N | ☐ S ☐ N | | |

## Parte B · Tempo para localizar o histórico: WhatsApp × sistema

Mede a queixa principal da oficina (indicador 6 e issue #12). Mínimo de cinco consultas por método.

Preparação, com a autorização da Parte 1 do termo: escolher com o responsável cinco veículos atendidos há pelo
menos um mês cujo serviço está registrado no WhatsApp. Cadastrar cada um no sistema com o cliente "Cliente
WhatsApp 1" a "5" (sem nome, telefone ou documento reais), a placa real e uma OS Entregue com o último serviço.

Como medir: o observador diz a placa. O participante localiza o último serviço feito nesse veículo e diz em voz
alta. O tempo vai do primeiro toque no celular ou no computador até a resposta. Alternar a ordem: nas consultas
ímpares, WhatsApp primeiro; nas pares, sistema primeiro.

| Nº | Participante | Placa | Tempo no WhatsApp (s) | Tempo no sistema (s) | Observações |
|---|---|---|---|---|---|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |

Depois da sessão: capturar a tela do Painel (tempo médio por etapa), que também entra na issue #12.

## Parte C · Questionário pós-uso

Participante: P____  Marque de 1 (discordo totalmente) a 5 (concordo totalmente).

| Nº | Afirmação | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|---|
| 1 | Acho que gostaria de usar este sistema com frequência. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Achei o sistema desnecessariamente complexo. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Achei o sistema fácil de usar. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Acho que precisaria de ajuda de uma pessoa técnica para usar o sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Achei que as funções do sistema estão bem integradas. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | Achei que há muita inconsistência no sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Imagino que a maioria das pessoas aprenderia a usar este sistema rapidamente. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | Achei o sistema muito atrapalhado de usar. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | Senti-me muito confiante usando o sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | Precisei aprender várias coisas antes de conseguir usar o sistema. | ☐ | ☐ | ☐ | ☐ | ☐ |
| U | O sistema seria útil no dia a dia da oficina. | ☐ | ☐ | ☐ | ☐ | ☐ |

Perguntas abertas (anotar a resposta como foi dita):

1. O que mais ajudou? O que atrapalhou?
2. O link de acompanhamento e a área do cliente seriam úteis para os clientes da oficina? Vocês mandariam o link pelo WhatsApp?
3. A nota fiscal em PDF na área do cliente ajuda ou não faz diferença?
4. O que faltou para usarem o sistema no dia a dia?

As perguntas 2 e 3 respondem à issue #11: no Marco 2, WhatsApp e nota fiscal estavam como "Won't have".

## Parte D · Feedback e decisões

Uma linha por pedido ou crítica. A decisão pode ser tomada depois, mas precisa ser registrada (indicador 8).

| Quem (código) | O que foi dito | Decisão (incorporar / adiar / descartar) | Motivo | Issue / PR |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |
| | | | | |

## Depois da sessão

- [ ] Passar as fichas para a planilha: Parte A → aba Tarefas; B → Tempo_Historico; C → SUS; D → Interações.
- [ ] Registrar a sessão na aba Interações (data, participantes por código, formato, evidência).
- [ ] Abrir uma issue para cada defeito encontrado e lançá-lo na aba Defeitos.
- [ ] Guardar fotos autorizadas e fichas digitalizadas no pacote de evidências (ev-01, ev-02...).
- [ ] Devolutiva com a oficina: mostrar os resultados e o que será alterado (registrar como nova interação).
- [ ] Comentar os resultados nas issues #8, #11 e #12.
