# Fluxo de trabalho no Git (como o grupo trabalha)

Regra do grupo: `main` estável; toda mudança entra por **pull request** de um ramo `feat/...`, `fix/...` ou `docs/...`,
revisado por **outro** integrante. Mensagens de commit no padrão `tipo: descrição` (ex.: `feat: link público de acompanhamento`).
O CI (`.github/workflows/ci.yml`) roda typecheck, testes e build em cada PR.

## Como registrar a versão final
```bash
git checkout main && git pull
git tag -a v1.0.0 -m "Versão avaliada no Marco 3"
git push origin v1.0.0
git rev-parse --short HEAD     # hash para o Apêndice C
```
Crie também uma *Release* no GitHub a partir da tag (Releases → Draft a new release).

## Contribuição por integrante (Apêndice B)
```bash
git shortlog -sn --all --no-merges            # commits por pessoa
git log --pretty="%an | %ad | %s" --date=short   # histórico detalhado
```
Use também *Insights → Contributors* e a lista de *Pull requests* fechados do GitHub como evidência.
