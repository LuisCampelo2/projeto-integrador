/* LIFT – telas compartilhadas: chat, perfis e notificações */
(function () {
  'use strict';
  const L = window.LIFT, ui = L.ui, esc = L.esc, D = L.d;
  const icon = (n, s, c) => L.icon(n, s, c);
  const db = () => L.store.db;
  const save = () => L.store.save();

  ui.navBadges = function (role) {
    if (role === 'personal') {
      const tr = L.auth.trainer();
      return { chat: tr ? db().messages.filter((m) => m.trainerId === tr.id && m.from === 'student' && !m.readT).length : 0 };
    }
    if (role === 'student') {
      const s = L.auth.student();
      return { chat: s ? db().messages.filter((m) => m.studentId === s.id && m.from === 'trainer' && !m.readS).length : 0 };
    }
    return {};
  };

  /* ---------- Chat ---------- */
  const timeLabel = (at) => { const d = at.slice(0, 10); return (d === D.todayIso() ? '' : D.relative(d) + ' · ') + at.slice(11, 16); };
  function thread(msgs, mine) {
    if (!msgs.length) return ui.empty({ icon: 'message', title: 'Nenhuma mensagem ainda', text: 'Comece a conversa abaixo.' });
    let last = '';
    return '<ol class="chat" aria-label="Mensagens">' + msgs.map((m) => {
      const day = m.at.slice(0, 10);
      const sep = day !== last ? '<li class="chat-day">' + D.relative(day) + '</li>' : '';
      last = day;
      return sep + '<li class="bubble ' + (m.from === mine ? 'is-mine' : 'is-theirs') + '"><p>' + esc(m.text) + '</p><time>' + m.at.slice(11, 16) + '</time></li>';
    }).join('') + '</ol>';
  }
  const composer = (sid) => '<form class="composer" data-form="chatSend" data-sid="' + sid + '" novalidate><label class="sr-only" for="chatInput">Mensagem</label>' +
    '<input id="chatInput" class="input" name="text" placeholder="Escreva uma mensagem…" autocomplete="off"><button type="submit" class="icon-btn icon-btn-primary" aria-label="Enviar">' + icon('send', 18) + '</button></form>';

  L.route('/p/chat', {
    role: 'personal',
    render() {
      const tr = L.auth.trainer();
      const studs = db().students.filter((s) => s.trainerId === tr.id && s.status === 'ativo');
      const rows = studs.map((s) => {
        const ms = db().messages.filter((m) => m.studentId === s.id && m.trainerId === tr.id);
        const last = ms[ms.length - 1];
        return { s, last, unread: ms.filter((m) => m.from === 'student' && !m.readT).length };
      }).sort((a, b) => ((a.last ? a.last.at : '') < (b.last ? b.last.at : '') ? 1 : -1));
      return {
        title: 'Chat', nav: 'personal', tab: 'chat',
        html: ui.appBar({ title: 'Chat', sub: 'Conversas com seus alunos' }) + '<main class="content"><ul class="list">' + rows.map((r) =>
          '<li><a class="list-item list-link' + (r.unread ? ' is-unread' : '') + '" href="#/p/chat/' + r.s.id + '">' + ui.avatar(r.s.name) +
          '<span class="li-main"><strong>' + esc(r.s.name) + '</strong><small>' + (r.last ? (r.last.from === 'trainer' ? 'Você: ' : '') + esc(r.last.text) : 'Nenhuma mensagem') + '</small></span>' +
          '<span class="li-end li-end-col"><small class="muted">' + (r.last ? timeLabel(r.last.at) : '') + '</small>' + (r.unread ? '<span class="count-badge">' + r.unread + '</span>' : '') + '</span></a></li>').join('') + '</ul></main>',
      };
    },
  });
  L.route('/p/chat/:sid', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const s = db().students.find((x) => x.id === ctx.params.sid && x.trainerId === tr.id);
      if (!s) { L.router.replace('/p/chat'); return null; }
      const msgs = db().messages.filter((m) => m.studentId === s.id && m.trainerId === tr.id);
      let ch = false;
      msgs.forEach((m) => { if (m.from === 'student' && !m.readT) { m.readT = true; ch = true; } });
      if (ch) save();
      return {
        title: 'Chat com ' + s.name, cls: 'screen-chat',
        html: ui.appBar({ title: s.name, sub: 'Aluno · ' + (s.goal || 'objetivo a definir'), back: '/p/chat', right: '<a class="icon-btn" href="#/p/students/' + s.id + '" aria-label="Ver perfil de ' + esc(s.name) + '">' + icon('user') + '</a>' }) +
          '<main class="content chat-content">' + thread(msgs, 'trainer') + '</main>' + composer(s.id),
        after(app) { const c = app.querySelector('.content'); c.scrollTop = c.scrollHeight; },
      };
    },
  });
  L.route('/a/chat', {
    role: 'student',
    render() {
      const s = L.auth.student();
      const tr = L.auth.trainer();
      const msgs = db().messages.filter((m) => m.studentId === s.id && m.trainerId === tr.id);
      let ch = false;
      msgs.forEach((m) => { if (m.from === 'trainer' && !m.readS) { m.readS = true; ch = true; } });
      if (ch) save();
      return {
        title: 'Chat', nav: 'student', tab: 'chat', cls: 'screen-chat',
        html: ui.appBar({ title: tr.name, sub: 'Seu personal' }) + '<main class="content chat-content">' + thread(msgs, 'student') + '</main>' + composer(s.id),
        after(app) { const c = app.querySelector('.content'); c.scrollTop = c.scrollHeight; },
      };
    },
  });
  L.forms.chatSend = (f) => {
    const text = (f.querySelector('[name=text]').value || '').trim();
    if (!text) return;
    const c = L.auth.current();
    const s = c.role === 'student' ? L.auth.student() : db().students.find((x) => x.id === f.dataset.sid);
    const tr = L.auth.trainer();
    const mine = c.role === 'student' ? 'student' : 'trainer';
    db().messages.push({ id: L.uid('m'), trainerId: tr.id, studentId: s.id, from: mine, text, at: D.stamp(), readT: mine === 'trainer', readS: mine === 'student' });
    save();
    L.router.refresh();
    const app = document.getElementById('app');
    const content = app.querySelector('.content');
    if (content) content.scrollTop = content.scrollHeight;
    const inp = app.querySelector('#chatInput');
    if (inp) inp.focus();
  };

  /* ---------- Perfil do personal ---------- */
  L.route('/p/profile', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const p = L.plan(tr.plan);
      const item = (href, ic, label, extra) => '<li><a class="menu-item" href="#' + href + '">' + icon(ic, 20) + '<span>' + label + '</span>' + (extra || '') + icon('chevron-right', 18, 'li-chev') + '</a></li>';
      return {
        title: 'Perfil', nav: 'personal', tab: 'profile',
        html: ui.appBar({ title: 'Meu perfil' }) + '<main class="content"><section class="profile-head">' + ui.avatar(tr.name, 'xl') + '<div class="profile-info"><h2 class="profile-name">' + esc(tr.name) + '</h2>' +
          '<p class="muted small">' + esc(ctx.session.user.email) + (tr.cref ? ' · CREF ' + esc(tr.cref) : '') + '</p><div class="badges">' + (p ? '<span class="badge badge-primary">Plano ' + p.name + '</span>' : '') + '</div></div></section>' +
          '<section class="card"><div class="row-between"><div><p class="eyebrow">Código de convite</p><p class="invite-inline">' + esc(tr.inviteCode) + '</p></div>' +
          '<button type="button" class="btn btn-secondary btn-sm" data-action="copy" data-text="' + esc(tr.inviteCode) + '" data-msg="Código copiado!">' + icon('copy', 16) + ' Copiar</button></div>' +
          '<p class="small muted">Seus alunos usam este código no primeiro acesso para se vincular a você.</p></section>' +
          '<section class="card"><div class="row-between"><div><p class="eyebrow">Chave PIX</p><p class="strong">' + esc(tr.pixKey || 'Não cadastrada') + '</p></div>' +
          '<button type="button" class="btn btn-secondary btn-sm" data-action="editPix">' + icon('edit', 16) + ' Editar</button></div></section>' +
          '<ul class="menu">' + item('/p/finance', 'wallet', 'Financeiro e recebimentos') + item('/p/finance?tab=assinatura', 'card', 'Assinatura do LIFT') +
          item('/onboarding/1', 'sliders', 'Configurações do negócio') + item('/p/workouts?tab=exercicios', 'dumbbell', 'Biblioteca de exercícios') +
          '<li><button type="button" class="menu-item" data-action="switchProfile">' + icon('swap', 20) + '<span>Trocar de perfil</span>' + icon('chevron-right', 18, 'li-chev') + '</button></li>' +
          '<li><button type="button" class="menu-item menu-danger" data-action="logout">' + icon('logout', 20) + '<span>Sair</span></button></li></ul></main>',
      };
    },
  });
  L.actions.editPix = () => {
    const tr = L.auth.trainer();
    ui.sheet({
      title: 'Chave PIX', sub: 'Usada pelos alunos para pagar você',
      body: '<form class="form" id="pixForm" data-form="pixKey" novalidate>' + ui.field({ name: 'pixKey', label: 'Chave PIX', value: tr.pixKey, placeholder: 'E-mail, CPF, telefone ou chave aleatória' }) + '</form>',
      footer: '<button type="submit" form="pixForm" class="btn btn-primary btn-block">Salvar</button><button type="button" class="btn btn-ghost btn-block" data-action="sheetClose">Cancelar</button>',
    });
  };
  L.forms.pixKey = (f) => {
    const v = L.form.validate(f, [['pixKey', (x) => x && x.length >= 5, 'Informe uma chave PIX válida.']]);
    if (!v) return;
    const tr = L.auth.trainer();
    tr.pixKey = v.pixKey;
    tr.onboarding = tr.onboarding || {};
    tr.onboarding.pixKey = v.pixKey;
    if (tr.onboarding.payments && tr.onboarding.payments.indexOf('pix') < 0) tr.onboarding.payments.push('pix');
    save();
    ui.closeSheet();
    ui.toast('Chave PIX atualizada.');
    L.router.refresh();
  };

  /* ---------- Perfil do aluno ---------- */
  L.route('/a/profile', {
    role: 'student',
    render(ctx) {
      const s = L.auth.student();
      const tr = L.auth.trainer();
      const open = L.billing.urgent(s.id)[0];
      const unread = db().notifications.filter((n) => n.to === s.id && !n.read).length;
      const item = (href, ic, label, extra) => '<li><a class="menu-item" href="#' + href + '">' + icon(ic, 20) + '<span>' + label + '</span>' + (extra || '') + icon('chevron-right', 18, 'li-chev') + '</a></li>';
      const tile = (v, label) => '<div class="stat stat-static"><span class="stat-value">' + v + '</span><span class="stat-label">' + label + '</span></div>';
      return {
        title: 'Perfil', nav: 'student', tab: 'profile',
        html: ui.appBar({ title: 'Meu perfil', right: '<button type="button" class="icon-btn" data-action="editMe" aria-label="Editar meus dados">' + icon('edit') + '</button>' }) +
          '<main class="content"><section class="profile-head">' + ui.avatar(s.name, 'xl') + '<div class="profile-info"><h2 class="profile-name">' + esc(s.name) + '</h2>' +
          '<p class="muted small">' + esc(ctx.session.user.email) + '</p><p class="small">Personal: <strong>' + esc(tr.name) + '</strong></p></div></section>' +
          '<div class="stats-3">' + tile(s.weight ? L.num(s.weight, 1) + '<small>kg</small>' : '—', 'Peso') + tile(s.height ? L.num(s.height, 2) + '<small>m</small>' : '—', 'Altura') + tile(esc(s.goal || '—'), 'Objetivo') + '</div>' +
          '<ul class="menu">' +
          item('/a/anamnese', 'clipboard', 'Anamnese de saúde', s.anamnese ? ui.badge('preenchida') : ui.badge('pendente_doc')) +
          item('/a/habits', 'moon', 'Hábitos e rotina') +
          item('/a/photos', 'camera', 'Fotos de evolução', '<span class="muted small">' + s.photos.length + '</span>') +
          item('/a/history', 'history', 'Histórico de aulas') +
          item('/a/billing', 'wallet', 'Minha assinatura', open ? (open.awaiting ? ui.badge('aguardando', 'Informado') : ui.badge(open.status)) : ui.badge('pago', 'Em dia')) +
          item('/a/notifications', 'bell', 'Notificações', unread ? '<span class="count-badge">' + unread + '</span>' : '') +
          '<li><button type="button" class="menu-item" data-action="switchProfile">' + icon('swap', 20) + '<span>Trocar de perfil</span>' + icon('chevron-right', 18, 'li-chev') + '</button></li>' +
          '<li><button type="button" class="menu-item menu-danger" data-action="logout">' + icon('logout', 20) + '<span>Sair</span></button></li></ul></main>',
      };
    },
  });
  L.actions.editMe = () => {
    const s = L.auth.student();
    ui.sheet({
      title: 'Meus dados',
      body: '<form class="form" id="meForm" data-form="editMe" novalidate>' +
        ui.field({ name: 'phone', label: 'Telefone', type: 'tel', value: s.phone, mask: 'phone', placeholder: '(00) 00000-0000', attrs: 'inputmode="tel"' }) +
        ui.field({ name: 'goal', label: 'Objetivo', value: s.goal, placeholder: 'Ex.: Hipertrofia' }) +
        '<div class="field-row">' + ui.field({ name: 'weight', label: 'Peso (kg)', mask: 'decimal', value: L.fmtDec(s.weight), attrs: 'inputmode="decimal"' }) +
        ui.field({ name: 'height', label: 'Altura (m)', mask: 'decimal', value: L.fmtDec(s.height), placeholder: '1,70', attrs: 'inputmode="decimal"' }) + '</div>' +
        ui.field({ name: 'gym', label: 'Academia onde treina', value: s.gym, placeholder: 'Ex.: Smart Fit – Asa Norte' }) + '</form>',
      footer: '<button type="submit" form="meForm" class="btn btn-primary btn-block">Salvar</button><button type="button" class="btn btn-ghost btn-block" data-action="sheetClose">Cancelar</button>',
    });
  };
  L.forms.editMe = (f) => {
    const v = L.form.validate(f, [
      ['phone', (x) => !x || x.replace(/\D/g, '').length >= 10, 'Informe um telefone com DDD.'],
      ['weight', (x) => !x || (L.parseDec(x) >= 30 && L.parseDec(x) <= 250), 'Informe um peso entre 30 e 250 kg.'],
      ['height', (x) => !x || (L.parseDec(x) >= 1 && L.parseDec(x) <= 2.3), 'Informe a altura em metros (ex.: 1,70).'],
    ]);
    if (!v) return;
    const s = L.auth.student();
    const w = v.weight ? L.parseDec(v.weight) : null;
    if (w && w !== s.weight) s.progress.push({ date: D.todayIso(), weight: w, bodyFat: s.bodyFat });
    Object.assign(s, { phone: v.phone, goal: v.goal, weight: w, height: v.height ? L.parseDec(v.height) : null, gym: v.gym });
    save();
    ui.closeSheet();
    ui.toast('Dados atualizados.');
    L.router.refresh();
  };

  /* ---------- Notificações do aluno ---------- */
  const NI = { class: 'calendar', cancel: 'x-circle', workout: 'dumbbell', charge: 'wallet', payment: 'check-circle', reminder: 'bell', info: 'info' };
  L.route('/a/notifications', {
    role: 'student',
    render() {
      const s = L.auth.student();
      const list = db().notifications.filter((n) => n.to === s.id).sort((a, b) => (a.date < b.date ? 1 : -1));
      const unread = list.filter((n) => !n.read).length;
      return {
        title: 'Notificações', nav: 'student', tab: 'agenda',
        html: ui.appBar({ title: 'Notificações', back: '/a/agenda', right: unread ? '<button type="button" class="icon-btn" data-action="readAll" aria-label="Marcar todas como lidas">' + icon('check') + '</button>' : '' }) +
          '<main class="content">' + (list.length ? '<ul class="list">' + list.map((n) =>
            '<li><button type="button" class="list-item list-link notif' + (n.read ? '' : ' is-unread') + '" data-action="openNotif" data-id="' + n.id + '"><span class="li-icon">' + icon(NI[n.type] || 'bell', 18) + '</span>' +
            '<span class="li-main"><strong>' + esc(n.text) + '</strong><small>' + D.relative(n.date) + (n.read ? '' : ' · nova') + '</small></span>' + (n.read ? '' : '<span class="unread-dot" aria-hidden="true"></span>') + '</button></li>').join('') + '</ul>'
            : ui.empty({ icon: 'bell', title: 'Nenhuma notificação' })) + '</main>',
      };
    },
  });
  L.actions.openNotif = (b) => {
    const n = db().notifications.find((x) => x.id === b.dataset.id);
    if (!n) return;
    n.read = true;
    save();
    L.router.go(n.link || '/a/agenda');
  };
  L.actions.readAll = () => {
    const s = L.auth.student();
    db().notifications.forEach((n) => { if (n.to === s.id) n.read = true; });
    save();
    ui.toast('Todas as notificações foram marcadas como lidas.', 'info');
    L.router.refresh();
  };
})();
