# Checklist de entrega — Marco 3 (sexta, 27/11/2026)

## Segunda e terça — código no ar e organizado no Git
- [ ] Criar ramos e abrir pull requests por funcionalidade (cada integrante os seus; revisão cruzada). Ver `docs/FLUXO_GIT.md`.
- [ ] Rodar localmente: `docker compose up -d`, `npx prisma migrate dev`, `npm run seed`, `npm run seed:demo`, `npm test`, `npm run typecheck`.
- [ ] Corrigir o que quebrar; abrir issue para cada defeito (alimenta a aba "Defeitos" da planilha).
- [ ] Publicar (Render + Vercel) seguindo `docs/DEPLOY.md`; testar link de acompanhamento e área do cliente no ambiente publicado.
- [ ] Tirar as capturas de tela reais (Figuras 7 a 12 do artigo) com os dados de demonstração.

## Quarta e quinta — evidências com a JMG
- [ ] Apresentar o protótipo/sistema à JMG (registrar data, quem participou, foto ou print) → aba "Interações".
- [ ] Sessão de validação: tarefas T1–T8 (aba "Tarefas"), cronometragem WhatsApp × sistema, ≥ 5 consultas por método (aba "Tempo_Historico"), SUS (aba "SUS").
- [ ] Autorização/termo de consentimento da JMG para registro e uso das evidências.
- [ ] Devolutiva com a JMG e registro do feedback + decisão.
- [ ] Lighthouse (acessibilidade e desempenho) e os 5 cenários de segurança da Tabela 16.

## Quinta à noite — fechar o artigo
- [ ] Preencher todos os trechos em AMARELO do artigo (somente com dados reais). Nada amarelo pode sobrar.
- [ ] Copiar os números da aba "Resumo" da planilha para as Tabelas 14 e 15.
- [ ] Escrever 6.1 (interpretação), 6.2 (impacto) e 7.1 (conclusões) com base nos resultados reais; revisar o Resumo por último.
- [ ] Conferir referências: só as realmente consultadas.
- [ ] Criar a tag `v1.0.0`, anotar o hash (Apêndice C) e a contribuição por integrante (Apêndice B).
- [ ] Gerar o PDF final e conferir que não há campos amarelos nem "__".

## Sexta — entrega
- [ ] Enviar PDF do artigo + pacote de evidências + link do repositório com a tag.
