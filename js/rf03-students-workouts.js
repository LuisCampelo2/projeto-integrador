/* LIFT – RF03 · Alunos e Treinos (Telas 07, 18 a 27) */
(function () {
  'use strict';
  const L = window.LIFT, ui = L.ui, esc = L.esc, D = L.d;
  const icon = (n, s, c) => L.icon(n, s, c);
  const db = () => L.store.db;
  const save = () => L.store.save();

  const GROUPS = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];
  L.GROUPS = GROUPS;
  L.ANAMNESE = [
    { title: 'Saúde', qs: [['lesao', 'Possui alguma lesão atual ou anterior?'], ['dor', 'Sente dores ao praticar exercícios?'], ['cronica', 'Tem alguma doença crônica (ex.: hipertensão, diabetes)?']] },
    { title: 'Histórico médico', qs: [['medicamento', 'Faz uso contínuo de algum medicamento?'], ['cirurgia', 'Passou por alguma cirurgia nos últimos 12 meses?'], ['liberacao', 'Possui liberação médica para atividade física?', true]] },
    { title: 'Rotina', qs: [['atividade', 'Pratica outra atividade física além do treino?'], ['restricao', 'Tem alguma restrição alimentar?']] },
  ];

  /* ---------- Consultas ---------- */
  const myStudents = (tr) => db().students.filter((s) => s.trainerId === tr.id);
  const studentOf = (tr, id) => db().students.find((s) => s.id === id && s.trainerId === tr.id) || null;
  const exercise = (id) => db().exercises.find((e) => e.id === id) || { id, name: 'Exercício removido', group: '—', cadence: '—', equipment: '' };
  const visibleExercises = (tr) => db().exercises.filter((e) => !e.trainerId || e.trainerId === tr.id).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  const workoutsOf = (sid) => db().workouts.filter((w) => w.studentId === sid && w.active);
  L.workoutsOf = workoutsOf;
  L.exercise = exercise;
  L.todayWorkout = function (sid) {
    const wd = D.today().getDay();
    return workoutsOf(sid).find((w) => (w.days || []).indexOf(wd) >= 0) || null;
  };
  L.nextWorkoutDay = function (sid) {
    const ws = workoutsOf(sid);
    for (let k = 1; k <= 7; k++) {
      const wd = D.add(D.today(), k).getDay();
      const w = ws.find((x) => (x.days || []).indexOf(wd) >= 0);
      if (w) return { w, iso: D.iso(D.add(D.today(), k)) };
    }
    return null;
  };
  const fmtKg = (n) => (n ? L.num(n, n % 1 ? 1 : 0) + ' kg' : 'peso corporal');
  const daysLabel = (days) => (days && days.length ? days.slice().sort().map((d) => D.WDS[d]).join(', ') : 'Sem dias definidos');

  /* ---------- Tela 07 · Dashboard do Personal ---------- */
  L.route('/p/home', {
    role: 'personal',
    render() {
      const tr = L.auth.trainer();
      L.billing.refresh();
      const today = D.todayIso();
      const now = D.nowHm();
      const studs = myStudents(tr);
      const active = studs.filter((s) => s.status === 'ativo');
      const cls = db().classes.filter((c) => c.trainerId === tr.id);
      const todayCls = cls.filter((c) => c.date === today && c.status !== 'cancelada');
      const upcoming = cls.filter((c) => c.status === 'agendada' && (c.date > today || (c.date === today && c.end >= now))).sort(L.byDateTime).slice(0, 3);
      const charges = db().charges.filter((c) => c.trainerId === tr.id);
      const open = charges.filter((c) => c.status !== 'pago');
      const month = today.slice(0, 7);
      const received = charges.filter((c) => c.status === 'pago' && c.paidAt && c.paidAt.slice(0, 7) === month).reduce((a, c) => a + c.amount, 0);
      const expected = charges.filter((c) => c.cycle === month).reduce((a, c) => a + c.amount, 0);
      const awaiting = open.filter((c) => c.awaiting);
      const newStud = studs.filter((s) => s.isNew);
      const plan = L.plan(tr.plan);
      let banners = '';
      if (!(tr.onboarding && tr.onboarding.done)) banners += '<a class="banner banner-warning" href="#/onboarding/1">' + icon('sliders', 20) + '<span><strong>Finalize a configuração do seu negócio</strong><small>Leva menos de 2 minutos</small></span>' + icon('chevron-right', 18) + '</a>';
      if (tr.planStatus === 'trial') banners += '<a class="banner banner-info" href="#/p/finance?tab=assinatura">' + icon('star', 20) + '<span><strong>Seu teste grátis termina em ' + Math.max(0, D.diff(tr.trialEnds, today)) + ' dias</strong><small>Plano ' + (plan ? plan.name : '') + ' · ver assinatura</small></span>' + icon('chevron-right', 18) + '</a>';
      awaiting.slice(0, 1).forEach((c) => {
        const s = db().students.find((x) => x.id === c.studentId);
        banners += '<a class="banner banner-warning" href="#/p/charges/' + c.id + '">' + icon('wallet', 20) + '<span><strong>' + esc(L.first(s && s.name)) + ' informou um pagamento via PIX</strong><small>Confirme o recebimento de ' + L.money(c.amount) + '</small></span>' + icon('chevron-right', 18) + '</a>';
      });
      newStud.slice(0, 1).forEach((s) => {
        banners += '<a class="banner banner-primary" href="#/p/students/' + s.id + '">' + icon('user-plus', 20) + '<span><strong>' + esc(s.name) + ' entrou com seu código</strong><small>Novo aluno vinculado · ver perfil</small></span>' + icon('chevron-right', 18) + '</a>';
      });
      return {
        title: 'Início', nav: 'personal', tab: 'home',
        html: '<header class="home-head"><div><p class="home-date">' + D.cap(D.long(today)) + '</p><h1 class="home-hello">Olá, ' + esc(L.first(tr.name)) + '</h1></div>' +
          '<a class="avatar-link" href="#/p/profile" aria-label="Meu perfil">' + ui.avatar(tr.name, 'md') + '</a></header>' +
          '<main class="content">' + banners +
          '<div class="stats-3">' +
          '<a class="stat" href="#/p/schedule"><span class="stat-value">' + todayCls.length + '</span><span class="stat-label">Aulas hoje</span></a>' +
          '<a class="stat" href="#/p/students"><span class="stat-value">' + active.length + '</span><span class="stat-label">Alunos ativos</span></a>' +
          '<a class="stat' + (open.length ? ' stat-alert' : '') + '" href="#/p/finance"><span class="stat-value">' + open.length + '</span><span class="stat-label">Cobranças pendentes</span></a></div>' +
          '<a class="card card-link card-revenue" href="#/p/finance"><div class="row-between"><span class="eyebrow">Receita de ' + D.MONTHS[D.today().getMonth()] + '</span>' + icon('trending-up', 18, 'text-success') + '</div>' +
          '<p class="revenue-value">' + L.money(received) + '</p><p class="small muted">de ' + L.money(expected) + ' previstos no mês</p>' + ui.bar(expected ? (received / expected) * 100 : 0, 'bar-success') + '</a>' +
          '<div class="section-head"><h2 class="section-title">Próximas aulas</h2><a class="link link-sm" href="#/p/schedule">Ver agenda</a></div>' +
          (upcoming.length ? '<ul class="list">' + upcoming.map((c) => L.views.classItem(c, { href: '/p/classes/' + c.id, showDate: true })).join('') + '</ul>'
            : ui.empty({ icon: 'calendar', title: 'Nenhuma aula agendada', text: 'Agende uma aula para vê-la aqui.', action: '<a class="btn btn-secondary btn-sm" href="#/p/schedule/new">Agendar aula</a>' })) +
          '<h2 class="section-title">Atalhos</h2><div class="shortcuts">' +
          '<button type="button" class="shortcut" data-action="inviteStudent">' + icon('user-plus', 22) + '<span>Convidar aluno</span></button>' +
          '<a class="shortcut" href="#/p/workouts">' + icon('dumbbell', 22) + '<span>Treinos</span></a>' +
          '<a class="shortcut" href="#/p/schedule/new">' + icon('calendar', 22) + '<span>Agendar aula</span></a>' +
          '<a class="shortcut" href="#/p/finance">' + icon('wallet', 22) + '<span>Financeiro</span></a></div>' +
          '</main>',
      };
    },
  });

  /* ---------- Convite de aluno (caminho "Aluno não está na lista") ---------- */
  L.actions.inviteStudent = () => {
    const tr = L.auth.trainer();
    ui.sheet({
      title: 'Convidar aluno', focusFirst: false,
      sub: 'O aluno informa este código no primeiro acesso e fica vinculado a você automaticamente.',
      body: '<div class="invite-code" role="img" aria-label="Código de convite ' + tr.inviteCode.split('').join(' ') + '">' + tr.inviteCode.split('').map((c) => '<span>' + esc(c) + '</span>').join('') + '</div>' +
        '<p class="help center">Código exclusivo de ' + esc(tr.name) + '</p>' +
        '<ol class="steps-list"><li>Envie o código para o aluno</li><li>Ele baixa o LIFT e toca em “Sou Aluno › Primeiro acesso”</li><li>Ao informar o código, ele aparece na sua lista de alunos</li></ol>',
      footer: '<button type="button" class="btn btn-primary btn-block" data-action="copy" data-text="' + esc(tr.inviteCode) + '" data-msg="Código copiado!">' + icon('copy', 18) + ' Copiar código</button>' +
        '<button type="button" class="btn btn-secondary btn-block" data-action="shareInvite">' + icon('share', 18) + ' Compartilhar convite</button>',
    });
  };
  L.actions.shareInvite = () => {
    const tr = L.auth.trainer();
    const text = 'Olá! Baixe o app LIFT e use o código ' + tr.inviteCode + ' no primeiro acesso para se vincular a mim. – ' + tr.name;
    if (navigator.share) navigator.share({ title: 'Convite LIFT', text }).catch(() => {});
    else L.copy(text, 'Mensagem de convite copiada!');
  };

  /* ---------- Tela 18 · Meus Alunos ---------- */
  function studentList(tr) {
    const all = myStudents(tr).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    const q = (ui.state.stQuery || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const matchQ = all.filter((s) => !q || s.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').indexOf(q) >= 0);
    const f = ui.state.stFilter || 'todos';
    const list = matchQ.filter((s) => f === 'todos' || (f === 'ativos' ? s.status === 'ativo' : s.status === 'inativo'));
    const chips = ui.chips([
      { key: 'todos', label: 'Todos', count: matchQ.length },
      { key: 'ativos', label: 'Ativos', count: matchQ.filter((s) => s.status === 'ativo').length },
      { key: 'inativos', label: 'Inativos', count: matchQ.filter((s) => s.status === 'inativo').length },
    ], f, 'stFilter');
    const items = list.map((s) => {
      const wk = workoutsOf(s.id)[0];
      const late = db().charges.some((c) => c.studentId === s.id && c.status === 'atrasado');
      return '<li><a class="list-item list-link" href="#/p/students/' + s.id + '">' + ui.avatar(s.name) +
        '<span class="li-main"><strong>' + esc(s.name) + '</strong><small>' + esc(s.goal || 'Objetivo a definir') + ' · ' + (wk ? esc(wk.name) : 'Sem treino ativo') + '</small></span>' +
        '<span class="li-end">' + (s.isNew ? ui.badge('novo') : s.status === 'inativo' ? ui.badge('inativo') : late ? ui.badge('atrasado', 'Em atraso') : '') + icon('chevron-right', 18, 'li-chev') + '</span></a></li>';
    }).join('');
    const empty = ui.empty({
      icon: 'users', title: q ? 'Nenhum aluno encontrado' : 'Nenhum aluno nesta lista',
      text: 'Aluno não está na lista? Envie seu código de convite.',
      action: '<button type="button" class="btn btn-secondary btn-sm" data-action="inviteStudent">' + icon('user-plus', 16) + ' Convidar aluno</button>',
    });
    return { chips, list: items ? '<ul class="list">' + items + '</ul>' : empty };
  }
  L.route('/p/students', {
    role: 'personal',
    render() {
      const tr = L.auth.trainer();
      const all = myStudents(tr);
      const r = studentList(tr);
      return {
        title: 'Meus Alunos', nav: 'personal', tab: 'students',
        html: ui.appBar({ title: 'Meus Alunos', sub: all.filter((s) => s.status === 'ativo').length + ' ativos · ' + all.length + ' no total', right: '<button type="button" class="icon-btn" data-action="inviteStudent" aria-label="Convidar aluno">' + icon('user-plus') + '</button>' }) +
          '<main class="content has-fab"><div class="search">' + icon('search', 18) + '<input type="search" class="input" placeholder="Buscar aluno…" value="' + esc(ui.state.stQuery || '') + '" data-input="stSearch" aria-label="Buscar aluno pelo nome"></div>' +
          '<div id="stChips">' + r.chips + '</div><div id="stList" aria-live="polite">' + r.list + '</div></main>' +
          '<button type="button" class="fab" data-action="inviteStudent" aria-label="Convidar aluno">' + icon('plus', 26) + '</button>',
      };
    },
  });
  function updateStudentList() {
    const r = studentList(L.auth.trainer());
    const c = document.getElementById('stChips');
    const l = document.getElementById('stList');
    if (c) c.innerHTML = r.chips;
    if (l) l.innerHTML = r.list;
  }
  L.inputs.stSearch = (inp) => { ui.state.stQuery = inp.value; updateStudentList(); };
  L.actions.stFilter = (btn) => { ui.state.stFilter = btn.dataset.key; updateStudentList(); };

  /* ---------- Tela 19 · Detalhes do Aluno ---------- */
  L.route('/p/students/:id', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const s = studentOf(tr, ctx.params.id);
      if (!s) { L.router.replace('/p/students'); return null; }
      if (s.isNew) { s.isNew = false; save(); }
      L.billing.refresh();
      const today = D.todayIso();
      const wks = workoutsOf(s.id);
      const next = db().classes.filter((c) => c.studentId === s.id && c.status === 'agendada' && c.date >= today).sort(L.byDateTime)[0];
      const urgent = L.billing.urgent(s.id)[0];
      const lastLog = db().logs.filter((l) => l.studentId === s.id).sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))[0];
      const imc = s.weight && s.height ? s.weight / (s.height * s.height) : null;
      const tile = (v, label) => '<div class="stat stat-static"><span class="stat-value">' + v + '</span><span class="stat-label">' + label + '</span></div>';
      return {
        title: s.name, nav: 'personal', tab: 'students',
        html: ui.appBar({ title: 'Detalhes do Aluno', back: '/p/students', right: '<button type="button" class="icon-btn" data-action="editStudent" data-id="' + s.id + '" aria-label="Editar dados do aluno">' + icon('edit') + '</button>' }) +
          '<main class="content"><section class="profile-head">' + ui.avatar(s.name, 'xl') + '<div class="profile-info"><h2 class="profile-name">' + esc(s.name) + '</h2>' +
          '<p class="muted small">Objetivo: ' + esc(s.goal || 'a definir') + '</p><div class="badges">' + ui.badge(s.status) + (s.age ? '<span class="badge badge-muted">' + s.age + ' anos</span>' : '') + (s.monthly ? '<span class="badge badge-muted">' + L.money(s.monthly) + '/mês</span>' : '') + '</div></div></section>' +
          '<div class="stats-3">' + tile(s.weight ? L.num(s.weight, 1) + '<small>kg</small>' : '—', 'Peso') + tile(s.height ? L.num(s.height, 2) + '<small>m</small>' : '—', 'Altura') + tile(s.bodyFat ? L.num(s.bodyFat, 1) + '<small>%</small>' : '—', '% Gordura') + '</div>' +
          (imc ? '<p class="small muted center">IMC ' + L.num(imc, 1) + (lastLog ? ' · último treino concluído ' + D.relative(lastLog.date).toLowerCase() + ' (' + lastLog.done.length + '/' + lastLog.total + ')' : '') + '</p>' : '') +
          '<div class="section-head"><h3 class="section-title">Treinos ativos</h3><a class="link link-sm" href="#/p/workouts/new?student=' + s.id + '">Novo treino</a></div>' +
          (wks.length ? '<ul class="list">' + wks.map((w) => '<li><a class="list-item list-link" href="#/p/workouts/' + w.id + '/edit"><span class="li-icon">' + icon('dumbbell', 18) + '</span><span class="li-main"><strong>' + esc(w.name) + '</strong><small>' + w.items.length + ' exercícios · ' + daysLabel(w.days) + '</small></span>' + icon('chevron-right', 18, 'li-chev') + '</a></li>').join('') + '</ul>'
            : ui.empty({ icon: 'dumbbell', title: 'Nenhum treino ativo', action: '<a class="btn btn-secondary btn-sm" href="#/p/workouts/new?student=' + s.id + '">Montar treino</a>' })) +
          '<div class="section-head"><h3 class="section-title">Próxima aula</h3><a class="link link-sm" href="#/p/schedule/new?student=' + s.id + '">Agendar</a></div>' +
          (next ? '<ul class="list">' + L.views.classItem(next, { href: '/p/classes/' + next.id, showDate: true }) + '</ul>' : '<p class="muted small">Nenhuma aula agendada.</p>') +
          '<h3 class="section-title">Financeiro</h3>' +
          (urgent ? '<a class="banner banner-' + (urgent.status === 'atrasado' ? 'danger' : 'warning') + '" href="#/p/charges/' + urgent.id + '">' + icon('wallet', 20) + '<span><strong>' + esc(urgent.desc) + ' · ' + L.money(urgent.amount) + '</strong><small>' + (urgent.awaiting ? 'Pagamento informado · aguardando sua confirmação' : (urgent.status === 'atrasado' ? 'Em atraso desde ' : 'Vence em ') + D.short(urgent.due)) + '</small></span>' + icon('chevron-right', 18) + '</a>'
            : '<div class="banner banner-success">' + icon('check-circle', 20) + '<span><strong>Mensalidades em dia</strong><small>Nenhuma cobrança em aberto</small></span></div>') +
          '<div class="btn-stack"><a class="btn btn-secondary btn-block" href="#/p/students/' + s.id + '/profile">' + icon('clipboard', 18) + ' Ver perfil completo</a>' +
          '<a class="btn btn-secondary btn-block" href="#/p/chat/' + s.id + '">' + icon('message', 18) + ' Abrir chat</a></div></main>',
      };
    },
  });
  L.actions.editStudent = (el) => {
    const s = db().students.find((x) => x.id === el.dataset.id);
    ui.sheet({
      title: 'Editar dados do aluno', sub: s.name,
      body: '<form class="form" id="editStudentForm" data-form="editStudent" data-id="' + s.id + '" novalidate>' +
        ui.field({ name: 'goal', label: 'Objetivo', value: s.goal, placeholder: 'Ex.: Hipertrofia' }) +
        '<div class="field-row">' + ui.field({ name: 'weight', label: 'Peso (kg)', value: L.fmtDec(s.weight), mask: 'decimal', attrs: 'inputmode="decimal"' }) +
        ui.field({ name: 'height', label: 'Altura (m)', value: L.fmtDec(s.height), mask: 'decimal', attrs: 'inputmode="decimal"', placeholder: '1,70' }) + '</div>' +
        '<div class="field-row">' + ui.field({ name: 'bodyFat', label: '% Gordura', value: L.fmtDec(s.bodyFat), mask: 'decimal', attrs: 'inputmode="decimal"' }) +
        ui.field({ name: 'monthly', label: 'Mensalidade', prefix: 'R$', value: L.fmtMoneyInput(s.monthly), mask: 'money', attrs: 'inputmode="numeric"' }) + '</div>' +
        ui.field({ name: 'status', label: 'Situação', type: 'select', value: s.status, options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] }) + '</form>',
      footer: '<button type="submit" form="editStudentForm" class="btn btn-primary btn-block">Salvar alterações</button><button type="button" class="btn btn-ghost btn-block" data-action="sheetClose">Cancelar</button>',
    });
  };
  L.forms.editStudent = (f) => {
    const s = db().students.find((x) => x.id === f.dataset.id);
    const v = L.form.validate(f, [
      ['weight', (x) => !x || (L.parseDec(x) >= 30 && L.parseDec(x) <= 250), 'Informe um peso entre 30 e 250 kg.'],
      ['height', (x) => !x || (L.parseDec(x) >= 1 && L.parseDec(x) <= 2.3), 'Informe a altura em metros (ex.: 1,70).'],
      ['bodyFat', (x) => !x || (L.parseDec(x) >= 3 && L.parseDec(x) <= 60), 'Informe um percentual entre 3% e 60%.'],
    ]);
    if (!v) return;
    const w = v.weight ? L.parseDec(v.weight) : null;
    const bf = v.bodyFat ? L.parseDec(v.bodyFat) : null;
    if (w && (w !== s.weight || bf !== s.bodyFat)) s.progress.push({ date: D.todayIso(), weight: w, bodyFat: bf });
    Object.assign(s, { goal: v.goal, weight: w, height: v.height ? L.parseDec(v.height) : null, bodyFat: bf, monthly: L.parseMoney(v.monthly), status: v.status });
    save();
    ui.closeSheet();
    ui.toast('Dados de ' + L.first(s.name) + ' atualizados.');
    L.router.refresh();
  };

  /* ---------- Tela 20 · Perfil completo do aluno ---------- */
  const LEVEL = { stress: ['Muito baixo', 'Baixo', 'Moderado', 'Alto', 'Muito alto'], food: ['Ruim', 'Regular', 'Boa', 'Muito boa', 'Ótima'] };
  L.LEVEL = LEVEL;
  function anamneseView(s) {
    if (!s.anamnese) {
      return ui.empty({ icon: 'clipboard', title: 'Anamnese ainda não preenchida', text: 'As respostas aparecem aqui assim que o aluno preencher pelo app.', action: '<button type="button" class="btn btn-secondary btn-sm" data-action="remindStudent" data-id="' + s.id + '" data-kind="anamnese">' + icon('bell', 16) + ' Lembrar o aluno</button>' });
    }
    const a = s.anamnese;
    return '<p class="small muted">Preenchida em ' + D.fmt(a.filledAt) + '</p>' +
      (a.consent ? '<div class="alert alert-success">' + icon('shield', 18) + '<span>Consentimento para uso dos dados de saúde registrado em ' + D.fmt(a.consentAt) + '.</span></div>' : '') +
      L.ANAMNESE.map((sec) => '<h4 class="sub-title">' + sec.title + '</h4>' + sec.qs.map(([id, q]) => {
        const ans = a.answers[id] || {};
        return '<div class="qa"><p class="qa-q">' + esc(q) + '</p><p class="qa-a">' + (ans.v === 'sim' ? ui.badge('pendente', 'Sim') : ans.v === 'nao' ? ui.badge('cancelada', 'Não') : '—') + (ans.note ? ' <span>' + esc(ans.note) + '</span>' : '') + '</p></div>';
      }).join('')).join('');
  }
  function habitsView(s) {
    const h = s.habits;
    if (!h) return ui.empty({ icon: 'moon', title: 'Hábitos ainda não informados', text: 'O aluno preenche sono, estresse e alimentação pelo app.', action: '<button type="button" class="btn btn-secondary btn-sm" data-action="remindStudent" data-id="' + s.id + '" data-kind="habitos">' + icon('bell', 16) + ' Lembrar o aluno</button>' });
    const meter = (ic, label, val, pct) => '<div class="meter">' + '<div class="row-between"><span class="meter-label">' + icon(ic, 16) + ' ' + label + '</span><strong>' + val + '</strong></div>' + ui.bar(pct) + '</div>';
    return '<p class="small muted">Atualizado em ' + D.fmt(h.updatedAt) + '</p>' +
      meter('moon', 'Sono', L.num(h.sleep, 1) + ' h por noite', (h.sleep / 10) * 100) +
      meter('brain', 'Estresse', LEVEL.stress[h.stress - 1], (h.stress / 5) * 100) +
      meter('utensils', 'Alimentação', LEVEL.food[h.food - 1], (h.food / 5) * 100) +
      (h.water ? meter('droplet', 'Hidratação', L.num(h.water, 1) + ' L por dia', (h.water / 4) * 100) : '') +
      (h.notes ? '<div class="note-box"><p class="eyebrow">Observações do aluno</p><p>' + esc(h.notes) + '</p></div>' : '');
  }
  function photosView(s) {
    if (!s.photos.length) return ui.empty({ icon: 'camera', title: 'Nenhuma foto de evolução', text: 'O aluno adiciona fotos de frente, lado e costas pelo app.' });
    return ['frente', 'lado', 'costas'].map((ang) => {
      const ps = s.photos.filter((p) => p.angle === ang).sort((a, b) => (a.date > b.date ? 1 : -1));
      if (!ps.length) return '';
      const pair = ps.length > 1 ? [ps[0], ps[ps.length - 1]] : [ps[0]];
      return '<h4 class="sub-title">' + D.cap(ang) + '</h4><div class="photo-compare">' + pair.map((p, i) =>
        '<figure class="photo"><div class="photo-img">' + ui.photo(p, 'Foto de ' + ang + ' em ' + D.fmt(p.date)) + '</div><figcaption>' + (pair.length > 1 ? (i ? 'Mais recente · ' : 'Primeira · ') : '') + D.fmt(p.date) + '</figcaption></figure>').join('') + '</div>';
    }).join('');
  }
  function evolutionView(s) {
    const pr = s.progress.slice().sort((a, b) => (a.date > b.date ? 1 : -1));
    const logs = db().logs.filter((l) => l.studentId === s.id);
    const month = D.todayIso().slice(0, 7);
    return '<div class="stats-3">' +
      '<div class="stat stat-static"><span class="stat-value">' + logs.filter((l) => l.date.slice(0, 7) === month).length + '</span><span class="stat-label">Treinos no mês</span></div>' +
      '<div class="stat stat-static"><span class="stat-value">' + logs.length + '</span><span class="stat-label">Treinos no total</span></div>' +
      '<div class="stat stat-static"><span class="stat-value">' + (pr.length > 1 ? (pr[pr.length - 1].weight - pr[0].weight > 0 ? '+' : '') + L.num(pr[pr.length - 1].weight - pr[0].weight, 1) : '—') + '</span><span class="stat-label">kg desde o início</span></div></div>' +
      (pr.length ? '<section class="card"><div class="row-between"><h4 class="card-title">Peso corporal</h4><span class="small muted">kg</span></div>' + ui.lineChart(pr.map((p) => ({ label: D.short(p.date), value: p.weight })), { label: 'Evolução do peso corporal', unit: ' kg' }) + '</section>' : '') +
      '<div class="section-head"><h4 class="section-title">Medidas registradas</h4><button type="button" class="link link-sm" data-action="addMeasure" data-id="' + s.id + '">' + icon('plus', 16) + ' Registrar</button></div>' +
      (pr.length ? '<ul class="list">' + pr.slice().reverse().map((p) => '<li class="list-item"><span class="li-icon">' + icon('activity', 18) + '</span><span class="li-main"><strong>' + L.num(p.weight, 1) + ' kg' + (p.bodyFat ? ' · ' + L.num(p.bodyFat, 1) + '% gordura' : '') + '</strong><small>' + D.fmt(p.date) + '</small></span></li>').join('') + '</ul>'
        : ui.empty({ icon: 'activity', title: 'Nenhuma medida registrada' }));
  }
  L.route('/p/students/:id/profile', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const s = studentOf(tr, ctx.params.id);
      if (!s) { L.router.replace('/p/students'); return null; }
      const tab = ['anamnese', 'habitos', 'fotos', 'evolucao'].indexOf(ctx.query.tab) >= 0 ? ctx.query.tab : 'anamnese';
      const base = '/p/students/' + s.id + '/profile?tab=';
      const body = { anamnese: anamneseView, habitos: habitsView, fotos: photosView, evolucao: evolutionView }[tab](s);
      return {
        title: 'Perfil completo', nav: 'personal', tab: 'students',
        html: ui.appBar({ title: 'Perfil Completo', sub: s.name, back: '/p/students/' + s.id }) +
          '<main class="content">' + ui.segLinks([{ key: 'anamnese', label: 'Anamnese', href: base + 'anamnese' }, { key: 'habitos', label: 'Hábitos', href: base + 'habitos' }, { key: 'fotos', label: 'Fotos', href: base + 'fotos' }, { key: 'evolucao', label: 'Evolução', href: base + 'evolucao' }], tab) +
          '<div class="tab-body">' + body + '</div></main>',
      };
    },
  });
  L.actions.remindStudent = (el) => {
    const s = db().students.find((x) => x.id === el.dataset.id);
    const kind = el.dataset.kind;
    L.notify(s.id, 'info', kind === 'anamnese' ? 'Seu personal pediu para você preencher a anamnese de saúde.' : 'Seu personal pediu para você atualizar seus hábitos e rotina.', kind === 'anamnese' ? '/a/anamnese' : '/a/habits');
    save();
    ui.toast('Lembrete enviado para ' + L.first(s.name) + '.');
  };
  L.actions.addMeasure = (el) => {
    const s = db().students.find((x) => x.id === el.dataset.id);
    ui.sheet({
      title: 'Registrar medida', sub: s.name,
      body: '<form class="form" id="measureForm" data-form="measure" data-id="' + s.id + '" novalidate>' +
        ui.field({ name: 'date', label: 'Data', type: 'date', value: D.todayIso(), attrs: 'max="' + D.todayIso() + '"' }) +
        '<div class="field-row">' + ui.field({ name: 'weight', label: 'Peso (kg)', mask: 'decimal', value: L.fmtDec(s.weight), attrs: 'inputmode="decimal"' }) +
        ui.field({ name: 'bodyFat', label: '% Gordura', mask: 'decimal', optional: true, value: L.fmtDec(s.bodyFat), attrs: 'inputmode="decimal"' }) + '</div></form>',
      footer: '<button type="submit" form="measureForm" class="btn btn-primary btn-block">Salvar medida</button><button type="button" class="btn btn-ghost btn-block" data-action="sheetClose">Cancelar</button>',
    });
  };
  L.forms.measure = (f) => {
    const s = db().students.find((x) => x.id === f.dataset.id);
    const v = L.form.validate(f, [
      ['date', (x) => !!x && x <= D.todayIso(), 'Informe uma data até hoje.'],
      ['weight', (x) => L.parseDec(x) >= 30 && L.parseDec(x) <= 250, 'Informe um peso entre 30 e 250 kg.'],
      ['bodyFat', (x) => !x || (L.parseDec(x) >= 3 && L.parseDec(x) <= 60), 'Informe um percentual entre 3% e 60%.'],
    ]);
    if (!v) return;
    const entry = { date: v.date, weight: L.parseDec(v.weight), bodyFat: v.bodyFat ? L.parseDec(v.bodyFat) : null };
    s.progress.push(entry);
    s.progress.sort((a, b) => (a.date > b.date ? 1 : -1));
    const last = s.progress[s.progress.length - 1];
    s.weight = last.weight;
    if (last.bodyFat) s.bodyFat = last.bodyFat;
    save();
    ui.closeSheet();
    ui.toast('Medida registrada.');
    L.router.refresh();
  };

  /* ---------- Treinos e biblioteca de exercícios ---------- */
  function exerciseList(tr) {
    const q = (ui.state.exQuery || '').toLowerCase();
    const g = ui.state.exGroup || 'todos';
    const list = visibleExercises(tr).filter((e) => (g === 'todos' || e.group === g) && (!q || e.name.toLowerCase().indexOf(q) >= 0));
    return list.length ? '<ul class="list">' + list.map((e) => '<li class="list-item">' + ui.exThumb(e.group) + '<span class="li-main"><strong>' + esc(e.name) + (e.trainerId ? ' <span class="tag tag-muted">Personalizado</span>' : '') + '</strong><small>' + esc(e.group) + ' · cadência ' + esc(e.cadence) + (e.equipment ? ' · ' + esc(e.equipment) : '') + '</small></span></li>').join('') + '</ul>'
      : ui.empty({ icon: 'search', title: 'Nenhum exercício encontrado', action: '<a class="btn btn-secondary btn-sm" href="#/p/exercises/new' + (q ? '?name=' + encodeURIComponent(ui.state.exQuery) : '') + '">Cadastrar exercício</a>' });
  }
  L.route('/p/workouts', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const tab = ctx.query.tab === 'exercicios' ? 'exercicios' : 'treinos';
      let body;
      if (tab === 'treinos') {
        const groups = myStudents(tr).filter((s) => s.status === 'ativo').map((s) => ({ s, ws: workoutsOf(s.id) }));
        body = groups.map(({ s, ws }) => '<div class="group-block"><div class="section-head"><h3 class="section-title">' + ui.avatar(s.name, 'xs') + ' ' + esc(s.name) + '</h3><a class="link link-sm" href="#/p/workouts/new?student=' + s.id + '">Novo</a></div>' +
          (ws.length ? '<ul class="list">' + ws.map((w) => '<li><a class="list-item list-link" href="#/p/workouts/' + w.id + '/edit"><span class="li-icon">' + icon('dumbbell', 18) + '</span><span class="li-main"><strong>' + esc(w.name) + '</strong><small>' + w.items.length + ' exercícios · ' + daysLabel(w.days) + '</small></span>' + icon('chevron-right', 18, 'li-chev') + '</a></li>').join('') + '</ul>'
            : '<p class="small muted">Nenhum treino ativo.</p>') + '</div>').join('');
      } else {
        body = '<div class="search">' + icon('search', 18) + '<input type="search" class="input" placeholder="Buscar exercício…" value="' + esc(ui.state.exQuery || '') + '" data-input="exSearch" aria-label="Buscar exercício"></div>' +
          '<div id="exChips">' + ui.chips([{ key: 'todos', label: 'Todos' }].concat(GROUPS.map((g) => ({ key: g, label: g }))), ui.state.exGroup || 'todos', 'exGroup') + '</div>' +
          '<div id="exLib" aria-live="polite">' + exerciseList(tr) + '</div>';
      }
      return {
        title: 'Treinos', nav: 'personal', tab: 'home',
        html: ui.appBar({ title: 'Treinos', back: '/p/home', right: tab === 'treinos' ? '<button type="button" class="icon-btn" data-action="newWorkout" aria-label="Novo treino">' + icon('plus') + '</button>' : '<a class="icon-btn" href="#/p/exercises/new" aria-label="Cadastrar exercício">' + icon('plus') + '</a>' }) +
          '<main class="content">' + ui.segLinks([{ key: 'treinos', label: 'Treinos dos alunos', href: '/p/workouts' }, { key: 'exercicios', label: 'Biblioteca', href: '/p/workouts?tab=exercicios' }], tab) + body + '</main>',
      };
    },
  });
  L.inputs.exSearch = (inp) => { ui.state.exQuery = inp.value; document.getElementById('exLib').innerHTML = exerciseList(L.auth.trainer()); };
  L.actions.exGroup = (btn) => {
    ui.state.exGroup = btn.dataset.key;
    document.getElementById('exChips').innerHTML = ui.chips([{ key: 'todos', label: 'Todos' }].concat(GROUPS.map((g) => ({ key: g, label: g }))), ui.state.exGroup, 'exGroup');
    document.getElementById('exLib').innerHTML = exerciseList(L.auth.trainer());
  };
  L.actions.newWorkout = () => {
    const tr = L.auth.trainer();
    const studs = myStudents(tr).filter((s) => s.status === 'ativo');
    ui.sheet({
      title: 'Novo treino', sub: 'Para qual aluno?', focusFirst: false,
      body: '<ul class="list">' + studs.map((s) => '<li><button type="button" class="list-item list-link" data-action="go" data-to="/p/workouts/new?student=' + s.id + '">' + ui.avatar(s.name, 'sm') + '<span class="li-main"><strong>' + esc(s.name) + '</strong><small>' + workoutsOf(s.id).length + ' treinos ativos</small></span>' + icon('chevron-right', 18, 'li-chev') + '</button></li>').join('') + '</ul>',
    });
  };

  /* ---------- Tela 21 · Montar treino ---------- */
  function builderDraft(key, init) {
    const dr = db().drafts;
    if (!dr.workout || dr.workout.key !== key) { dr.workout = init(); save(); }
    return dr.workout;
  }
  L.builderPath = function () {
    const d = db().drafts.workout;
    if (!d) return '/p/workouts';
    return d.editId ? '/p/workouts/' + d.editId + '/edit' : '/p/workouts/new' + (d.studentId ? '?student=' + d.studentId : '');
  };
  function exRow(it, i, n) {
    const ex = exercise(it.exerciseId);
    return '<li class="ex-row"><div class="ex-row-head">' + ui.exThumb(ex.group) + '<span class="li-main"><strong>' + esc(ex.name) + '</strong><small>' + esc(ex.group) + ' · cadência ' + esc(ex.cadence) + '</small></span>' +
      '<span class="ex-tools"><button type="button" class="icon-btn icon-btn-xs" data-action="wkMove" data-i="' + i + '" data-dir="-1"' + (i === 0 ? ' disabled' : '') + ' aria-label="Mover ' + esc(ex.name) + ' para cima">' + icon('chevron-up', 16) + '</button>' +
      '<button type="button" class="icon-btn icon-btn-xs" data-action="wkMove" data-i="' + i + '" data-dir="1"' + (i === n - 1 ? ' disabled' : '') + ' aria-label="Mover ' + esc(ex.name) + ' para baixo">' + icon('chevron-down', 16) + '</button>' +
      '<button type="button" class="icon-btn icon-btn-xs icon-btn-danger" data-action="wkRemove" data-i="' + i + '" aria-label="Remover ' + esc(ex.name) + '">' + icon('trash', 16) + '</button></span></div>' +
      '<div class="ex-params">' +
      '<label class="mini-field"><span>Séries</span><input class="input input-sm" value="' + esc(it.sets) + '" inputmode="numeric" data-mask="int" data-input="wkItem" data-i="' + i + '" data-k="sets"></label>' +
      '<label class="mini-field"><span>Repetições</span><input class="input input-sm" value="' + esc(it.reps) + '" data-input="wkItem" data-i="' + i + '" data-k="reps" placeholder="12"></label>' +
      '<label class="mini-field"><span>Carga (kg)</span><input class="input input-sm" value="' + esc(L.fmtDec(it.load || '')) + '" inputmode="decimal" data-mask="decimal" data-input="wkItem" data-i="' + i + '" data-k="load" placeholder="0"></label></div></li>';
  }
  function renderBuilder(ctx, edit) {
    const tr = L.auth.trainer();
    const studs = myStudents(tr).filter((s) => s.status === 'ativo');
    let d;
    if (edit) {
      const w = db().workouts.find((x) => x.id === ctx.params.id && x.trainerId === tr.id);
      if (!w) { L.router.replace('/p/workouts'); return null; }
      d = builderDraft('edit:' + w.id, () => ({ key: 'edit:' + w.id, editId: w.id, studentId: w.studentId, name: w.name, goal: w.goal, days: (w.days || []).slice(), items: w.items.map((x) => Object.assign({}, x)) }));
    } else {
      const sid = studs.some((s) => s.id === ctx.query.student) ? ctx.query.student : '';
      const key = 'new:' + sid;
      d = builderDraft(key, () => ({ key, editId: null, studentId: sid, name: '', goal: '', days: [], items: [] }));
    }
    if (ctx.query.add) {
      if (!d.items.some((x) => x.exerciseId === ctx.query.add)) d.items.push({ exerciseId: ctx.query.add, sets: 3, reps: '12', load: '' });
      save();
      L.router.replace(L.builderPath());
      return null;
    }
    const s = db().students.find((x) => x.id === d.studentId);
    const back = d.studentId ? '/p/students/' + d.studentId : '/p/workouts';
    const n = d.items.length;
    return {
      title: edit ? 'Editar treino' : 'Montar treino', nav: 'personal', tab: 'students',
      html: ui.appBar({ title: edit ? 'Editar treino' : 'Montar treino', sub: s ? s.name : '', back }) +
        '<main class="content"><form class="form" data-form="workout" novalidate><div class="form-alert" hidden></div>' +
        (edit ? '' : ui.field({ name: 'studentId', label: 'Aluno', type: 'select', value: d.studentId, options: [{ value: '', label: 'Selecione o aluno' }].concat(studs.map((x) => ({ value: x.id, label: x.name }))), attrs: 'data-change="wkField"' })) +
        ui.field({ name: 'name', label: 'Nome do treino', value: d.name, placeholder: 'Ex.: Treino A – Superiores', attrs: 'data-input="wkField"' }) +
        ui.field({ name: 'goal', label: 'Objetivo', value: d.goal, placeholder: 'Ex.: Hipertrofia', attrs: 'data-input="wkField"' }) +
        '<fieldset class="field"><legend class="label">Dias da semana <span class="label-opt">(opcional)</span></legend><div class="day-chips">' +
        D.WDS.map((w, i) => '<label class="day-chip"><input type="checkbox" name="days" value="' + i + '"' + (d.days.indexOf(i) >= 0 ? ' checked' : '') + ' data-change="wkField"><span>' + w + '</span></label>').join('') + '</div></fieldset>' +
        '<div class="section-head"><h2 class="section-title">Exercícios <span class="count">' + n + '</span></h2><button type="button" class="link link-sm" data-action="openLibrary">' + icon('plus', 16) + ' Adicionar</button></div>' +
        ui.errSlot('items') +
        (n ? '<ul class="ex-list">' + d.items.map((it, i) => exRow(it, i, n)).join('') + '</ul>'
          : '<button type="button" class="empty empty-button" data-action="openLibrary"><span class="empty-icon">' + icon('plus', 24) + '</span><span class="empty-title">Adicionar exercícios</span><span class="empty-text">Escolha na biblioteca ou cadastre um novo.</span></button>') +
        '<div class="sticky-actions"><button type="submit" class="btn btn-primary btn-block btn-lg">' + (edit ? 'Salvar alterações' : 'Salvar e atribuir') + '</button>' +
        (edit ? '<button type="button" class="btn btn-ghost btn-danger-text btn-block btn-sm" data-action="deleteWorkout" data-id="' + d.editId + '">Arquivar treino</button>' : '') + '</div>' +
        '</form></main>',
    };
  }
  L.route('/p/workouts/new', { role: 'personal', render: (ctx) => renderBuilder(ctx, false) });
  L.route('/p/workouts/:id/edit', { role: 'personal', render: (ctx) => renderBuilder(ctx, true) });

  const wd = () => db().drafts.workout;
  L.inputs.wkField = (el) => {
    const d = wd(); if (!d) return;
    if (el.name === 'name') d.name = el.value;
    if (el.name === 'goal') d.goal = el.value;
    save();
  };
  L.changes.wkField = (el) => {
    const d = wd(); if (!d) return;
    if (el.name === 'studentId') {
      d.studentId = el.value;
      d.key = 'new:' + el.value;
      save();
      L.router.replace(L.builderPath());
      return;
    }
    if (el.name === 'days') d.days = Array.from(el.form.querySelectorAll('[name=days]:checked')).map((x) => Number(x.value));
    save();
  };
  L.inputs.wkItem = (el) => {
    const d = wd(); if (!d) return;
    const it = d.items[Number(el.dataset.i)];
    if (it) { it[el.dataset.k] = el.value; save(); }
  };
  L.actions.wkMove = (el) => {
    const d = wd();
    const i = Number(el.dataset.i);
    const j = i + Number(el.dataset.dir);
    if (j < 0 || j >= d.items.length) return;
    const tmp = d.items[i]; d.items[i] = d.items[j]; d.items[j] = tmp;
    save();
    L.router.refresh();
  };
  L.actions.wkRemove = (el) => {
    const d = wd();
    const it = d.items.splice(Number(el.dataset.i), 1)[0];
    save();
    L.router.refresh();
    if (it) ui.toast(exercise(it.exerciseId).name + ' removido do treino.', 'info');
  };

  /* Biblioteca no montador (decisão “Exercício existe?”) */
  function libList() {
    const tr = L.auth.trainer();
    const q = (ui.state.libQuery || '').toLowerCase();
    const g = ui.state.libGroup || 'todos';
    const inTraining = (wd() ? wd().items : []).map((x) => x.exerciseId);
    const list = visibleExercises(tr).filter((e) => (g === 'todos' || e.group === g) && (!q || e.name.toLowerCase().indexOf(q) >= 0));
    if (!list.length) {
      return '<div class="empty"><p class="empty-title">Nenhum exercício encontrado' + (q ? ' para “' + esc(ui.state.libQuery) + '”' : '') + '</p><p class="empty-text">Cadastre um novo exercício e ele já entra no treino.</p>' +
        '<button type="button" class="btn btn-secondary btn-sm" data-action="libCreate">' + icon('plus', 16) + ' Cadastrar ' + (q ? '“' + esc(ui.state.libQuery) + '”' : 'exercício') + '</button></div>';
    }
    return '<ul class="list list-compact">' + list.map((e) => {
      const already = inTraining.indexOf(e.id) >= 0;
      const sel = ui.state.libSel.indexOf(e.id) >= 0;
      return '<li><button type="button" class="list-item lib-item' + (sel ? ' is-selected' : '') + '" data-action="libToggle" data-id="' + e.id + '"' + (already ? ' disabled' : '') + ' aria-pressed="' + sel + '">' + ui.exThumb(e.group) +
        '<span class="li-main"><strong>' + esc(e.name) + '</strong><small>' + esc(e.group) + (already ? ' · já está no treino' : '') + '</small></span><span class="lib-check" aria-hidden="true">' + icon('check', 14) + '</span></button></li>';
    }).join('') + '</ul>';
  }
  function libFooter() {
    const n = ui.state.libSel.length;
    return '<button type="button" class="btn btn-primary btn-block" data-action="libAdd"' + (n ? '' : ' disabled') + '>Adicionar ' + (n ? n + ' exercício' + (n > 1 ? 's' : '') : 'exercícios') + '</button>' +
      '<button type="button" class="btn btn-ghost btn-block btn-sm" data-action="libCreate">Não encontrou? Cadastrar exercício</button>';
  }
  L.actions.openLibrary = () => {
    ui.state.libSel = [];
    ui.state.libQuery = '';
    ui.state.libGroup = 'todos';
    ui.sheet({
      title: 'Biblioteca de exercícios', cls: 'sheet-tall',
      body: '<div class="search">' + icon('search', 18) + '<input type="search" class="input" placeholder="Buscar exercício…" data-input="libSearch" aria-label="Buscar exercício"></div>' +
        '<div id="libChips">' + ui.chips([{ key: 'todos', label: 'Todos' }].concat(GROUPS.map((g) => ({ key: g, label: g }))), 'todos', 'libGroup') + '</div>' +
        '<div id="libList" aria-live="polite">' + libList() + '</div>',
      footer: '<div id="libFoot" class="btn-stack">' + libFooter() + '</div>',
    });
  };
  const libUpdate = () => {
    const l = document.getElementById('libList'); if (l) l.innerHTML = libList();
    const f = document.getElementById('libFoot'); if (f) f.innerHTML = libFooter();
  };
  L.inputs.libSearch = (inp) => { ui.state.libQuery = inp.value; libUpdate(); };
  L.actions.libGroup = (btn) => {
    ui.state.libGroup = btn.dataset.key;
    document.getElementById('libChips').innerHTML = ui.chips([{ key: 'todos', label: 'Todos' }].concat(GROUPS.map((g) => ({ key: g, label: g }))), ui.state.libGroup, 'libGroup');
    libUpdate();
  };
  L.actions.libToggle = (btn) => {
    const id = btn.dataset.id;
    const i = ui.state.libSel.indexOf(id);
    if (i >= 0) ui.state.libSel.splice(i, 1); else ui.state.libSel.push(id);
    btn.classList.toggle('is-selected', i < 0);
    btn.setAttribute('aria-pressed', String(i < 0));
    const f = document.getElementById('libFoot'); if (f) f.innerHTML = libFooter();
  };
  L.actions.libAdd = () => {
    const d = wd();
    const n = ui.state.libSel.length;
    ui.state.libSel.forEach((id) => d.items.push({ exerciseId: id, sets: 3, reps: '12', load: '' }));
    save();
    ui.closeSheet();
    L.router.refresh();
    ui.toast(n + ' exercício' + (n > 1 ? 's adicionados' : ' adicionado') + ' ao treino.');
  };
  L.actions.libCreate = () => { L.router.go('/p/exercises/new?return=builder' + (ui.state.libQuery ? '&name=' + encodeURIComponent(ui.state.libQuery) : '')); };

  L.forms.workout = async (f) => {
    const d = wd();
    const tr = L.auth.trainer();
    L.form.clear(f);
    const errs = [];
    if (!d.editId && !d.studentId) errs.push(['studentId', 'Selecione o aluno.']);
    if (!d.name || d.name.trim().length < 2) errs.push(['name', 'Dê um nome ao treino.']);
    if (!d.items.length) errs.push(['items', 'Adicione ao menos um exercício.']);
    d.items.forEach((it, i) => {
      if (!(Number(it.sets) >= 1 && Number(it.sets) <= 12) || !String(it.reps || '').trim()) {
        errs.push(['items', 'Confira séries (1 a 12) e repetições do exercício ' + (i + 1) + '.']);
        const row = f.querySelectorAll('.ex-row')[i];
        if (row) row.classList.add('is-invalid');
      }
    });
    if (errs.length) {
      const seen = {};
      errs.forEach(([n, m]) => { if (!seen[n]) { seen[n] = 1; L.form.error(f, n, m); } });
      const el = f.querySelector('[aria-invalid="true"]') || f.querySelector('[data-err="items"]');
      if (el) { el.scrollIntoView({ block: 'center' }); if (el.focus) el.focus(); }
      return;
    }
    const items = d.items.map((it) => ({ exerciseId: it.exerciseId, sets: Number(it.sets), reps: String(it.reps).trim(), load: L.parseDec(it.load) }));
    const today = D.todayIso();
    const s = db().students.find((x) => x.id === d.studentId);
    await ui.busy(d.editId ? 'Salvando alterações…' : 'Salvando e atribuindo ao aluno…', 750);
    if (d.editId) {
      const w = db().workouts.find((x) => x.id === d.editId);
      Object.assign(w, { name: d.name.trim(), goal: d.goal.trim(), days: d.days.slice(), items, updatedAt: today });
      L.notify(s.id, 'workout', 'Seu treino ' + w.name + ' foi atualizado pelo personal.', '/a/workouts/' + w.id);
      ui.toast('Treino atualizado. ' + L.first(s.name) + ' foi avisado(a).');
    } else {
      const id = L.uid('w');
      db().workouts.push({ id, trainerId: tr.id, studentId: s.id, name: d.name.trim(), goal: d.goal.trim(), days: d.days.slice(), items, active: true, createdAt: today, updatedAt: today });
      L.notify(s.id, 'workout', 'Novo treino disponível: ' + d.name.trim() + '.', '/a/workouts/' + id);
      ui.toast('Treino salvo e enviado para ' + L.first(s.name) + '.');
    }
    db().drafts.workout = null;
    save();
    L.router.go('/p/students/' + s.id);
  };
  L.actions.deleteWorkout = async (el) => {
    const w = db().workouts.find((x) => x.id === el.dataset.id);
    const ok = await ui.confirm({ title: 'Arquivar treino?', text: 'O treino ' + w.name + ' deixa de aparecer para o aluno. O histórico de treinos concluídos é mantido.', ok: 'Arquivar', danger: true });
    if (!ok) return;
    w.active = false;
    db().drafts.workout = null;
    save();
    ui.toast('Treino arquivado.', 'info');
    L.router.go('/p/students/' + w.studentId);
  };

  /* ---------- Tela 22 · Cadastro de exercício ---------- */
  L.route('/p/exercises/new', {
    role: 'personal',
    render(ctx) {
      const ret = ctx.query.return === 'builder' && db().drafts.workout;
      ui.state.exMedia = null;
      return {
        title: 'Novo exercício', nav: 'personal', tab: 'home',
        html: ui.appBar({ title: 'Novo exercício', back: ret ? L.builderPath() : '/p/workouts?tab=exercicios' }) +
          '<main class="content"><form class="form" data-form="exercise" data-return="' + (ret ? 'builder' : '') + '" novalidate><div class="form-alert" hidden></div>' +
          '<label class="media-drop" id="exMediaBox"><input type="file" accept="image/*" class="sr-only" data-change="exMedia" aria-label="Adicionar imagem demonstrativa (opcional)">' +
          '<span class="media-empty">' + icon('image', 28) + '<span>Adicionar imagem demonstrativa</span><small>Opcional · JPG ou PNG</small></span></label>' +
          ui.field({ name: 'name', label: 'Nome do exercício', placeholder: 'Ex.: Supino reto', value: ctx.query.name || '' }) +
          '<fieldset class="field"><legend class="label">Grupo muscular</legend><div class="chip-radios">' + GROUPS.map((g) => '<label class="chip-radio"><input type="radio" name="group" value="' + g + '"><span>' + g + '</span></label>').join('') + '</div>' + ui.errSlot('group') + '</fieldset>' +
          ui.field({ name: 'cadence', label: 'Cadência', placeholder: 'Ex.: 2-0-2', mask: 'cadence', help: 'Segundos na descida, pausa e subida.', attrs: 'inputmode="numeric"' }) +
          ui.field({ name: 'equipment', label: 'Equipamento', optional: true, placeholder: 'Ex.: Halteres' }) +
          ui.field({ name: 'video', label: 'Link de vídeo', type: 'url', optional: true, placeholder: 'https://', attrs: 'inputmode="url"' }) +
          '<div class="sticky-actions"><button type="submit" class="btn btn-primary btn-block btn-lg">Salvar exercício</button></div></form></main>',
      };
    },
  });
  L.changes.exMedia = async (inp) => {
    try {
      const src = await L.readImage(inp.files[0], 480);
      ui.state.exMedia = src;
      const box = document.getElementById('exMediaBox');
      const empty = box.querySelector('.media-empty');
      if (empty) empty.remove();
      let img = box.querySelector('img');
      if (!img) { img = document.createElement('img'); img.alt = 'Prévia da imagem do exercício'; box.appendChild(img); }
      img.src = src;
      box.classList.add('has-media');
    } catch (e) { ui.toast('Selecione um arquivo de imagem válido.', 'error'); }
  };
  L.forms.exercise = (f) => {
    const tr = L.auth.trainer();
    const v = L.form.validate(f, [
      ['name', (x) => x && x.length >= 3, 'Informe o nome do exercício.'],
      ['name', (x) => !visibleExercises(tr).some((e) => e.name.toLowerCase() === String(x).toLowerCase()), 'Já existe um exercício com esse nome na biblioteca.'],
      ['group', (x) => !!x, 'Selecione o grupo muscular.'],
      ['cadence', (x) => /^\d+(-\d+){2,3}$/.test(x || ''), 'Use o formato 2-0-2.'],
      ['video', (x) => !x || /^https?:\/\/\S+\.\S+/.test(x), 'Informe um link começando com http:// ou https://.'],
    ]);
    if (!v) return;
    const id = L.uid('ex');
    db().exercises.push({ id, name: v.name, group: v.group, cadence: v.cadence, equipment: v.equipment || '', video: v.video || '', media: ui.state.exMedia || '', trainerId: tr.id });
    save();
    if (f.dataset.return === 'builder' && db().drafts.workout) {
      db().drafts.workout.items.push({ exerciseId: id, sets: 3, reps: '12', load: '' });
      save();
      ui.toast('Exercício cadastrado e adicionado ao treino.');
      L.router.go(L.builderPath());
    } else {
      ui.toast('Exercício cadastrado na biblioteca.');
      L.router.go('/p/workouts?tab=exercicios');
    }
  };

  /* ======================= Área do Aluno ======================= */

  /* ---------- Tela 23 · Treinos e Progresso ---------- */
  L.route('/a/workouts', {
    role: 'student',
    render() {
      const s = L.auth.student();
      const tr = L.auth.trainer();
      const ws = workoutsOf(s.id);
      const tw = L.todayWorkout(s.id);
      const today = D.todayIso();
      const logs = db().logs.filter((l) => l.studentId === s.id).sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1));
      const doneToday = tw && logs.find((l) => l.workoutId === tw.id && l.date === today);
      const month = today.slice(0, 7);
      const pr = s.progress.slice().sort((a, b) => (a.date > b.date ? 1 : -1));
      let todayCard;
      if (!ws.length) {
        todayCard = ui.empty({ icon: 'dumbbell', title: 'Nenhum treino ainda', text: L.first(tr.name) + ' vai enviar seus treinos por aqui.', action: '<a class="btn btn-secondary btn-sm" href="#/a/chat">Falar com o personal</a>' });
      } else if (tw) {
        todayCard = '<a class="card card-today" href="#/a/workouts/' + tw.id + '"><span class="eyebrow">Treino do dia · ' + D.WD[D.today().getDay()] + '</span><h2 class="today-title">' + esc(tw.name) + '</h2>' +
          '<p class="small muted">' + tw.items.length + ' exercícios · cerca de ' + tw.items.length * 9 + ' min</p><div class="row-between">' +
          (doneToday ? ui.badge('concluida', 'Concluído hoje') : '<span class="small muted">Objetivo: ' + esc(tw.goal) + '</span>') +
          '<span class="btn btn-primary btn-sm">' + (doneToday ? 'Ver' : 'Abrir') + '</span></div></a>';
      } else {
        const nx = L.nextWorkoutDay(s.id);
        todayCard = '<div class="card card-rest">' + icon('moon', 22) + '<div><strong>Hoje é dia de descanso</strong><p class="small muted">' + (nx ? 'Próximo treino: ' + esc(nx.w.name) + ' · ' + D.relative(nx.iso).toLowerCase() : 'Aproveite para recuperar.') + '</p></div></div>';
      }
      const others = ws.filter((w) => !tw || w.id !== tw.id);
      return {
        title: 'Treinos', nav: 'student', tab: 'workouts',
        html: '<header class="page-head"><h1>Meus treinos</h1><p>Atribuídos por ' + esc(tr.name) + '</p></header><main class="content">' + todayCard +
          (pr.length ? '<section class="card"><div class="row-between"><h2 class="card-title">Progresso</h2><span class="small muted">Peso corporal (kg)</span></div>' +
            ui.lineChart(pr.map((p) => ({ label: D.short(p.date), value: p.weight })), { label: 'Evolução do seu peso corporal', unit: ' kg' }) +
            '<div class="stats-inline"><div><strong>' + logs.filter((l) => l.date.slice(0, 7) === month).length + '</strong><small>treinos no mês</small></div>' +
            '<div><strong>' + (pr.length > 1 ? (pr[pr.length - 1].weight - pr[0].weight > 0 ? '+' : '') + L.num(pr[pr.length - 1].weight - pr[0].weight, 1) : '0') + ' kg</strong><small>desde o início</small></div>' +
            '<div><strong>' + (s.bodyFat ? L.num(s.bodyFat, 1) + '%' : '—') + '</strong><small>gordura</small></div></div></section>' : '') +
          (others.length ? '<h2 class="section-title">Outros treinos</h2><ul class="list">' + others.map((w) => '<li><a class="list-item list-link" href="#/a/workouts/' + w.id + '"><span class="li-icon">' + icon('dumbbell', 18) + '</span><span class="li-main"><strong>' + esc(w.name) + '</strong><small>' + w.items.length + ' exercícios · ' + daysLabel(w.days) + '</small></span>' + icon('chevron-right', 18, 'li-chev') + '</a></li>').join('') + '</ul>' : '') +
          (logs.length ? '<h2 class="section-title">Histórico</h2><ul class="list">' + logs.slice(0, 5).map((l) => {
            const w = db().workouts.find((x) => x.id === l.workoutId);
            return '<li class="list-item"><span class="li-icon li-icon-success">' + icon('check', 16) + '</span><span class="li-main"><strong>' + esc(w ? w.name : 'Treino') + '</strong><small>' + D.relative(l.date) + ' · ' + l.done.length + '/' + l.total + ' exercícios</small></span></li>';
          }).join('') + '</ul>' : '') + '</main>',
      };
    },
  });

  /* ---------- Tela 24 · Treino do dia (execução) ---------- */
  function sessionDraft(w) {
    const today = D.todayIso();
    const dr = db().drafts;
    if (!dr.session || dr.session.workoutId !== w.id || dr.session.date !== today) {
      dr.session = { workoutId: w.id, date: today, done: [], loads: {}, sets: {} };
      save();
    }
    return dr.session;
  }
  L.route('/a/workouts/:id', {
    role: 'student',
    render(ctx) {
      const s = L.auth.student();
      const w = db().workouts.find((x) => x.id === ctx.params.id && x.studentId === s.id && x.active);
      if (!w) { L.router.replace('/a/workouts'); return null; }
      const ss = sessionDraft(w);
      const n = w.items.length;
      const done = ss.done.length;
      const logged = db().logs.find((l) => l.workoutId === w.id && l.date === D.todayIso());
      return {
        title: w.name,
        html: ui.appBar({ title: w.name, back: '/a/workouts' }) +
          '<main class="content"><p class="muted small">Objetivo: ' + esc(w.goal || '—') + ' · ' + n + ' exercícios</p>' +
          (logged ? '<div class="alert alert-success">' + icon('check-circle', 18) + '<span>Você concluiu este treino hoje às ' + logged.time + '. Pode registrar de novo, se quiser.</span></div>' : '') +
          '<div class="exec-progress"><div class="row-between small"><span id="execCount">' + done + ' de ' + n + ' concluídos</span><span id="execPct">' + Math.round((done / n) * 100) + '%</span></div><div id="execBar">' + ui.bar((done / n) * 100) + '</div></div>' +
          '<ul class="exec-list">' + w.items.map((it) => {
            const ex = exercise(it.exerciseId);
            const isDone = ss.done.indexOf(ex.id) >= 0;
            const load = ss.loads[ex.id] != null ? ss.loads[ex.id] : L.fmtDec(it.load || '');
            const sets = ss.sets[ex.id] != null ? ss.sets[ex.id] : it.sets;
            return '<li class="exec-item' + (isDone ? ' is-done' : '') + '"><div class="exec-main">' + ui.exThumb(ex.group) +
              '<span class="li-main"><strong>' + esc(ex.name) + '</strong><small>' + it.sets + ' séries · ' + esc(it.reps) + ' reps · ' + fmtKg(it.load) + '</small></span>' +
              '<button type="button" class="check-btn" data-action="execToggle" data-ex="' + ex.id + '" aria-pressed="' + isDone + '" aria-label="Marcar ' + esc(ex.name) + ' como concluído">' + icon('check', 18) + '</button></div>' +
              '<details class="exec-details"><summary>Registrar carga e séries</summary><div class="exec-fields">' +
              '<label class="mini-field"><span>Carga usada (kg)</span><input class="input input-sm" inputmode="decimal" data-mask="decimal" data-input="execVal" data-k="loads" data-ex="' + ex.id + '" value="' + esc(load) + '"></label>' +
              '<label class="mini-field"><span>Séries feitas</span><input class="input input-sm" inputmode="numeric" data-mask="int" data-input="execVal" data-k="sets" data-ex="' + ex.id + '" value="' + esc(sets) + '"></label></div>' +
              '<p class="small muted">Cadência ' + esc(ex.cadence) + (ex.equipment ? ' · ' + esc(ex.equipment) : '') + '</p></details></li>';
          }).join('') + '</ul>' +
          '<div class="sticky-actions"><button type="button" class="btn btn-primary btn-block btn-lg" data-action="execFinish" data-id="' + w.id + '">Finalizar treino</button></div></main>',
      };
    },
  });
  L.actions.execToggle = (btn) => {
    const ss = db().drafts.session;
    if (!ss) return;
    const id = btn.dataset.ex;
    const i = ss.done.indexOf(id);
    if (i >= 0) ss.done.splice(i, 1); else ss.done.push(id);
    save();
    const on = i < 0;
    btn.setAttribute('aria-pressed', String(on));
    btn.closest('.exec-item').classList.toggle('is-done', on);
    const n = document.querySelectorAll('.exec-item').length;
    const d = ss.done.length;
    document.getElementById('execCount').textContent = d + ' de ' + n + ' concluídos';
    document.getElementById('execPct').textContent = Math.round((d / n) * 100) + '%';
    document.getElementById('execBar').innerHTML = ui.bar((d / n) * 100);
  };
  L.inputs.execVal = (inp) => {
    const ss = db().drafts.session;
    if (!ss) return;
    ss[inp.dataset.k][inp.dataset.ex] = inp.value;
    save();
  };
  L.actions.execFinish = async (btn) => {
    const s = L.auth.student();
    const w = db().workouts.find((x) => x.id === btn.dataset.id);
    const ss = db().drafts.session;
    const n = w.items.length;
    if (!ss || !ss.done.length) { ui.toast('Marque ao menos um exercício como concluído.', 'warning'); return; }
    if (ss.done.length < n) {
      const ok = await ui.confirm({ title: 'Finalizar treino?', text: 'Você concluiu ' + ss.done.length + ' de ' + n + ' exercícios. O treino será registrado assim mesmo.', ok: 'Finalizar' });
      if (!ok) return;
    }
    await ui.busy('Registrando treino…', 700);
    const loads = {};
    Object.keys(ss.loads).forEach((k) => { loads[k] = L.parseDec(ss.loads[k]); });
    db().logs.push({ id: L.uid('lg'), trainerId: s.trainerId, studentId: s.id, workoutId: w.id, date: D.todayIso(), time: D.nowHm(), done: ss.done.slice(), loads, sets: Object.assign({}, ss.sets), total: n });
    db().drafts.session = null;
    save();
    ui.toast('Treino registrado! Seu personal já pode ver seu progresso.');
    L.router.go('/a/workouts');
  };

  /* ---------- Tela 25 · Anamnese de Saúde ---------- */
  function anamDraft(s) {
    const dr = db().drafts;
    dr.anamnese = dr.anamnese || {};
    if (!dr.anamnese[s.id]) {
      const a = s.anamnese || { answers: {}, consent: false };
      dr.anamnese[s.id] = { answers: JSON.parse(JSON.stringify(a.answers)), consent: !!a.consent };
    }
    return dr.anamnese[s.id];
  }
  L.route('/a/anamnese', {
    role: 'student',
    render(ctx) {
      const s = L.auth.student();
      const step = Math.min(3, Math.max(1, parseInt(ctx.query.step, 10) || 1));
      const d = anamDraft(s);
      const sec = L.ANAMNESE[step - 1];
      return {
        title: 'Anamnese de Saúde',
        html: ui.appBar({ title: 'Anamnese de Saúde', back: step > 1 ? '/a/anamnese?step=' + (step - 1) : '/a/profile' }) +
          '<main class="content">' + ui.steps(step, 3, sec.title) +
          '<form class="form" data-form="anamnese" data-step="' + step + '" novalidate><div class="form-alert" hidden></div>' +
          sec.qs.map(([id, q, noNote]) => {
            const a = d.answers[id] || {};
            return '<fieldset class="qa-field"><legend class="qa-legend">' + esc(q) + '</legend><div class="yn">' +
              ['sim', 'nao'].map((v) => '<label class="yn-opt"><input type="radio" name="' + id + '" value="' + v + '"' + (a.v === v ? ' checked' : '') + ' data-change="anam"><span>' + (v === 'sim' ? 'Sim' : 'Não') + '</span></label>').join('') + '</div>' +
              (noNote ? '' : '<div class="reveal" data-show-if="' + id + '"' + (a.v === 'sim' ? '' : ' hidden') + '><textarea class="input textarea textarea-sm" name="' + id + '_note" rows="2" placeholder="Descreva brevemente" data-input="anam" aria-label="Detalhes: ' + esc(q) + '">' + esc(a.note || '') + '</textarea></div>') +
              ui.errSlot(id) + '</fieldset>';
          }).join('') +
          (step === 3 ? '<label class="check-row consent"><input type="checkbox" name="consent" value="1"' + (d.consent ? ' checked' : '') + ' data-change="anam"><span class="check-box" aria-hidden="true">' + icon('check', 14) + '</span><span>Autorizo o compartilhamento destas informações de saúde com meu personal, exclusivamente para o planejamento dos meus treinos.</span></label>' +
            ui.errSlot('consent') + '<p class="help">Dados de saúde são dados pessoais sensíveis (LGPD, art. 11). Você pode revogar esta autorização quando quiser.</p>' : '') +
          '<div class="sticky-actions"><button type="submit" class="btn btn-primary btn-block btn-lg">' + (step < 3 ? 'Próximo' : 'Salvar anamnese') + '</button></div></form></main>',
      };
    },
  });
  function syncAnam(f) {
    const s = L.auth.student();
    const d = anamDraft(s);
    const step = Number(f.dataset.step);
    const v = L.form.values(f);
    L.ANAMNESE[step - 1].qs.forEach(([id]) => {
      d.answers[id] = { v: v[id] || '', note: v[id] === 'sim' ? v[id + '_note'] || '' : '' };
      const rv = f.querySelector('[data-show-if="' + id + '"]');
      if (rv) rv.hidden = v[id] !== 'sim';
    });
    if (step === 3) d.consent = v.consent === '1';
    save();
    return d;
  }
  L.changes.anam = (el) => syncAnam(el.form);
  L.inputs.anam = (el) => syncAnam(el.form);
  L.forms.anamnese = async (f) => {
    const d = syncAnam(f);
    const step = Number(f.dataset.step);
    L.form.clear(f);
    let bad = false;
    L.ANAMNESE[step - 1].qs.forEach(([id]) => { if (!d.answers[id] || !d.answers[id].v) { bad = true; L.form.error(f, id, 'Responda Sim ou Não.'); } });
    if (step === 3 && !d.consent) { bad = true; L.form.error(f, 'consent', 'É preciso autorizar para salvar a anamnese.'); }
    if (bad) { L.form.focusFirst(f); return; }
    if (step < 3) { L.router.go('/a/anamnese?step=' + (step + 1)); return; }
    await ui.busy('Salvando anamnese…', 700);
    const s = L.auth.student();
    const today = D.todayIso();
    s.anamnese = { answers: d.answers, consent: true, consentAt: (s.anamnese && s.anamnese.consentAt) || today, filledAt: today };
    delete db().drafts.anamnese[s.id];
    save();
    ui.toast('Anamnese salva! Seu personal já pode ver suas respostas.');
    L.router.go('/a/profile');
  };

  /* ---------- Tela 26 · Hábitos e Rotina ---------- */
  const slider = (name, label, min, max, step, val, fmt, low, high) => {
    const pct = ((val - min) / (max - min)) * 100;
    return '<div class="slider-field"><div class="row-between"><label class="label" for="sl-' + name + '">' + label + '</label><output id="out-' + name + '" for="sl-' + name + '">' + fmt(val) + '</output></div>' +
      '<input type="range" class="range" id="sl-' + name + '" name="' + name + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '" style="--pct:' + pct + '%" data-input="sliderOut" data-fmt="' + name + '">' +
      '<div class="slider-scale" aria-hidden="true"><span>' + low + '</span><span>' + high + '</span></div></div>';
  };
  const FMT = {
    sleep: (v) => L.num(v, 1) + ' h',
    stress: (v) => LEVEL.stress[v - 1],
    food: (v) => LEVEL.food[v - 1],
    water: (v) => L.num(v, 1) + ' L',
  };
  L.inputs.sliderOut = (inp) => {
    const v = Number(inp.value);
    const pct = ((v - Number(inp.min)) / (Number(inp.max) - Number(inp.min))) * 100;
    inp.style.setProperty('--pct', pct + '%');
    const out = document.getElementById('out-' + inp.name);
    if (out) out.textContent = FMT[inp.dataset.fmt](v);
  };
  L.route('/a/habits', {
    role: 'student',
    render() {
      const s = L.auth.student();
      const h = s.habits || { sleep: 7, stress: 3, food: 3, water: 2, notes: '' };
      return {
        title: 'Hábitos e Rotina',
        html: ui.appBar({ title: 'Hábitos e Rotina', back: '/a/profile' }) +
          '<main class="content"><p class="muted small">Essas informações ajudam seu personal a ajustar a intensidade dos treinos.</p>' +
          '<form class="form" data-form="habits" novalidate>' +
          slider('sleep', 'Sono (horas por noite)', 3, 12, 0.5, h.sleep, FMT.sleep, 'Pouco', 'Muito') +
          slider('stress', 'Nível de estresse', 1, 5, 1, h.stress, FMT.stress, 'Baixo', 'Alto') +
          slider('food', 'Alimentação', 1, 5, 1, h.food, FMT.food, 'Ruim', 'Ótima') +
          slider('water', 'Hidratação (litros por dia)', 0.5, 5, 0.5, h.water || 2, FMT.water, '0,5 L', '5 L') +
          ui.field({ name: 'notes', label: 'Observações', type: 'textarea', optional: true, placeholder: 'Algo que o personal deva saber', value: h.notes, attrs: 'rows="3"' }) +
          '<div class="sticky-actions"><button type="submit" class="btn btn-primary btn-block btn-lg">Salvar</button></div></form></main>',
      };
    },
  });
  L.forms.habits = async (f) => {
    const v = L.form.values(f);
    const s = L.auth.student();
    await ui.busy('Salvando…', 500);
    s.habits = { sleep: Number(v.sleep), stress: Number(v.stress), food: Number(v.food), water: Number(v.water), notes: v.notes || '', updatedAt: D.todayIso() };
    save();
    ui.toast('Hábitos atualizados.');
    L.router.go('/a/profile');
  };

  /* ---------- Tela 27 · Fotos de Evolução ---------- */
  L.route('/a/photos', {
    role: 'student',
    render(ctx) {
      const s = L.auth.student();
      const ang = ['frente', 'lado', 'costas'].indexOf(ctx.query.angle) >= 0 ? ctx.query.angle : 'frente';
      const ps = s.photos.filter((p) => p.angle === ang).sort((a, b) => (a.date < b.date ? 1 : -1));
      return {
        title: 'Fotos de Evolução',
        html: ui.appBar({ title: 'Fotos de Evolução', back: '/a/profile' }) + '<main class="content">' +
          ui.segLinks(['frente', 'lado', 'costas'].map((a) => ({ key: a, label: D.cap(a), href: '/a/photos?angle=' + a })), ang) +
          (ps.length ? '<div class="photo-grid">' + ps.map((p) => '<figure class="photo"><div class="photo-img">' + ui.photo(p, 'Foto de ' + ang + ' em ' + D.fmt(p.date)) + '</div>' +
            '<figcaption><span>' + D.fmt(p.date) + '</span><button type="button" class="icon-btn icon-btn-xs" data-action="photoDelete" data-id="' + p.id + '" aria-label="Excluir foto de ' + D.fmt(p.date) + '">' + icon('trash', 14) + '</button></figcaption></figure>').join('') + '</div>'
            : ui.empty({ icon: 'camera', title: 'Nenhuma foto de ' + ang, text: 'Tire fotos sempre no mesmo local e com a mesma luz para comparar melhor.' })) +
          '<p class="help center">' + icon('lock', 14) + ' Suas fotos ficam visíveis apenas para você e seu personal.</p>' +
          '<div class="sticky-actions"><label class="btn btn-primary btn-block btn-lg file-btn">' + icon('camera', 18) + ' Adicionar foto<input type="file" accept="image/*" class="sr-only" data-change="photoAdd" data-angle="' + ang + '"></label></div></main>',
      };
    },
  });
  L.changes.photoAdd = async (inp) => {
    const s = L.auth.student();
    try {
      const src = await L.readImage(inp.files[0], 420);
      s.photos.push({ id: L.uid('ph'), angle: inp.dataset.angle, date: D.todayIso(), src });
      save();
      ui.toast('Foto adicionada.');
      L.router.refresh();
    } catch (e) { ui.toast('Selecione um arquivo de imagem válido.', 'error'); }
  };
  L.actions.photoDelete = async (btn) => {
    const s = L.auth.student();
    const ok = await ui.confirm({ title: 'Excluir foto?', text: 'A foto será removida do seu histórico de evolução. Esta ação não pode ser desfeita.', ok: 'Excluir', danger: true });
    if (!ok) return;
    s.photos = s.photos.filter((p) => p.id !== btn.dataset.id);
    save();
    ui.toast('Foto excluída.', 'info');
    L.router.refresh();
  };
})();
