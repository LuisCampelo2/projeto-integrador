# LIFT – Protótipo navegável de alta fidelidade

Protótipo do **LIFT**, plataforma mobile de gestão para personal trainers. Reúne em um só app o cadastro de alunos, a montagem de treinos, a agenda de aulas, o acompanhamento da evolução física e as cobranças.

Feito em **HTML, CSS e JavaScript puro**, com dados fictícios salvos no navegador. Não tem backend e funciona abrindo o `index.html` direto ou publicado no **GitHub Pages**.

> **Protótipo com dados simulados.** Não há servidor, banco de dados nem integração real com Stripe, PIX ou Firebase. Os pagamentos, notificações e validações de cartão apenas reproduzem visualmente esses fluxos.

---

## Tecnologias

| Camada | Uso |
|---|---|
| HTML5 | Estrutura semântica de uma página única (`index.html`) |
| CSS3 | Design system próprio (tokens em `:root`), tema escuro, layout mobile-first |
| JavaScript (Vanilla) | Roteamento por hash, renderização das telas, regras de negócio simuladas |
| SVG | Ícones, gráficos de evolução, QR Code ilustrativo e mapa |
| LocalStorage | Sessão, alunos, treinos, aulas, cobranças, mensagens e notificações |

Sem dependências, sem build e sem `fetch()`. A única chamada externa é a fonte *Plus Jakarta Sans* (Google Fonts). Se não houver internet, o app usa a fonte do sistema.

---

## Como executar localmente

1. Baixe ou clone esta pasta.
2. Dê dois cliques em `index.html`.

Pronto. Não é preciso instalar nada nem rodar comandos.

## Como publicar no GitHub Pages

1. Crie um repositório e envie o **conteúdo desta pasta** (o `index.html` deve ficar na raiz do repositório).
2. No GitHub, abra **Settings › Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**, branch **main** e pasta **/(root)**. Salve.
4. Em alguns minutos o protótipo estará em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

Todos os caminhos são relativos e a navegação usa `#/rota`. Por isso o site funciona dentro do subdiretório do repositório e atualizar a página não gera erro 404.

---

## Contas demonstrativas

Por ser uma demonstração, o login **aceita qualquer e-mail e qualquer senha** (basta não deixar os campos vazios). A aba escolhida (Personal ou Aluno) ou o link de acesso administrativo define o perfil:

- se o e-mail for de uma conta já existente daquele perfil (por exemplo, um personal criado durante a demonstração), o app entra nessa conta;
- se não for, o app entra na conta demonstrativa do perfil, listada abaixo.

| Perfil | E-mail | Quem é |
|---|---|---|
| Personal | `personal@lift.com.br` | Daniel Mendes – 5 alunos, plano Profissional |
| Aluno | `aluno@lift.com.br` | Mariana Oliveira – aluna do Daniel |
| Administrador | `admin@lift.com.br` | Equipe LIFT (link “Acesso administrativo” na tela inicial) |

Na tela de login, o botão **“Usar conta de demonstração”** preenche os dados automaticamente.

### Painel de demonstração

O botão discreto no canto inferior da tela (ou o atalho **Shift + D**) abre um painel para a apresentação com:

- entrada rápida nos três perfis;
- atalho para cada uma das **42 telas**, agrupadas por requisito (RF01 a RF05);
- dados para testar os fluxos alternativos;
- botão para **reiniciar os dados demonstrativos**.

### Dados para testar caminhos alternativos

| Situação | Como testar |
|---|---|
| Primeiro acesso do aluno | Código de convite **`DM4821`** (Daniel Mendes) |
| Código inválido | Qualquer outro código de 6 caracteres |
| Cartão aprovado | `4242 4242 4242 4242`, validade futura, CVV `123` |
| Cartão recusado | `4000 0000 0000 0002` |
| Conflito de horário | Agendar aula às 07:00 numa segunda, quarta ou sexta (horário da Mariana) |
| Cobrança em atraso | Rafael Costa já começa com uma mensalidade atrasada |
| PIX aguardando confirmação | Pedro Henrique já informou um PIX que o personal precisa confirmar |

---

## Funcionalidades por requisito

### RF01 – Acesso e Perfis (Telas 01–09)
- Abertura com verificação de sessão ativa (simula o token JWT).
- Seleção de papel antes do login (Personal / Aluno) e link de acesso administrativo.
- Login com validação, erro de credenciais e aviso quando a conta é de outro perfil.
- Cadastro do personal com requisitos de senha em tempo real e aceite dos termos.
- Primeiro acesso do aluno por **código de convite**, com vínculo automático ao personal.
- Recuperação de senha com **mensagem neutra** (não revela se o e-mail existe) e definição de nova senha.
- Direcionamento para a área inicial de cada perfil: Dashboard, Agenda do Aluno ou Painel Administrativo.
- Logout e troca de perfil.

### RF02 – Onboarding e Planos (Telas 10–17)
- Planos Free, Starter, Profissional e Elite, com tabela comparativa.
- Plano Free segue direto ao onboarding; planos pagos pedem cartão e ativam o **trial de 30 dias**.
- Validação do cartão (algoritmo de Luhn, validade e CVV) e simulação de recusa.
- Onboarding em 5 etapas com barra de progresso, botão Voltar sem perda de dados e campos condicionais (chave PIX, rede de academia, percentual de desconto).
- Meus pagamentos: plano atual, uso do limite de alunos, alteração de plano, troca de cartão, histórico, cancelamento e reativação.

### RF03 – Alunos e Treinos (Telas 18–27)
- **Personal:** lista de alunos com busca e filtros, convite por código, detalhes do aluno, edição de dados físicos, perfil completo (anamnese, hábitos, fotos e evolução com gráfico) e registro de medidas.
- Montagem de treino com biblioteca de exercícios (busca, filtro por grupo, seleção múltipla), séries, repetições, carga, reordenação e dias da semana.
- Caminho “Exercício existe?” → **Não** → cadastro de exercício, que volta ao treino com o exercício já incluído.
- Ao salvar, o treino é atribuído e o aluno é notificado.
- **Aluno:** treino do dia, gráfico de progresso, execução do treino (marcar exercícios, registrar carga e séries), histórico, anamnese em 3 etapas com consentimento, hábitos com controles deslizantes e fotos de evolução (envio de imagem real, guardada no navegador).

### RF04 – Agenda (Telas 28–34)
- Calendário mensal e semanal com marcação dos dias com aula.
- Agendamento com **verificação de conflito** e sugestão automática de horário livre.
- Confirmação do agendamento e notificação ao aluno.
- Conclusão da aula (presença registrada) e cancelamento com **motivo obrigatório**.
- **Aluno:** agenda com próxima aula, aviso de aula nova, semana navegável, detalhes da aula, aula cancelada com motivo e histórico com frequência.

### RF05 – Cobranças (Telas 35–42)
- Painel de recebimentos: total a receber, recebido no mês, pendente, atrasado e taxa de recebimento.
- Filtros Todos / Pendentes / Atrasados / Pagos.
- Mudança automática de **Pendente para Atrasado** após o vencimento.
- Geração das cobranças do ciclo e criação de cobrança avulsa.
- Detalhe da cobrança, envio de lembrete e **confirmação manual** de recebimento (PIX ou dinheiro).
- **Aluno:** minha assinatura, formas de pagamento aceitas pelo personal, PIX com chave e QR Code ilustrativo (“Já paguei” → aguardando confirmação) e cartão (confirmado automaticamente, simulando o Stripe).

### Extras
- Chat entre personal e aluno, com indicador de mensagens não lidas.
- Central de notificações do aluno.
- Área do administrador: indicadores, distribuição dos planos, busca de usuários, desativação e reativação de contas, e receita por plano.

---

## Estrutura de arquivos

```text
lift-mockup/
├── index.html
├── README.md
├── css/
│   ├── global.css        # tokens, reset, moldura do aparelho
│   ├── components.css    # botões, campos, listas, cartões, sheet, toast
│   ├── auth.css          # RF01 e RF02
│   ├── personal.css      # área do personal
│   ├── student.css       # área do aluno e chat
│   ├── admin.css         # área do administrador
│   └── demo.css          # painel de demonstração
├── js/
│   ├── storage.js        # LocalStorage e utilitários de data e valor
│   ├── data.js           # base demonstrativa (gerada a partir da data de hoje)
│   ├── icons.js          # ícones SVG
│   ├── ui.js             # componentes, formulários, máscaras e feedback
│   ├── router.js         # roteamento por hash
│   ├── rf01-auth.js
│   ├── rf02-onboarding.js
│   ├── rf03-students-workouts.js
│   ├── rf04-schedule.js
│   ├── rf05-billing.js
│   ├── admin.js
│   ├── shared.js         # chat, perfis e notificações
│   ├── demo.js           # painel de demonstração
│   └── app.js            # inicialização e eventos
└── assets/
    ├── icons/favicon.svg
    └── images/
```

---

## Acessibilidade e qualidade

- HTML semântico, rótulos em todos os campos e mensagens de erro ligadas por `aria-describedby`.
- Navegação por teclado, foco visível, foco preso dentro dos modais e **Esc** para fechar.
- Contraste adequado no tema escuro e respeito a `prefers-reduced-motion`.
- Confirmação antes de ações importantes (cancelar aula, sair, excluir foto, desativar conta, cancelar assinatura).
- Estados vazios, carregamentos simulados e mensagens de sucesso e erro.
- Layout testado em largura de celular (375 px) e em desktop, onde o app aparece dentro da moldura de um aparelho.

---

## Divergências entre o prompt e os User Flows

Conforme combinado, quando o prompt e os User Flows divergem, o protótipo segue os **User Flows e wireframes** das pastas `rf01` a `rf05`. As divergências encontradas foram:

| Requisito | O prompt pedia | O User Flow define | O que foi feito |
|---|---|---|---|
| RF01 | “Seleção ou identificação do perfil” como etapa do login | Seleção de papel **antes** do login; o perfil é identificado depois, pelo token | Segue o fluxo: Tela 01 escolhe o papel, e após o login o app direciona pelo perfil da conta |
| RF02 | Onboarding com nome profissional, especialidade, experiência, modalidade, quantidade de alunos, objetivos e preferências | 5 etapas: modelo de cobrança, valor base, formas de pagamento, atendimento na academia do aluno, rede e descontos | Segue o fluxo (as respostas alimentam o RF05) |
| RF03 | “Cadastro de aluno” feito pelo personal | Aluno fora da lista → personal compartilha o código de convite → o **próprio aluno** cria a conta (RF01) | Segue o fluxo. O personal pode editar os dados físicos e a situação do aluno |
| RF04 | Status confirmada, pendente, concluída e cancelada | Status agendada, concluída e cancelada | Segue o fluxo (3 status) |
| RF04 | Calendário semanal e mensal | Wireframe mostra apenas o mensal | Mantido o mensal e **acrescentada** a visão semanal, sem alterar o fluxo |
| RF05 | “Geração de cobrança” como tela do personal | Geração automática no início do ciclo (processo do sistema) | O processo é simulado pelo botão “Gerar cobranças”, que aparece quando há alunos sem cobrança no mês, e foi incluída a cobrança avulsa |

Acréscimos que não estão nos wireframes, mas não mudam os fluxos: consentimento LGPD na última etapa da anamnese, chat, central de notificações, histórico de aulas e telas extras do administrador.
# projeto-integrador
