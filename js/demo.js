/* LIFT – painel de demonstração (acesso rápido aos perfis, às 42 telas e aos dados de teste) */
(function () {
  'use strict';
  const L = window.LIFT, ui = L.ui, esc = L.esc, D = L.d;
  const icon = (n, s, c) => L.icon(n, s, c);
  const db = () => L.store.db;

  const DEMO_USER = { personal: 'u_t1', student: 'u_s1', admin: 'u_admin' };
  const firstId = (list, fallback) => (list[0] ? list[0].id : fallback);
  const t1Classes = () => db().classes.filter((c) => c.trainerId === 't1').sort(L.byDateTime);
  const s1Classes = () => db().classes.filter((c) => c.studentId === 's1').sort(L.byDateTime);
  const today = () => D.todayIso();

  const RF = [
    {
      id: 'RF01', name: 'Acesso e Perfis', items: [
        ['01', 'Seleção de papel', 'guest', '/welcome'],
        ['02', 'Login', 'guest', '/login?role=personal'],
        ['03', 'Cadastro do Personal', 'guest', '/signup'],
        ['04', 'Primeiro acesso do Aluno', 'guest', '/first-access'],
        ['05', 'Recuperar senha', 'guest', '/forgot?role=personal'],
        ['06', 'Nova senha', 'guest', '/reset'],
        ['07', 'Dashboard do Personal', 'personal', '/p/home'],
        ['08', 'Agenda do Aluno (início)', 'student', '/a/agenda'],
        ['09', 'Painel Administrativo', 'admin', '/admin'],
      ],
    },
    {
      id: 'RF02', name: 'Onboarding e Planos', items: [
        ['10', 'Planos de assinatura', 'personal', '/plans?mode=change'],
        ['11', 'Cadastro do cartão', 'personal', '/card?mode=update&plan=profissional'],
        ['12', 'Meus pagamentos / Assinatura', 'personal', '/p/finance?tab=assinatura'],
        ['13', 'Onboarding · Cobrança', 'personal', '/onboarding/1'],
        ['14', 'Onboarding · Valor base', 'personal', '/onboarding/2'],
        ['15', 'Onboarding · Pagamentos', 'personal', '/onboarding/3'],
        ['16', 'Onboarding · Atendimento', 'personal', '/onboarding/4'],
        ['17', 'Onboarding · Rede e descontos', 'personal', '/onboarding/5'],
      ],
    },
    {
      id: 'RF03', name: 'Alunos e Treinos', items: [
        ['18', 'Meus Alunos', 'personal', '/p/students'],
        ['19', 'Detalhes do Aluno', 'personal', '/p/students/s1'],
        ['20', 'Perfil completo do Aluno', 'personal', '/p/students/s1/profile'],
        ['21', 'Montar treino', 'personal', '/p/workouts/new?student=s1'],
        ['22', 'Cadastro de exercício', 'personal', '/p/exercises/new'],
        ['23', 'Treinos e Progresso', 'student', '/a/workouts'],
        ['24', 'Treino do dia', 'student', () => '/a/workouts/' + ((L.todayWorkout && L.todayWorkout('s1')) || { id: 'w1' }).id],
        ['25', 'Anamnese de Saúde', 'student', '/a/anamnese'],
        ['26', 'Hábitos e Rotina', 'student', '/a/habits'],
        ['27', 'Fotos de Evolução', 'student', '/a/photos'],
      ],
    },
    {
      id: 'RF04', name: 'Agenda', items: [
        ['28', 'Calendário do Personal', 'personal', '/p/schedule'],
        ['29', 'Agendar aula', 'personal', '/p/schedule/new'],
        ['30', 'Detalhes da aula', 'personal', () => '/p/classes/' + firstId(t1Classes().filter((c) => c.status === 'agendada' && c.date >= today()), 'c1')],
        ['31', 'Cancelar aula', 'personal', () => '/p/classes/' + firstId(t1Classes().filter((c) => c.status === 'agendada' && c.date >= today()), 'c1') + '?cancel=1'],
        ['32', 'Agenda do Aluno', 'student', '/a/agenda'],
        ['33', 'Detalhes da aula (aluno)', 'student', () => '/a/classes/' + firstId(s1Classes().filter((c) => c.status === 'agendada' && c.date >= today()), 'c1')],
        ['34', 'Aula cancelada', 'student', () => '/a/classes/' + firstId(s1Classes().filter((c) => c.status === 'cancelada').reverse(), 'c1')],
      ],
    },
    {
      id: 'RF05', name: 'Cobranças', items: [
        ['35', 'Recebimentos · Todos', 'personal', '/p/finance?filter=todos'],
        ['36', 'Recebimentos · Atrasados', 'personal', '/p/finance?filter=atrasado'],
        ['37', 'Detalhe da cobrança', 'personal', () => '/p/charges/' + firstId(db().charges.filter((c) => c.trainerId === 't1' && c.status === 'atrasado'), 'ch1')],
        ['38', 'Confirmar recebimento', 'personal', () => '/p/charges/' + firstId(db().charges.filter((c) => c.trainerId === 't1' && c.awaiting && c.status !== 'pago').concat(db().charges.filter((c) => c.trainerId === 't1' && c.status !== 'pago')), 'ch1') + '?confirm=1'],
        ['39', 'Minha Assinatura (aluno)', 'student', '/a/billing'],
        ['40', 'Forma de pagamento', 'student', () => { const o = db().charges.filter((c) => c.studentId === 's1' && c.status !== 'pago' && !c.awaiting); return o[0] ? '/a/pay/' + o[0].id : '/a/billing'; }],
        ['41', 'Pagamento via PIX', 'student', () => { const o = db().charges.filter((c) => c.studentId === 's1' && c.status !== 'pago' && !c.awaiting); return o[0] ? '/a/pay/' + o[0].id + '/pix' : '/a/billing'; }],
        ['42', 'Pagamento confirmado', 'student', () => { const p = db().charges.filter((c) => c.studentId === 's1' && c.status === 'pago').sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1)); return p[0] ? '/a/pay/' + p[0].id + '/done' : '/a/billing'; }],
      ],
    },
  ];

  function enter(as) {
    const cur = L.auth.current();
    if (as === 'guest') { if (cur) L.auth.logout(); return; }
    const uid = DEMO_USER[as];
    const u = db().users.find((x) => x.id === uid);
    if (!u) return;
    u.active = true;
    if (!cur || cur.user.id !== uid) L.auth.login(u);
  }
  function openScreen(as, to) {
    enter(as);
    const path = typeof to === 'function' ? to() : to;
    L.demo.close();
    L.router.go(path);
  }

  function panel() {
    const cur = L.auth.current();
    const who = cur ? cur.user.name + ' · ' + { personal: 'Personal', student: 'Aluno', admin: 'Administrador' }[cur.role] : 'Nenhuma sessão ativa';
    const ROLE_TAG = { guest: 'sem login', personal: 'Personal', student: 'Aluno', admin: 'Admin' };
    return '<div class="demo-backdrop" data-demo="close"></div><aside class="demo-panel" id="demoPanel" role="dialog" aria-modal="true" aria-labelledby="demoTitle" tabindex="-1">' +
      '<header class="demo-head"><div><h2 id="demoTitle">Painel de demonstração</h2><p>Sessão atual: <strong>' + esc(who) + '</strong></p></div>' +
      '<button type="button" class="demo-close" data-demo="close" aria-label="Fechar painel">' + icon('x', 18) + '</button></header>' +
      '<div class="demo-body">' +
      '<section><h3>Entrar como</h3><div class="demo-roles">' +
      '<button type="button" data-demo="role" data-as="personal">' + icon('dumbbell', 18) + '<span><strong>Personal</strong><small>Daniel Mendes</small></span></button>' +
      '<button type="button" data-demo="role" data-as="student">' + icon('activity', 18) + '<span><strong>Aluno</strong><small>Mariana Oliveira</small></span></button>' +
      '<button type="button" data-demo="role" data-as="admin">' + icon('grid', 18) + '<span><strong>Administrador</strong><small>Equipe LIFT</small></span></button></div></section>' +
      '<section><h3>Telas por requisito funcional</h3>' + RF.map((rf) =>
        '<details class="demo-rf"><summary><span class="demo-rf-id">' + rf.id + '</span>' + rf.name + '<span class="demo-rf-count">Telas ' + rf.items[0][0] + '–' + rf.items[rf.items.length - 1][0] + '</span></summary><ul>' +
        rf.items.map((it, i) => '<li><button type="button" data-demo="screen" data-rf="' + rf.id + '" data-i="' + i + '"><span class="demo-num">' + it[0] + '</span><span class="demo-name">' + it[1] + '</span><span class="demo-tag">' + ROLE_TAG[it[2]] + '</span></button></li>').join('') +
        '</ul></details>').join('') + '</section>' +
      '<section><h3>Dados para testar</h3><dl class="demo-data">' +
      '<div><dt>Login</dt><dd>Qualquer e-mail e qualquer senha são aceitos. A aba escolhida define o perfil.</dd></div>' +
      '<div><dt>Contas</dt><dd><code>personal@lift.com.br</code><code>aluno@lift.com.br</code><code>admin@lift.com.br</code></dd></div>' +
      '<div><dt>Código de convite (primeiro acesso)</dt><dd><code>DM4821</code></dd></div>' +
      '<div><dt>Cartão aprovado</dt><dd><code>4242 4242 4242 4242</code> · validade futura · CVV 123</dd></div>' +
      '<div><dt>Cartão recusado</dt><dd><code>4000 0000 0000 0002</code></dd></div>' +
      '<div><dt>Conflito de horário</dt><dd>Agende uma aula às 07:00 numa segunda, quarta ou sexta (horário da Mariana).</dd></div>' +
      '</dl></section>' +
      '<section><h3>Áreas implementadas</h3><ul class="demo-check">' +
      '<li>' + icon('check', 14) + 'RF01 · Acesso, cadastro, convite, recuperação de senha e sessão</li>' +
      '<li>' + icon('check', 14) + 'RF02 · Planos, trial com cartão, onboarding em 5 etapas e assinatura</li>' +
      '<li>' + icon('check', 14) + 'RF03 · Alunos, perfil completo, treinos, biblioteca e execução</li>' +
      '<li>' + icon('check', 14) + 'RF04 · Calendário, conflito de horário, conclusão e cancelamento</li>' +
      '<li>' + icon('check', 14) + 'RF05 · Recebimentos, lembretes, PIX, cartão e confirmação</li>' +
      '<li>' + icon('check', 14) + 'Extras · Chat, notificações e painel administrativo</li></ul></section>' +
      '<section><h3>Dados demonstrativos</h3><p class="demo-note">Tudo fica salvo apenas neste navegador (LocalStorage).</p>' +
      '<button type="button" class="demo-reset" data-demo="reset">' + icon('refresh', 16) + ' Reiniciar dados demonstrativos</button></section>' +
      '</div></aside>';
  }

  L.demo = {
    open() {
      const root = document.getElementById('demo-root');
      root.innerHTML = panel();
      root.classList.add('is-open');
      document.getElementById('demoFab').setAttribute('aria-expanded', 'true');
      setTimeout(() => { const p = document.getElementById('demoPanel'); if (p) p.focus(); }, 30);
    },
    close() {
      const root = document.getElementById('demo-root');
      if (!root.classList.contains('is-open')) return;
      root.classList.remove('is-open');
      root.innerHTML = '';
      const fab = document.getElementById('demoFab');
      fab.setAttribute('aria-expanded', 'false');
      fab.focus();
    },
    isOpen() { return document.getElementById('demo-root').classList.contains('is-open'); },
    toggle() { if (L.demo.isOpen()) L.demo.close(); else L.demo.open(); },
    sync() { if (L.demo.isOpen()) { const scroll = document.querySelector('.demo-body'); const top = scroll ? scroll.scrollTop : 0; const open = Array.from(document.querySelectorAll('.demo-rf[open]')).map((d) => d.querySelector('.demo-rf-id').textContent); document.getElementById('demo-root').innerHTML = panel(); document.querySelectorAll('.demo-rf').forEach((d) => { if (open.indexOf(d.querySelector('.demo-rf-id').textContent) >= 0) d.open = true; }); const b = document.querySelector('.demo-body'); if (b) b.scrollTop = top; } },
    init() {
      document.getElementById('demoFab').addEventListener('click', L.demo.toggle);
      document.getElementById('demo-root').addEventListener('click', async (e) => {
        const t = e.target.closest('[data-demo]');
        if (!t) return;
        const kind = t.dataset.demo;
        if (kind === 'close') L.demo.close();
        if (kind === 'role') { enter(t.dataset.as); L.demo.close(); L.router.go(L.auth.home(t.dataset.as)); ui.toast('Você entrou como ' + L.auth.current().user.name + '.', 'info'); }
        if (kind === 'screen') { const rf = RF.find((r) => r.id === t.dataset.rf); const it = rf.items[Number(t.dataset.i)]; openScreen(it[2], it[3]); }
        if (kind === 'reset') {
          L.demo.close();
          const ok = await ui.confirm({ title: 'Reiniciar dados?', text: 'Todos os cadastros, treinos, aulas e pagamentos feitos nesta demonstração serão apagados e a base inicial será restaurada.', ok: 'Reiniciar dados', danger: true });
          if (!ok) return;
          L.store.reset();
          ui.state = { };
          L.ui.state = ui.state;
          ui.toast('Dados demonstrativos restaurados.', 'info');
          L.router.go('/');
        }
      });
    },
  };
})();
