/* LIFT – RF05 · Cobranças (Telas 35 a 42) */
(function () {
  'use strict';
  const L = window.LIFT, ui = L.ui, esc = L.esc, D = L.d;
  const icon = (n, s, c) => L.icon(n, s, c);
  const db = () => L.store.db;
  const save = () => L.store.save();
  const student = (id) => db().students.find((s) => s.id === id) || null;
  const METHOD = { pix: 'PIX', cartao: 'Cartão de crédito', dinheiro: 'Dinheiro', transferencia: 'Transferência', outro: 'Outro' };
  const BILLING = { mensal: 'Mensalidade', aula: 'Por aula', pacote: 'Pacote de aulas' };
  L.METHOD = METHOD;

  /* ---------- Processos do sistema ---------- */
  L.billing = {
    /* “Venceu sem pagamento?” → Pendente vira Atrasado */
    refresh() {
      const t = D.todayIso();
      let changed = false;
      db().charges.forEach((c) => {
        if (c.status === 'pago') return;
        const st = c.due < t ? 'atrasado' : 'pendente';
        if (c.status !== st) { c.status = st; changed = true; }
      });
      if (changed) save();
    },
    cycle() { return D.todayIso().slice(0, 7); },
    monthName(key) { const m = Number(key.split('-')[1]); return D.cap(D.MONTHS[m - 1]); },
    missing(tr) {
      const key = L.billing.cycle();
      return db().students.filter((s) => s.trainerId === tr.id && s.status === 'ativo' && !db().charges.some((c) => c.studentId === s.id && c.cycle === key));
    },
    urgent(sid) {
      const rank = { atrasado: 0, pendente: 1 };
      return db().charges.filter((c) => c.studentId === sid && c.status !== 'pago').sort((a, b) => rank[a.status] - rank[b.status] || (a.due < b.due ? -1 : 1));
    },
    accepted(tr) { return ((tr.onboarding && tr.onboarding.payments) || ['pix']).slice(); },
    nextDue(c) { const d = D.parse(c.due); return D.iso(new Date(d.getFullYear(), d.getMonth() + 1, 10)); },
    create(tr, s, desc, amount, due) {
      const c = {
        id: L.uid('ch'), trainerId: tr.id, studentId: s.id, desc, amount, due, cycle: due.slice(0, 7), status: due < D.todayIso() ? 'atrasado' : 'pendente',
        paidAt: null, method: null, awaiting: false, informedAt: null, lastReminder: null, createdAt: D.todayIso(),
      };
      db().charges.push(c);
      L.notify(s.id, 'charge', 'Cobrança disponível: ' + desc + ' · ' + L.money(amount) + ', vence em ' + D.short(due) + '.', '/a/pay/' + c.id);
      return c;
    },
  };

  /* ---------- Telas 35 e 36 · Recebimentos (com filtros) ---------- */
  function chargeItem(c) {
    const s = student(c.studentId);
    return '<li><a class="list-item list-link" href="#/p/charges/' + c.id + '">' + ui.avatar(s ? s.name : '?', 'sm') +
      '<span class="li-main"><strong>' + esc(s ? s.name : 'Aluno') + '</strong><small>' + esc(c.desc) + ' · ' + (c.status === 'pago' ? 'Pago em ' + D.short(c.paidAt) : 'Venc. ' + D.short(c.due)) + '</small></span>' +
      '<span class="li-end li-end-col"><strong class="amount">' + L.money(c.amount) + '</strong>' + (c.awaiting && c.status !== 'pago' ? ui.badge('aguardando', 'Confirmar') : ui.badge(c.status)) + '</span></a></li>';
  }
  L.route('/p/finance', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const tab = ctx.query.tab === 'assinatura' ? 'assinatura' : 'recebimentos';
      const head = ui.appBar({ title: tab === 'assinatura' ? 'Meus Pagamentos' : 'Financeiro', back: '/p/home' }) +
        '<main class="content">' + ui.segLinks([{ key: 'recebimentos', label: 'Recebimentos', href: '/p/finance' }, { key: 'assinatura', label: 'Assinatura LIFT', href: '/p/finance?tab=assinatura' }], tab);
      if (tab === 'assinatura') return { title: 'Meus Pagamentos', nav: 'personal', tab: 'home', html: head + L.views.subscription(tr) + '</main>' };

      L.billing.refresh();
      if (ctx.query.filter) ui.state.finFilter = ctx.query.filter;
      const f = ['todos', 'pendente', 'atrasado', 'pago'].indexOf(ui.state.finFilter) >= 0 ? ui.state.finFilter : 'todos';
      const all = db().charges.filter((c) => c.trainerId === tr.id);
      const month = L.billing.cycle();
      const pend = all.filter((c) => c.status === 'pendente');
      const late = all.filter((c) => c.status === 'atrasado');
      const sum = (l) => l.reduce((a, c) => a + c.amount, 0);
      const received = sum(all.filter((c) => c.status === 'pago' && c.paidAt && c.paidAt.slice(0, 7) === month));
      const monthAll = all.filter((c) => c.cycle === month);
      const mt = sum(monthAll) || 1;
      const pp = (sum(monthAll.filter((c) => c.status === 'pago')) / mt) * 100;
      const pw = (sum(monthAll.filter((c) => c.status === 'pendente')) / mt) * 100;
      const pl = (sum(monthAll.filter((c) => c.status === 'atrasado')) / mt) * 100;
      const order = { atrasado: 0, pendente: 1, pago: 2 };
      const list = all.filter((c) => f === 'todos' || c.status === f).sort((a, b) => order[a.status] - order[b.status] || (a.status === 'pago' ? (a.paidAt < b.paidAt ? 1 : -1) : a.due < b.due ? -1 : 1));
      const missing = L.billing.missing(tr);
      return {
        title: 'Financeiro', nav: 'personal', tab: 'home',
        html: head +
          '<section class="card card-summary"><p class="eyebrow">A receber</p><p class="summary-value">' + L.money(sum(pend) + sum(late)) + '</p>' +
          '<div class="summary-split"><div><span class="eyebrow-sm"><i class="dot dot-success"></i>Recebido no mês</span><strong>' + L.money(received) + '</strong></div>' +
          '<div><span class="eyebrow-sm"><i class="dot dot-warning"></i>Pendente</span><strong>' + L.money(sum(pend)) + '</strong></div>' +
          '<div><span class="eyebrow-sm"><i class="dot dot-danger"></i>Atrasado</span><strong>' + L.money(sum(late)) + '</strong></div></div>' +
          '<div class="stack-bar" role="img" aria-label="Recebimento de ' + L.billing.monthName(month) + ': ' + Math.round(pp) + '% pago, ' + Math.round(pw) + '% pendente, ' + Math.round(pl) + '% atrasado"><span class="seg-success" style="width:' + pp + '%"></span><span class="seg-warning" style="width:' + pw + '%"></span><span class="seg-danger" style="width:' + pl + '%"></span></div>' +
          '<p class="small muted">Taxa de recebimento de ' + L.billing.monthName(month).toLowerCase() + ': ' + Math.round(pp) + '%</p></section>' +
          (missing.length ? '<div class="card card-cycle"><div><strong>Ciclo de ' + L.billing.monthName(month).toLowerCase() + '</strong><small>' + missing.length + (missing.length > 1 ? ' alunos ativos ainda sem cobrança' : ' aluno ativo ainda sem cobrança') + '</small></div><button type="button" class="btn btn-secondary btn-sm" data-action="generateCycle">Gerar cobranças</button></div>' : '') +
          '<div class="section-head"><h2 class="section-title">Cobranças</h2><button type="button" class="link link-sm" data-action="newCharge">' + icon('plus', 16) + ' Nova cobrança</button></div>' +
          ui.chips([
            { key: 'todos', label: 'Todos', count: all.length }, { key: 'pendente', label: 'Pendentes', count: pend.length },
            { key: 'atrasado', label: 'Atrasados', count: late.length }, { key: 'pago', label: 'Pagos', count: all.filter((c) => c.status === 'pago').length },
          ], f, 'finFilter') +
          (f === 'atrasado' ? '<div class="alert alert-info">' + icon('info', 18) + '<span>Ao vencer sem pagamento, a cobrança passa automaticamente de Pendente para Atrasado.</span></div>' : '') +
          (list.length ? '<ul class="list">' + list.map(chargeItem).join('') + '</ul>' : ui.empty({ icon: 'check-circle', title: f === 'atrasado' ? 'Nenhuma cobrança em atraso' : 'Nada por aqui', text: f === 'atrasado' ? 'Todos os alunos estão em dia.' : '' })) +
          '</main>',
      };
    },
  });
  L.actions.finFilter = (b) => { ui.state.finFilter = b.dataset.key; L.router.replace('/p/finance'); };
  L.actions.generateCycle = async () => {
    const tr = L.auth.trainer();
    const miss = L.billing.missing(tr);
    if (!miss.length) return;
    await ui.busy('Gerando cobranças do ciclo…', 900);
    const key = L.billing.cycle();
    const today = D.todayIso();
    const due10 = key + '-10';
    const due = due10 >= today ? due10 : D.addIso(today, 5);
    miss.forEach((s) => L.billing.create(tr, s, 'Mensalidade · ' + L.billing.monthName(key), s.monthly || (tr.onboarding && tr.onboarding.base) || 0, due));
    save();
    ui.toast(miss.length + (miss.length > 1 ? ' cobranças geradas' : ' cobrança gerada') + ' e enviadas aos alunos.');
    L.router.refresh();
  };
  L.actions.newCharge = () => {
    const tr = L.auth.trainer();
    const studs = db().students.filter((s) => s.trainerId === tr.id && s.status === 'ativo').sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    ui.sheet({
      title: 'Nova cobrança',
      body: '<form class="form" id="newChargeForm" data-form="newCharge" novalidate>' +
        ui.field({ name: 'studentId', label: 'Aluno', type: 'select', value: '', options: [{ value: '', label: 'Selecione o aluno' }].concat(studs.map((s) => ({ value: s.id, label: s.name }))), attrs: 'data-change="ncAmount"' }) +
        ui.field({ name: 'desc', label: 'Descrição', value: 'Mensalidade · ' + L.billing.monthName(L.billing.cycle()) }) +
        '<div class="field-row">' + ui.field({ name: 'amount', label: 'Valor', prefix: 'R$', mask: 'money', value: L.fmtMoneyInput(tr.onboarding && tr.onboarding.base), attrs: 'inputmode="numeric"' }) +
        ui.field({ name: 'due', label: 'Vencimento', type: 'date', value: D.addIso(D.todayIso(), 5) }) + '</div></form>',
      footer: '<button type="submit" form="newChargeForm" class="btn btn-primary btn-block">Criar e enviar ao aluno</button><button type="button" class="btn btn-ghost btn-block" data-action="sheetClose">Cancelar</button>',
    });
  };
  L.changes.ncAmount = (sel) => {
    const s = student(sel.value);
    if (s && s.monthly) sel.form.querySelector('[name=amount]').value = L.fmtMoneyInput(s.monthly);
  };
  L.forms.newCharge = (f) => {
    const v = L.form.validate(f, [
      ['studentId', (x) => !!x, 'Selecione o aluno.'],
      ['desc', (x) => x && x.length >= 3, 'Descreva a cobrança.'],
      ['amount', (x) => L.parseMoney(x) >= 1, 'Informe um valor maior que zero.'],
      ['due', (x) => /^\d{4}-\d{2}-\d{2}$/.test(x || ''), 'Informe o vencimento.'],
    ]);
    if (!v) return;
    const s = student(v.studentId);
    L.billing.create(L.auth.trainer(), s, v.desc, L.parseMoney(v.amount), v.due);
    save();
    ui.closeSheet();
    ui.toast('Cobrança criada e enviada para ' + L.first(s.name) + '.');
    L.router.refresh();
  };

  /* ---------- Tela 37 · Detalhe da cobrança ---------- */
  L.route('/p/charges/:id', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      L.billing.refresh();
      const c = db().charges.find((x) => x.id === ctx.params.id && x.trainerId === tr.id);
      if (!c) { L.router.replace('/p/finance'); return null; }
      const s = student(c.studentId);
      const late = c.status === 'atrasado' ? D.diff(D.todayIso(), c.due) : 0;
      const hist = db().charges.filter((x) => x.studentId === c.studentId && x.id !== c.id).sort((a, b) => (a.due < b.due ? 1 : -1));
      return {
        title: 'Detalhe da cobrança', nav: 'personal', tab: 'home',
        html: ui.appBar({ title: 'Detalhe da cobrança', back: '/p/finance' }) +
          '<main class="content"><section class="profile-head">' + ui.avatar(s.name, 'lg') + '<div class="profile-info"><a class="profile-name link-plain" href="#/p/students/' + s.id + '">' + esc(s.name) + '</a><p class="muted small">' + esc(c.desc) + '</p></div></section>' +
          '<section class="card card-value is-' + c.status + '"><p class="eyebrow">Valor</p><div class="row-between"><p class="value-big">' + L.money(c.amount) + '</p>' + (c.awaiting && c.status !== 'pago' ? ui.badge('aguardando') : ui.badge(c.status)) + '</div></section>' +
          (c.awaiting && c.status !== 'pago' ? '<div class="alert alert-info">' + icon('info', 18) + '<span>' + esc(L.first(s.name)) + ' informou que pagou via PIX em ' + D.fmt(c.informedAt.slice(0, 10)) + ' às ' + c.informedAt.slice(11, 16) + '. Confira o recebimento na sua conta antes de confirmar.</span></div>' : '') +
          '<div class="kv-list kv-card">' + ui.kv('Vencimento', D.fmt(c.due)) + ui.kv('Formas aceitas', L.billing.accepted(tr).map((m) => METHOD[m]).join(' / ')) +
          (c.status === 'atrasado' ? ui.kv('Dias em atraso', '<span class="text-danger">' + late + '</span>') : '') +
          (c.status === 'pago' ? ui.kv('Pago em', D.fmt(c.paidAt)) + ui.kv('Forma', METHOD[c.method] || '—') : '') +
          (c.lastReminder ? ui.kv('Último lembrete', D.fmt(c.lastReminder)) : '') + '</div>' +
          (c.status !== 'pago'
            ? '<div class="btn-stack"><button type="button" class="btn btn-primary btn-block btn-lg" data-action="chargeConfirm" data-id="' + c.id + '">' + icon('check', 18) + ' Marcar como pago</button>' +
              '<button type="button" class="btn btn-secondary btn-block" data-action="chargeRemind" data-id="' + c.id + '">' + icon('bell', 18) + ' Enviar lembrete</button></div>'
            : '<div class="alert alert-success">' + icon('check-circle', 18) + '<span>Pagamento recebido em ' + D.fmt(c.paidAt) + ' via ' + (METHOD[c.method] || '—') + (c.confirmedBy === 'stripe' ? ' (confirmado automaticamente pelo Stripe)' : '') + '.</span></div>') +
          '<p class="center"><a class="link" href="#/p/chat/' + s.id + '">' + icon('message', 16) + ' Abrir chat com o aluno</a></p>' +
          (hist.length ? '<h3 class="section-title">Histórico de ' + esc(L.first(s.name)) + '</h3><ul class="list">' + hist.map(chargeItem).join('') + '</ul>' : '') + '</main>',
        after() { if (ctx.query.confirm === '1' && c.status !== 'pago') setTimeout(() => L.actions.chargeConfirm({ dataset: { id: c.id } }), 150); },
      };
    },
  });

  /* ---------- Tela 38 · Confirmar recebimento (PIX ou dinheiro) ---------- */
  L.actions.chargeConfirm = (b) => {
    const c = db().charges.find((x) => x.id === b.dataset.id);
    const s = student(c.studentId);
    const def = c.awaiting ? 'pix' : 'pix';
    const chip = (v) => '<label class="chip-radio"><input type="radio" name="method" value="' + v + '"' + (v === def ? ' checked' : '') + '><span>' + METHOD[v] + '</span></label>';
    ui.sheet({
      title: 'Confirmar recebimento', sub: L.money(c.amount) + ' · ' + s.name, focusFirst: false,
      body: '<form class="form" id="confirmPayForm" data-form="confirmPay" data-id="' + c.id + '" novalidate>' +
        '<fieldset><legend class="label">Recebido via</legend><div class="chip-radios">' + ['pix', 'dinheiro', 'transferencia', 'outro'].map(chip).join('') + '</div></fieldset>' +
        ui.field({ name: 'date', label: 'Data do recebimento', type: 'date', value: D.todayIso(), attrs: 'max="' + D.todayIso() + '"' }) +
        '<p class="help">Pagamentos com cartão são confirmados automaticamente pelo Stripe.</p></form>',
      footer: '<button type="submit" form="confirmPayForm" class="btn btn-primary btn-block">Confirmar</button><button type="button" class="btn btn-ghost btn-block" data-action="sheetClose">Voltar</button>',
    });
  };
  L.forms.confirmPay = (f) => {
    const v = L.form.validate(f, [['date', (x) => !!x && x <= D.todayIso(), 'Informe uma data até hoje.']]);
    if (!v) return;
    const c = db().charges.find((x) => x.id === f.dataset.id);
    const s = student(c.studentId);
    Object.assign(c, { status: 'pago', paidAt: v.date, method: v.method || 'pix', awaiting: false, confirmedBy: 'personal' });
    L.notify(s.id, 'payment', 'Pagamento de ' + c.desc + ' confirmado. Obrigado!', '/a/billing');
    save();
    ui.closeSheet();
    ui.toast('Recebimento confirmado. ' + L.first(s.name) + ' foi avisado(a).');
    L.router.refresh();
  };
  L.actions.chargeRemind = (b) => {
    const c = db().charges.find((x) => x.id === b.dataset.id);
    const s = student(c.studentId);
    const today = D.todayIso();
    if (c.lastReminder === today) { ui.toast('Você já enviou um lembrete hoje para ' + L.first(s.name) + '.', 'info'); return; }
    L.notify(s.id, 'reminder', 'Lembrete: ' + c.desc + (c.status === 'atrasado' ? ' está em atraso' : ' vence em ' + D.short(c.due)) + '. Valor: ' + L.money(c.amount) + '.', '/a/pay/' + c.id);
    c.lastReminder = today;
    save();
    ui.toast('Lembrete enviado para ' + L.first(s.name) + '.');
    L.router.refresh();
  };

  /* ======================= Área do Aluno ======================= */
  const myCharge = (id) => { const s = L.auth.student(); return db().charges.find((c) => c.id === id && c.studentId === s.id) || null; };

  /* ---------- Tela 39 · Minha Assinatura ---------- */
  L.route('/a/billing', {
    role: 'student',
    render() {
      const s = L.auth.student();
      const tr = L.auth.trainer();
      L.billing.refresh();
      const all = db().charges.filter((c) => c.studentId === s.id);
      const open = L.billing.urgent(s.id);
      const cur = open[0] || all.slice().sort((a, b) => (a.due < b.due ? 1 : -1))[0];
      const paid = all.filter((c) => c.status === 'pago').sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
      const badge = cur ? (cur.status === 'pago' ? ui.badge('pago', 'Em dia') : cur.awaiting ? ui.badge('aguardando') : ui.badge(cur.status)) : ui.badge('pago', 'Em dia');
      return {
        title: 'Minha Assinatura', nav: 'student', tab: 'profile',
        html: ui.appBar({ title: 'Minha Assinatura', back: '/a/profile' }) + '<main class="content">' +
          '<section class="card card-plan"><div class="row-between"><p class="eyebrow">Plano com o personal</p>' + badge + '</div>' +
          '<h2 class="plan-current">' + (BILLING[tr.onboarding && tr.onboarding.billing] || 'Mensalidade') + '</h2><p class="plan-current-price">' + L.money(cur ? cur.amount : s.monthly) + '</p>' +
          '<div class="kv-list">' + (cur ? ui.kv(cur.status === 'pago' ? 'Próximo vencimento' : 'Vencimento', D.fmt(cur.status === 'pago' ? L.billing.nextDue(cur) : cur.due)) : '') + ui.kv('Personal', esc(tr.name)) + '</div></section>' +
          (open.length && open[0].awaiting ? '<div class="alert alert-info">' + icon('clock', 18) + '<span>Pagamento informado em ' + D.fmt(open[0].informedAt.slice(0, 10)) + '. Aguardando a confirmação de ' + esc(L.first(tr.name)) + '.</span></div>' : '') +
          (open.length && !open[0].awaiting ? '<a class="btn btn-primary btn-block btn-lg" href="#/a/pay/' + open[0].id + '">Renovar / pagar</a>' : '') +
          (open.length > 1 ? '<h3 class="section-title">Em aberto</h3><ul class="list">' + open.map((c) => '<li><a class="list-item list-link" href="#/a/pay/' + c.id + '"><span class="li-icon">' + icon('wallet', 18) + '</span><span class="li-main"><strong>' + esc(c.desc) + '</strong><small>Vence ' + D.short(c.due) + '</small></span><span class="li-end li-end-col"><strong class="amount">' + L.money(c.amount) + '</strong>' + (c.awaiting ? ui.badge('aguardando', 'Informado') : ui.badge(c.status)) + '</span></a></li>').join('') + '</ul>' : '') +
          '<h3 class="section-title">Histórico</h3>' +
          (paid.length ? '<ul class="list">' + paid.map((c) => '<li class="list-item"><span class="li-icon li-icon-success">' + icon('check', 16) + '</span><span class="li-main"><strong>' + esc(c.desc) + '</strong><small>' + D.fmt(c.paidAt) + ' · ' + (METHOD[c.method] || '—') + '</small></span><span class="li-end li-end-col"><strong class="amount">' + L.money(c.amount) + '</strong>' + ui.badge('pago') + '</span></li>').join('') + '</ul>'
            : ui.empty({ icon: 'history', title: 'Nenhum pagamento ainda' })) + '</main>',
      };
    },
  });

  /* ---------- Tela 40 · Forma de pagamento ---------- */
  L.route('/a/pay/:id', {
    role: 'student',
    render(ctx) {
      const c = myCharge(ctx.params.id);
      if (!c) { L.router.replace('/a/billing'); return null; }
      if (c.status === 'pago' || c.awaiting) { L.router.replace('/a/pay/' + c.id + '/done'); return null; }
      const tr = L.auth.trainer();
      const acc = L.billing.accepted(tr);
      const online = acc.filter((m) => m === 'pix' || m === 'cartao');
      const offline = acc.filter((m) => m === 'dinheiro' || m === 'transferencia');
      const opt = (v, t, sub) => '<label class="option-card"><input type="radio" name="method" value="' + v + '"' + (online[0] === v ? ' checked' : '') + '><span class="option-radio" aria-hidden="true"></span><span class="option-text"><strong>' + t + '</strong><small>' + sub + '</small></span>' + icon(v === 'pix' ? 'qr' : 'card', 22, 'option-icon') + '</label>';
      return {
        title: 'Forma de pagamento',
        html: ui.appBar({ title: 'Forma de pagamento', back: '/a/billing' }) + '<main class="content">' +
          '<div class="summary-box summary-box-lg"><div><small>Total a pagar</small><strong class="summary-total">' + L.money(c.amount) + '</strong><small>' + esc(c.desc) + ' · vence ' + D.short(c.due) + '</small></div>' + ui.badge(c.status) + '</div>' +
          '<form class="form" data-form="payMethod" data-id="' + c.id + '" novalidate><fieldset><legend class="label">Escolha como pagar</legend><div class="option-list">' +
          (online.indexOf('pix') >= 0 ? opt('pix', 'PIX', 'Chave PIX do seu personal') : '') +
          (online.indexOf('cartao') >= 0 ? opt('cartao', 'Cartão de crédito', 'Pagamento online via Stripe') : '') + '</div>' + ui.errSlot('method') + '</fieldset>' +
          (offline.length ? '<div class="alert alert-info">' + icon('info', 18) + '<span>' + esc(L.first(tr.name)) + ' também aceita ' + offline.map((m) => METHOD[m].toLowerCase()).join(' e ') + '. Combine diretamente pelo chat.</span></div>' : '') +
          (!online.length ? '<div class="alert alert-warning">' + icon('alert', 18) + '<span>Seu personal não aceita pagamentos pelo app. Combine o pagamento pelo chat.</span></div>' : '') +
          '<div class="sticky-actions"><button type="submit" class="btn btn-primary btn-block btn-lg"' + (online.length ? '' : ' disabled') + '>Continuar</button></div></form></main>',
      };
    },
  });
  L.forms.payMethod = (f) => {
    const v = L.form.validate(f, [['method', (x) => !!x, 'Escolha uma forma de pagamento.']]);
    if (!v) return;
    L.router.go('/a/pay/' + f.dataset.id + '/' + (v.method === 'pix' ? 'pix' : 'card'));
  };

  /* ---------- Tela 41 · Pagamento via PIX ---------- */
  L.route('/a/pay/:id/pix', {
    role: 'student',
    render(ctx) {
      const c = myCharge(ctx.params.id);
      if (!c) { L.router.replace('/a/billing'); return null; }
      if (c.status === 'pago' || c.awaiting) { L.router.replace('/a/pay/' + c.id + '/done'); return null; }
      const tr = L.auth.trainer();
      const key = tr.pixKey || (tr.onboarding && tr.onboarding.pixKey) || '';
      return {
        title: 'Pagamento via PIX',
        html: ui.appBar({ title: 'Pagamento via PIX', back: '/a/pay/' + c.id }) + '<main class="content"><p class="center strong">Pague com a chave PIX do professor</p>' +
          '<div class="qr-wrap">' + ui.qr(c.id + key) + '</div>' +
          '<p class="label">Chave PIX</p><div class="copy-field"><span class="copy-value">' + esc(key) + '</span><button type="button" class="btn btn-primary btn-sm" data-action="copy" data-text="' + esc(key) + '" data-msg="Chave PIX copiada!">' + icon('copy', 16) + ' Copiar</button></div>' +
          '<div class="kv-list kv-card">' + ui.kv('Valor', L.money(c.amount)) + ui.kv('Favorecido', esc(tr.name)) + ui.kv('Referente a', esc(c.desc)) + '</div>' +
          '<div class="sticky-actions"><button type="button" class="btn btn-primary btn-block btn-lg" data-action="pixPaid" data-id="' + c.id + '">Já paguei</button>' +
          '<p class="help center">O status muda para Pago quando o personal confirmar o recebimento.</p></div></main>',
      };
    },
  });
  L.actions.pixPaid = async (b) => {
    const c = myCharge(b.dataset.id);
    const tr = L.auth.trainer();
    const s = L.auth.student();
    const ok = await ui.confirm({ title: 'Você já fez o PIX?', text: 'Vamos avisar ' + L.first(tr.name) + ' que você pagou ' + L.money(c.amount) + '. Ele(a) confirma o recebimento em seguida.', ok: 'Sim, já paguei', cancel: 'Ainda não' });
    if (!ok) return;
    await ui.busy('Avisando seu personal…', 700);
    Object.assign(c, { awaiting: true, informedAt: D.stamp(), informedMethod: 'pix' });
    db().messages.push({ id: L.uid('m'), trainerId: tr.id, studentId: s.id, from: 'student', text: 'Olá! Fiz o PIX de ' + L.money(c.amount) + ' referente a ' + c.desc + '.', at: D.stamp(), readT: false, readS: true });
    save();
    L.router.go('/a/pay/' + c.id + '/done');
  };

  /* ---------- Pagamento com cartão (Stripe simulado) ---------- */
  L.route('/a/pay/:id/card', {
    role: 'student',
    render(ctx) {
      const c = myCharge(ctx.params.id);
      if (!c) { L.router.replace('/a/billing'); return null; }
      if (c.status === 'pago' || c.awaiting) { L.router.replace('/a/pay/' + c.id + '/done'); return null; }
      return {
        title: 'Pagamento com cartão',
        html: ui.appBar({ title: 'Pagamento com cartão', back: '/a/pay/' + c.id }) + '<main class="content">' +
          '<div class="summary-box">' + icon('card', 20) + '<div><strong>' + esc(c.desc) + '</strong><small>Total: ' + L.money(c.amount) + '</small></div></div>' +
          '<form class="form" data-form="payCard" data-id="' + c.id + '" novalidate><div class="form-alert" hidden></div>' + L.cardFields() +
          '<div class="sticky-actions"><button type="submit" class="btn btn-primary btn-block btn-lg">Pagar ' + L.money(c.amount) + '</button></div></form></main>',
      };
    },
  });
  L.forms.payCard = async (f) => {
    const v = L.cardValidate(f);
    if (!v) return;
    await ui.busy('Processando pagamento…', 1300);
    const digits = v.number.replace(/\D/g, '');
    if (L.DECLINED_CARDS.indexOf(digits) >= 0) {
      L.form.alert(f, 'Pagamento recusado pela operadora. Verifique os dados ou use outro cartão.');
      L.form.error(f, 'number', '');
      return;
    }
    const c = myCharge(f.dataset.id);
    Object.assign(c, { status: 'pago', paidAt: D.todayIso(), method: 'cartao', awaiting: false, confirmedBy: 'stripe', cardLast4: digits.slice(-4) });
    save();
    L.router.go('/a/pay/' + c.id + '/done');
  };

  /* ---------- Tela 42 · Pagamento confirmado / informado ---------- */
  L.route('/a/pay/:id/done', {
    role: 'student',
    render(ctx) {
      const c = myCharge(ctx.params.id);
      if (!c) { L.router.replace('/a/billing'); return null; }
      if (c.status !== 'pago' && !c.awaiting) { L.router.replace('/a/pay/' + c.id); return null; }
      const tr = L.auth.trainer();
      const paid = c.status === 'pago';
      return {
        title: paid ? 'Pagamento confirmado' : 'Pagamento informado',
        html: ui.appBar({ title: 'Pagamento', back: '/a/billing' }) + '<main class="content"><div class="result">' +
          '<div class="result-icon ' + (paid ? 'is-success' : 'is-info') + '">' + icon(paid ? 'check' : 'clock', 40) + '</div>' +
          '<h2 class="h2">' + (paid ? 'Pagamento confirmado' : 'Pagamento informado') + '</h2>' +
          '<p class="muted">' + (paid ? 'Sua assinatura está ativa.' : esc(L.first(tr.name)) + ' vai confirmar o recebimento. O status muda para Pago após a confirmação.') + '</p></div>' +
          '<div class="kv-list kv-card">' + ui.kv('Valor', L.money(c.amount)) + ui.kv('Forma', paid ? (METHOD[c.method] || '—') + (c.cardLast4 ? ' •••• ' + c.cardLast4 : '') : 'PIX') +
          (paid ? ui.kv('Próximo vencimento', D.fmt(L.billing.nextDue(c))) : ui.kv('Informado em', D.fmt(c.informedAt.slice(0, 10)) + ' às ' + c.informedAt.slice(11, 16))) + '</div>' +
          '<div class="btn-stack"><a class="btn btn-primary btn-block btn-lg" href="#/a/billing">Ver minha assinatura</a><a class="btn btn-ghost btn-block" href="#/a/agenda">Voltar à agenda</a></div></main>',
      };
    },
  });
})();
