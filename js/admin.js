/* LIFT – Área do Administrador (Tela 09 e telas de apoio) */
(function () {
  'use strict';
  const L = window.LIFT, ui = L.ui, esc = L.esc, D = L.d;
  const icon = (n, s, c) => L.icon(n, s, c);
  const db = () => L.store.db;
  const save = () => L.store.save();

  function stats() {
    const trs = db().trainers;
    const ext = trs.reduce((a, t) => a + (t.extStudents || 0), 0);
    const students = db().students.length + ext;
    const activeStudents = db().students.filter((s) => s.status === 'ativo').length + ext;
    const paid = trs.filter((t) => t.plan && t.plan !== 'free' && t.planStatus === 'ativa');
    const trials = trs.filter((t) => t.planStatus === 'trial');
    const mrr = paid.reduce((a, t) => a + L.plan(t.plan).price, 0);
    const dist = L.PLANS.map((p) => ({ p, n: trs.filter((t) => t.plan === p.id && t.planStatus !== 'cancelada').length }));
    return { trainers: trs.length, students, activeStudents, users: trs.length + students, paid: paid.length, trials: trials.length, mrr, dist };
  }
  const PLAN_COLOR = { free: 'muted', starter: 'info', profissional: 'primary', elite: 'success' };
  function distribution(st) {
    const total = st.dist.reduce((a, d) => a + d.n, 0) || 1;
    return '<div class="stack-bar stack-bar-lg" role="img" aria-label="Distribuição dos planos: ' + st.dist.map((d) => d.p.name + ' ' + d.n).join(', ') + '">' +
      st.dist.map((d) => '<span class="seg-' + PLAN_COLOR[d.p.id] + '" style="width:' + (d.n / total) * 100 + '%"></span>').join('') + '</div>' +
      '<ul class="legend-list">' + st.dist.map((d) => '<li><span><i class="dot dot-' + PLAN_COLOR[d.p.id] + '"></i>' + d.p.name + '</span><strong>' + d.n + '</strong><small>' + Math.round((d.n / total) * 100) + '%</small></li>').join('') + '</ul>';
  }
  function userItem(u) {
    let sub = esc(u.email);
    if (u.role === 'personal') { const t = db().trainers.find((x) => x.id === u.refId); if (t) sub = 'Plano ' + (L.plan(t.plan) ? L.plan(t.plan).name : '—') + ' · ' + ((t.extStudents || 0) + db().students.filter((s) => s.trainerId === t.id).length) + ' alunos'; }
    if (u.role === 'student') { const s = db().students.find((x) => x.id === u.refId); const t = s && db().trainers.find((x) => x.id === s.trainerId); if (t) sub = 'Aluno de ' + esc(t.name); }
    return '<li><a class="list-item list-link" href="#/admin/users/' + u.id + '">' + ui.avatar(u.name, 'sm') + '<span class="li-main"><strong>' + esc(u.name) + '</strong><small>' + sub + '</small></span>' +
      '<span class="li-end">' + (u.active ? ui.badge(u.role) : ui.badge('inativo', 'Desativado')) + '</span></a></li>';
  }
  function recentList() {
    const q = (ui.state.admQuery || '').toLowerCase();
    let list = db().users.filter((u) => u.role !== 'admin');
    if (q) list = list.filter((u) => u.name.toLowerCase().indexOf(q) >= 0 || u.email.toLowerCase().indexOf(q) >= 0);
    list = list.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, q ? 20 : 5);
    return list.length ? '<ul class="list">' + list.map(userItem).join('') + '</ul>' : ui.empty({ icon: 'search', title: 'Nenhum usuário encontrado' });
  }

  L.route('/admin', {
    role: 'admin',
    render() {
      const st = stats();
      const tile = (v, label, ic) => '<div class="kpi">' + icon(ic, 18) + '<span class="kpi-value">' + v + '</span><span class="kpi-label">' + label + '</span></div>';
      return {
        title: 'Painel Administrativo', nav: 'admin', tab: 'home',
        html: '<header class="home-head"><div><p class="home-date">Visão geral da plataforma</p><h1 class="home-hello">Painel Administrativo</h1></div><a class="avatar-link" href="#/admin/account" aria-label="Minha conta">' + ui.avatar('Equipe LIFT', 'md') + '</a></header>' +
          '<main class="content"><div class="kpi-grid">' +
          tile(st.trainers, 'Personais', 'dumbbell') + tile(st.activeStudents, 'Alunos ativos', 'users') +
          tile(st.paid, 'Assinaturas pagas', 'card') + tile(st.trials, 'Trials ativos', 'star') +
          tile(L.money(st.mrr), 'Receita mensal', 'trending-up') + tile(st.users, 'Usuários', 'user') + '</div>' +
          '<section class="card"><div class="row-between"><h2 class="card-title">Distribuição dos planos</h2><a class="link link-sm" href="#/admin/plans">Detalhes</a></div>' + distribution(st) + '</section>' +
          '<div class="search">' + icon('search', 18) + '<input type="search" class="input" placeholder="Buscar usuário por nome ou e-mail…" value="' + esc(ui.state.admQuery || '') + '" data-input="admSearch" aria-label="Buscar usuário"></div>' +
          '<h2 class="section-title" id="admTitle">' + (ui.state.admQuery ? 'Resultados' : 'Cadastros recentes') + '</h2><div id="admList" aria-live="polite">' + recentList() + '</div></main>',
      };
    },
  });
  L.inputs.admSearch = (inp) => {
    ui.state.admQuery = inp.value;
    document.getElementById('admList').innerHTML = recentList();
    document.getElementById('admTitle').textContent = inp.value ? 'Resultados' : 'Cadastros recentes';
  };

  L.route('/admin/users', {
    role: 'admin',
    render(ctx) {
      const role = ctx.query.role === 'student' ? 'student' : 'personal';
      const list = db().users.filter((u) => u.role === role).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      return {
        title: 'Usuários', nav: 'admin', tab: 'users',
        html: ui.appBar({ title: 'Usuários', sub: db().users.filter((u) => u.role === 'personal').length + ' personais · ' + db().users.filter((u) => u.role === 'student').length + ' alunos com cadastro' }) +
          '<main class="content">' + ui.segLinks([{ key: 'personal', label: 'Personais', href: '/admin/users' }, { key: 'student', label: 'Alunos', href: '/admin/users?role=student' }], role) +
          '<ul class="list">' + list.map(userItem).join('') + '</ul></main>',
      };
    },
  });

  L.route('/admin/users/:id', {
    role: 'admin',
    render(ctx) {
      const u = db().users.find((x) => x.id === ctx.params.id && x.role !== 'admin');
      if (!u) { L.router.replace('/admin/users'); return null; }
      let rows = ui.kv('E-mail', esc(u.email)) + ui.kv('Cadastro', D.fmt(u.createdAt));
      if (u.role === 'personal') {
        const t = db().trainers.find((x) => x.id === u.refId);
        const p = L.plan(t.plan);
        rows += ui.kv('Plano', p ? p.name + (p.price ? ' · ' + L.money(p.price) + '/mês' : '') : 'Nenhum') +
          ui.kv('Situação do plano', ui.badge(t.planStatus === 'trial' ? 'trial' : t.planStatus === 'cancelada' ? 'cancelada_plano' : t.planStatus === 'ativa' ? 'ativa' : 'sem_plano')) +
          ui.kv('Alunos', String((t.extStudents || 0) + db().students.filter((s) => s.trainerId === t.id).length)) + ui.kv('Código de convite', esc(t.inviteCode));
      } else {
        const s = db().students.find((x) => x.id === u.refId);
        const t = s && db().trainers.find((x) => x.id === s.trainerId);
        rows += ui.kv('Personal', t ? esc(t.name) : '—') + ui.kv('Situação com o personal', ui.badge(s ? s.status : 'inativo'));
      }
      return {
        title: u.name, nav: 'admin', tab: 'users',
        html: ui.appBar({ title: 'Usuário', back: '/admin/users' + (u.role === 'student' ? '?role=student' : '') }) +
          '<main class="content"><section class="profile-head">' + ui.avatar(u.name, 'xl') + '<div class="profile-info"><h2 class="profile-name">' + esc(u.name) + '</h2><div class="badges">' + ui.badge(u.role) + (u.active ? ui.badge('ativo', 'Conta ativa') : ui.badge('inativo', 'Conta desativada')) + '</div></div></section>' +
          '<div class="kv-list kv-card">' + rows + '</div>' +
          (u.active ? '<button type="button" class="btn btn-outline-danger btn-block" data-action="admToggle" data-id="' + u.id + '">Desativar conta</button>'
            : '<button type="button" class="btn btn-primary btn-block" data-action="admToggle" data-id="' + u.id + '">Reativar conta</button>') +
          '<p class="help center">Contas desativadas não conseguem entrar no app.</p></main>',
      };
    },
  });
  L.actions.admToggle = async (b) => {
    const u = db().users.find((x) => x.id === b.dataset.id);
    if (u.active) {
      const ok = await ui.confirm({ title: 'Desativar conta?', text: u.name + ' não conseguirá mais entrar no LIFT até a conta ser reativada. Os dados são mantidos.', ok: 'Desativar', danger: true });
      if (!ok) return;
    }
    u.active = !u.active;
    save();
    ui.toast(u.active ? 'Conta reativada.' : 'Conta desativada.', u.active ? 'success' : 'info');
    L.router.refresh();
  };

  L.route('/admin/plans', {
    role: 'admin',
    render() {
      const st = stats();
      const trs = db().trainers;
      const rows = L.PLANS.map((p) => {
        const subs = trs.filter((t) => t.plan === p.id && t.planStatus === 'ativa').length;
        const tri = trs.filter((t) => t.plan === p.id && t.planStatus === 'trial').length;
        return { p, subs, tri, rev: subs * p.price };
      });
      const maxRev = Math.max.apply(null, rows.map((r) => r.rev)) || 1;
      const canc = trs.filter((t) => t.planStatus === 'cancelada').length;
      return {
        title: 'Planos', nav: 'admin', tab: 'plans',
        html: ui.appBar({ title: 'Planos e receita' }) + '<main class="content">' +
          '<section class="card card-summary"><p class="eyebrow">Receita mensal recorrente</p><p class="summary-value">' + L.money(st.mrr) + '</p>' +
          '<div class="summary-split"><div><span class="eyebrow-sm">Pagantes</span><strong>' + st.paid + '</strong></div><div><span class="eyebrow-sm">Em trial</span><strong>' + st.trials + '</strong></div><div><span class="eyebrow-sm">Cancelados</span><strong>' + canc + '</strong></div></div></section>' +
          '<ul class="plan-rows">' + rows.map((r) => '<li class="card plan-row"><div class="row-between"><strong>' + r.p.name + '</strong><span class="small muted">' + (r.p.price ? L.money(r.p.price) + '/mês' : 'Grátis') + '</span></div>' +
            '<div class="row-between small"><span>' + r.subs + (r.subs === 1 ? ' assinante ativo' : ' assinantes ativos') + (r.tri ? ' · ' + r.tri + ' em trial' : '') + '</span><strong>' + L.money(r.rev) + '</strong></div>' +
            ui.bar((r.rev / maxRev) * 100) + '</li>').join('') + '</ul>' +
          '<section class="card"><h2 class="card-title">Distribuição</h2>' + distribution(st) + '</section></main>',
      };
    },
  });

  L.route('/admin/account', {
    role: 'admin',
    render(ctx) {
      const u = ctx.session.user;
      return {
        title: 'Conta', nav: 'admin', tab: 'account',
        html: ui.appBar({ title: 'Minha conta' }) + '<main class="content"><section class="profile-head">' + ui.avatar(u.name, 'xl') + '<div class="profile-info"><h2 class="profile-name">' + esc(u.name) + '</h2><p class="muted small">' + esc(u.email) + '</p><div class="badges">' + ui.badge('admin', 'Administrador') + '</div></div></section>' +
          '<ul class="menu">' +
          '<li><button type="button" class="menu-item" data-action="switchProfile">' + icon('swap', 20) + '<span>Trocar de perfil</span>' + icon('chevron-right', 18, 'li-chev') + '</button></li>' +
          '<li><button type="button" class="menu-item menu-danger" data-action="logout">' + icon('logout', 20) + '<span>Sair</span></button></li></ul></main>',
      };
    },
  });
})();
