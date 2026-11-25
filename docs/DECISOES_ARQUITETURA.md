# Decisões de arquitetura

Registro curto das principais escolhas técnicas: contexto, decisão, alternativas e consequências.
Para incluir uma nova decisão, acrescente uma seção com o próximo número.

## 1. Monólito modular no backend

**Contexto.** Equipe de três pessoas, MVP com prazo de um semestre e uma única oficina como usuária.

**Decisão.** Uma única API Express, dividida por domínio em `backend/src/modules/<domínio>/`, cada um com
rotas, serviço e esquema de validação (Zod). As rotas só validam a entrada; as regras ficam no serviço.

**Alternativas.** Microsserviços (deploy, rede e observabilidade multiplicados, sem ganho para esse volume);
uma API sem divisão por domínio (mais rápida no início, mais difícil de manter e testar).

**Consequências.** Um só deploy e um só banco. Um módulo novo (estoque, orçamento) é uma pasta nova e uma
linha em `app.ts`. Se um domínio crescer muito, ele já está isolado e pode ser extraído.

## 2. Sessão do cliente separada da sessão do funcionário

**Contexto.** O sistema tem dois públicos: funcionários da oficina e clientes, que só podem ver os próprios
veículos. A placa fica visível na rua e o CPF não é segredo, então nenhum dos dois basta como senha.

**Decisão.** O cliente entra com placa ou CPF/CNPJ mais um código de 6 dígitos gerado pela oficina (guardado
só como hash, com bloqueio após 5 erros). O token do cliente é assinado com um segredo diferente do token
de funcionário (`clientJwtSecret`), tem tipo `client`, dura 2 h e carrega o escopo: o cliente (`cid`) e, no
login por placa, o veículo (`vid`). Toda rota do cliente confere se o recurso pertence ao escopo e responde
404 quando não pertence.

**Alternativas.** Um único JWT com papel `CLIENTE` (um erro na checagem de papel daria acesso às rotas
internas); cadastro do cliente com e-mail e senha (atrito para quem só quer saber se o carro está pronto);
link mágico por e-mail ou SMS (exige serviço de envio pago).

**Consequências.** Um token de cliente nunca é aceito nas rotas de funcionário, e vice-versa (há teste de
integração para isso). A oficina precisa gerar e repassar o código; trocar o `JWT_SECRET` encerra as duas
sessões.

## 3. Nota fiscal em PDF guardada no banco

**Contexto.** O cliente precisa baixar a nota quando o serviço fica pronto. O sistema não emite nota: só
guarda o PDF emitido pelo sistema fiscal da oficina. O volume esperado é pequeno (dezenas a centenas de KB
por nota).

**Decisão.** Guardar o arquivo no PostgreSQL (`bytea`), na tabela `OrderInvoice`, separada da OS. Upload
cru com limite de 5 MB, verificação da assinatura `%PDF-`, nome sanitizado e envio só por funcionários. O
cliente só baixa com a OS Concluída ou Entregue.

**Alternativas.** Armazenamento de objetos (S3, R2): mais um serviço, credenciais e custo para um volume
pequeno. Disco do servidor: no plano gratuito da Render o disco é apagado a cada novo deploy.

**Consequências.** Backup e deploy continuam sendo só o banco. Se o volume crescer, o conteúdo migra para um
armazenamento de objetos sem mudar a API, porque já está isolado em uma tabela.

## 4. Link `wa.me` em vez da API do WhatsApp

**Contexto.** A oficina já fala com os clientes pelo WhatsApp e a queixa principal é responder "já ficou
pronto?". O Marco 2 deixou a integração com WhatsApp como *Won't have*.

**Decisão.** A tela da OS gera o link de acompanhamento e um botão "Enviar pelo WhatsApp" que abre
`https://wa.me/55<telefone>?text=...` com a mensagem pronta. O funcionário confere e envia.

**Alternativas.** API oficial (WhatsApp Business Platform): exige verificação da empresa na Meta, modelos
de mensagem aprovados e cobrança por conversa. Bibliotecas não oficiais: violam os termos de uso e podem
bloquear o número da oficina.

**Consequências.** Nenhum custo, nenhuma credencial e o sistema funciona sem o WhatsApp. Não há notificação
automática quando o status muda; isso fica como trabalho futuro.

## 5. Publicação na Render (API e banco) e na Vercel (frontend)

**Contexto.** O sistema precisa estar acessível para a validação com a oficina e para a avaliação, sem custo
e sem servidor para manter.

**Decisão.** API e PostgreSQL na Render, descritos em `render.yaml` (Blueprint), com migrações aplicadas a cada
deploy e publicação apenas depois que o CI da `main` passa. Frontend na Vercel com `frontend/vercel.json`
reescrevendo as rotas para o `index.html`. Detalhes em [DEPLOY.md](DEPLOY.md).

**Alternativas.** Servir o frontend pelo próprio Express (um serviço só, mas build e deploy acoplados);
VPS (manutenção de sistema operacional e certificados); outras plataformas sem plano gratuito.

**Consequências.** Prévia automática de cada PR na Vercel e infraestrutura versionada no repositório. No plano
gratuito a API dorme após 15 min sem uso (primeiro acesso leva cerca de 1 min) e o banco expira 30 dias após a
criação, por isso ele foi criado perto da validação.
