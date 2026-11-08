/* LIFT – RF04 · Agenda (Telas 28 a 34) */
(function () {
  'use strict';
  const L = window.LIFT, ui = L.ui, esc = L.esc, D = L.d;
  const icon = (n, s, c) => L.icon(n, s, c);
  const db = () => L.store.db;
  const save = () => L.store.save();
  const student = (id) => db().students.find((s) => s.id === id) || null;
  const workout = (id) => db().workouts.find((w) => w.id === id) || null;
  const DOT = { agendada: 'primary', concluida: 'success', cancelada: 'muted' };

  L.views.classItem = function (c, o) {
    o = o || {};
    const s = student(c.studentId);
    const w = workout(c.workoutId);
    const title = o.forStudent ? (w ? w.name : 'Aula com o personal') : (s ? s.name : 'Aluno');
    return '<li><a class="list-item list-link class-item is-' + c.status + '" href="#' + o.href + '">' +
      '<span class="time-block"><strong>' + c.start + '</strong><small>' + c.end + '</small></span>' +
      (o.forStudent ? '' : ui.avatar(s ? s.name : '?', 'sm')) +
      '<span class="li-main"><strong>' + esc(title) + '</strong><small>' + (o.showDate ? D.relative(c.date) + ' · ' : '') + esc(c.location) + '</small></span>' +
      '<span class="li-end">' + ui.badge(c.status) + '</span></a></li>';
  };

  function cal() {
    if (!ui.state.cal) { const t = D.todayIso(); ui.state.cal = { month: t.slice(0, 7), sel: t, view: 'mes' }; }
    return ui.state.cal;
  }
  const dots = (list) => list.slice(0, 3).map((c) => '<i class="dot dot-' + DOT[c.status] + '"></i>').join('');

  function monthGrid(tr, c) {
    const [y, m] = c.month.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const days = new Date(y, m, 0).getDate();
    const today = D.todayIso();
    const cls = db().classes.filter((x) => x.trainerId === tr.id && x.date.slice(0, 7) === c.month);
    let cells = '';
    for (let i = 0; i < first.getDay(); i++) cells += '<span class="cal-blank" aria-hidden="true"></span>';
    for (let d = 1; d <= days; d++) {
      const iso = c.month + '-' + String(d).padStart(2, '0');
      const list = cls.filter((x) => x.date === iso).sort(L.byDateTime);
      const act = list.filter((x) => x.status !== 'cancelada').length;
      cells += '<button type="button" class="cal-day' + (iso === c.sel ? ' is-selected' : '') + (iso === today ? ' is-today' : '') + '" data-action="calSelect" data-date="' + iso + '" aria-pressed="' + (iso === c.sel) + '" aria-label="' + D.long(iso) + (act ? ', ' + act + (act > 1 ? ' aulas' : ' aula') : ', sem aulas') + '"><span>' + d + '</span><span class="cal-dots">' + dots(list) + '</span></button>';
    }
    return '<div class="cal"><div class="cal-head"><button type="button" class="icon-btn" data-action="calNav" data-dir="-1" aria-label="Mês anterior">' + icon('chevron-left') + '</button>' +
      '<h2 class="cal-title" aria-live="polite">' + D.monthLabel(y, m - 1) + '</h2><button type="button" class="icon-btn" data-action="calNav" data-dir="1" aria-label="Próximo mês">' + icon('chevron-right') + '</button></div>' +
      '<div class="cal-grid"><div class="cal-wd" aria-hidden="true">' + D.WD1.map((w) => '<span>' + w + '</span>').join('') + '</div><div class="cal-days">' + cells + '</div></div></div>';
  }
  function weekStrip(list, sel, action, navAction) {
    const sd = D.parse(sel);
    const start = D.add(sd, -sd.getDay());
    const end = D.add(start, 6);
    const today = D.todayIso();
    let html = '<div class="week"><div class="cal-head"><button type="button" class="icon-btn" data-action="' + navAction + '" data-dir="-1" aria-label="Semana anterior">' + icon('chevron-left') + '</button>' +
      '<h2 class="cal-title" aria-live="polite">' + start.getDate() + ' ' + D.MS[start.getMonth()] + ' – ' + end.getDate() + ' ' + D.MS[end.getMonth()] + '</h2>' +
      '<button type="button" class="icon-btn" data-action="' + navAction + '" data-dir="1" aria-label="Próxima semana">' + icon('chevron-right') + '</button></div><div class="week-days">';
    for (let i = 0; i < 7; i++) {
      const iso = D.iso(D.add(start, i));
      const items = list.filter((x) => x.date === iso).sort(L.byDateTime);
      html += '<button type="button" class="week-day' + (iso === sel ? ' is-selected' : '') + (iso === today ? ' is-today' : '') + '" data-action="' + action + '" data-date="' + iso + '" aria-pressed="' + (iso === sel) + '" aria-label="' + D.long(iso) + (items.length ? ', ' + items.length + (items.length > 1 ? ' aulas' : ' aula') : '') + '">' +
        '<small>' + D.WDS[i].charAt(0) + '</small><strong>' + D.parse(iso).getDate() + '</strong><span class="cal-dots">' + dots(items) + '</span></button>';
    }
    return html + '</div></div>';
  }

  /* ---------- Tela 28 · Calendário do personal ---------- */
  L.route('/p/schedule', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const c = cal();
      if (ctx.query.date && /^\d{4}-\d{2}-\d{2}$/.test(ctx.query.date)) { c.sel = ctx.query.date; c.month = c.sel.slice(0, 7); }
      const all = db().classes.filter((x) => x.trainerId === tr.id);
      const day = all.filter((x) => x.date === c.sel).sort(L.byDateTime);
      const act = day.filter((x) => x.status !== 'cancelada').length;
      return {
        title: 'Agenda', nav: 'personal', tab: 'schedule',
        html: ui.appBar({ title: 'Agenda', right: '<a class="icon-btn" href="#/p/schedule/new?date=' + c.sel + '" aria-label="Agendar aula">' + icon('plus') + '</a>' }) +
          '<main class="content has-fab">' + ui.segButtons([{ key: 'mes', label: 'Mês' }, { key: 'semana', label: 'Semana' }], c.view, 'calView') +
          (c.view === 'mes' ? monthGrid(tr, c) : weekStrip(all, c.sel, 'calSelect', 'calWeek')) +
          '<div class="legend" aria-hidden="true"><span><i class="dot dot-primary"></i>Agendada</span><span><i class="dot dot-success"></i>Concluída</span><span><i class="dot dot-muted"></i>Cancelada</span></div>' +
          '<div class="section-head"><h2 class="section-title">' + D.cap(D.long(c.sel)) + '</h2><span class="small muted">' + act + (act === 1 ? ' aula' : ' aulas') + '</span></div>' +
          (day.length ? '<ul class="list">' + day.map((x) => L.views.classItem(x, { href: '/p/classes/' + x.id })).join('') + '</ul>'
            : ui.empty({ icon: 'calendar', title: 'Nenhuma aula neste dia', action: '<a class="btn btn-secondary btn-sm" href="#/p/schedule/new?date=' + c.sel + '">Agendar aula</a>' })) +
          '</main><a class="fab" href="#/p/schedule/new?date=' + c.sel + '" aria-label="Agendar aula">' + icon('plus', 26) + '</a>',
      };
    },
  });
  L.actions.calView = (b) => { cal().view = b.dataset.key; L.router.refresh(); };
  L.actions.calSelect = (b) => { const c = cal(); c.sel = b.dataset.date; c.month = c.sel.slice(0, 7); L.router.refresh(); };
  L.actions.calNav = (b) => {
    const c = cal();
    const [y, m] = c.month.split('-').map(Number);
    const nd = new Date(y, m - 1 + Number(b.dataset.dir), 1);
    c.month = D.iso(nd).slice(0, 7);
    const today = D.todayIso();
    c.sel = today.slice(0, 7) === c.month ? today : D.iso(nd);
    L.router.refresh();
  };
  L.actions.calWeek = (b) => { const c = cal(); c.sel = D.addIso(c.sel, 7 * Number(b.dataset.dir)); c.month = c.sel.slice(0, 7); L.router.refresh(); };

  /* ---------- Tela 29 · Agendar aula (com verificação de conflito) ---------- */
  function workoutOptions(sid) {
    return [{ value: '', label: 'Sem treino definido' }].concat(L.workoutsOf(sid).map((w) => ({ value: w.id, label: w.name })));
  }
  L.route('/p/schedule/new', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const studs = db().students.filter((s) => s.trainerId === tr.id && s.status === 'ativo').sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      const today = D.todayIso();
      const date = ctx.query.date && ctx.query.date >= today ? ctx.query.date : (cal().sel >= today ? cal().sel : today);
      const sid = studs.some((s) => s.id === ctx.query.student) ? ctx.query.student : '';
      const s = student(sid);
      const locs = Array.from(new Set(db().classes.filter((c) => c.trainerId === tr.id).map((c) => c.location)));
      return {
        title: 'Agendar aula', nav: 'personal', tab: 'schedule',
        html: ui.appBar({ title: 'Agendar aula', back: '/p/schedule' }) +
          '<main class="content"><form class="form" data-form="newClass" novalidate><div class="form-alert" hidden></div>' +
          ui.field({ name: 'studentId', label: 'Aluno', type: 'select', value: sid, options: [{ value: '', label: 'Selecione o aluno' }].concat(studs.map((x) => ({ value: x.id, label: x.name }))), attrs: 'data-change="ncStudent"' }) +
          ui.field({ name: 'date', label: 'Data', type: 'date', value: date, attrs: 'min="' + today + '"' }) +
          '<div class="field-row">' + ui.field({ name: 'start', label: 'Início', type: 'time', value: '07:00', attrs: 'step="300" data-input="ncStart"' }) +
          ui.field({ name: 'end', label: 'Término', type: 'time', value: '08:00', attrs: 'step="300" data-input="ncEnd"' }) + '</div>' +
          ui.field({ name: 'location', label: 'Local', icon: 'pin', value: s ? s.gym : '', placeholder: 'Academia ou endereço', attrs: 'list="locList"' }) +
          '<datalist id="locList">' + locs.map((l) => '<option value="' + esc(l) + '">').join('') + '</datalist>' +
          '<div id="ncWorkoutWrap">' + ui.field({ name: 'workoutId', label: 'Treino previsto', type: 'select', optional: true, value: '', options: workoutOptions(sid) }) + '</div>' +
          ui.field({ name: 'notes', label: 'Observações', type: 'textarea', optional: true, placeholder: 'Ex.: levar elástico', attrs: 'rows="2"' }) +
          '<div id="conflictBox" hidden></div>' +
          '<div class="sticky-actions"><button type="submit" class="btn btn-primary btn-block btn-lg">Agendar aula</button></div></form></main>',
      };
    },
  });
  L.changes.ncStudent = (sel) => {
    const f = sel.form;
    const s = student(sel.value);
    const loc = f.querySelector('[name=location]');
    if (s && (!loc.value || loc.dataset.auto === '1')) { loc.value = s.gym || ''; loc.dataset.auto = '1'; }
    document.getElementById('ncWorkoutWrap').innerHTML = ui.field({ name: 'workoutId', label: 'Treino previsto', type: 'select', optional: true, value: '', options: workoutOptions(sel.value) });
  };
  L.inputs.ncStart = (inp) => {
    const end = inp.form.querySelector('[name=end]');
    if (!inp.value) return;
    const sm = D.mins(inp.value);
    if (!end.value || D.mins(end.value) <= sm || end.dataset.auto !== '0') { end.value = D.hm(Math.min(sm + 60, 23 * 60 + 55)); end.dataset.auto = '1'; }
  };
  L.inputs.ncEnd = (inp) => { inp.dataset.auto = '0'; };
  function conflicts(trId, date, s, e, ignoreId) {
    return db().classes.filter((c) => c.trainerId === trId && c.date === date && c.status !== 'cancelada' && c.id !== ignoreId && s < D.mins(c.end) && e > D.mins(c.start));
  }
  L.findSlot = function (trId, date, s, e) {
    const dur = e - s;
    for (let t = Math.max(s, 6 * 60); t + dur <= 22 * 60; t += 15) if (!conflicts(trId, date, t, t + dur).length) return t;
    for (let t = s - 15; t >= 6 * 60; t -= 15) if (!conflicts(trId, date, t, t + dur).length) return t;
    return null;
  };
  L.forms.newClass = async (f) => {
    const tr = L.auth.trainer();
    const box = document.getElementById('conflictBox');
    box.hidden = true;
    box.innerHTML = '';
    const today = D.todayIso();
    const v = L.form.validate(f, [
      ['studentId', (x) => !!x, 'Selecione o aluno.'],
      ['date', (x) => /^\d{4}-\d{2}-\d{2}$/.test(x || ''), 'Informe a data da aula.'],
      ['date', (x) => x >= today, 'A data não pode estar no passado.'],
      ['start', (x) => !!x, 'Informe o horário de início.'],
      ['end', (x, all) => !!x && D.mins(x) > D.mins(all.start), 'O término deve ser depois do início.'],
      ['location', (x) => x && x.length >= 3, 'Informe o local da aula.'],
    ]);
    if (!v) return;
    if (v.date === today && D.mins(v.start) < D.mins(D.nowHm())) {
      L.form.error(f, 'start', 'Esse horário de hoje já passou.');
      L.form.focusFirst(f);
      return;
    }
    const s = D.mins(v.start), e = D.mins(v.end);
    const clash = conflicts(tr.id, v.date, s, e);
    if (clash.length) {
      const c = clash[0];
      const slot = L.findSlot(tr.id, v.date, s, e);
      const who = student(c.studentId);
      box.innerHTML = '<div class="alert alert-warning conflict" role="alert">' + icon('alert', 20) + '<div><strong>Horário ocupado</strong><p>' + c.start + '–' + c.end + ' com ' + esc(who ? who.name : 'outro aluno') + '.' +
        (slot != null ? ' Sugestão: ' + D.hm(slot) + '–' + D.hm(slot + (e - s)) + '.' : ' Não há outro horário livre neste dia.') + '</p>' +
        (slot != null ? '<button type="button" class="btn btn-secondary btn-sm" data-action="useSlot" data-start="' + D.hm(slot) + '" data-end="' + D.hm(slot + (e - s)) + '">Usar horário sugerido</button>' : '') + '</div></div>';
      box.hidden = false;
      L.form.error(f, 'start', '');
      box.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return;
    }
    await ui.busy('Agendando aula…', 700);
    const id = L.uid('c');
    db().classes.push({ id, trainerId: tr.id, studentId: v.studentId, date: v.date, start: v.start, end: v.end, location: v.location, workoutId: v.workoutId || null, notes: v.notes || '', status: 'agendada', completedAt: null, cancelReason: '', cancelNote: '', createdAt: today });
    L.notify(v.studentId, 'class', 'Nova aula agendada para ' + D.wd(v.date) + ', ' + D.short(v.date) + ' às ' + v.start + '.', '/a/classes/' + id);
    save();
    const c = cal();
    c.sel = v.date;
    c.month = v.date.slice(0, 7);
    const st = student(v.studentId);
    ui.sheet({
      title: 'Aula agendada', focusFirst: false,
      body: '<div class="success-head">' + icon('check-circle', 40) + '</div>' +
        '<div class="kv-list">' + ui.kv('Aluno', esc(st.name)) + ui.kv('Data', D.cap(D.long(v.date))) + ui.kv('Horário', v.start + ' – ' + v.end) + ui.kv('Local', esc(v.location)) + '</div>' +
        '<p class="help center">' + esc(L.first(st.name)) + ' recebeu uma notificação com os detalhes.</p>',
      footer: '<button type="button" class="btn btn-primary btn-block" data-action="go" data-to="/p/classes/' + id + '">Ver aula</button><button type="button" class="btn btn-ghost btn-block" data-action="go" data-to="/p/schedule">Voltar à agenda</button>',
    });
  };
  L.actions.useSlot = (b) => {
    const f = b.closest('form');
    f.querySelector('[name=start]').value = b.dataset.start;
    const end = f.querySelector('[name=end]');
    end.value = b.dataset.end;
    end.dataset.auto = '1';
    L.form.clear(f);
    const box = document.getElementById('conflictBox');
    box.hidden = true;
    box.innerHTML = '';
    ui.toast('Horário ajustado para ' + b.dataset.start + '. Confirme o agendamento.', 'info');
    f.querySelector('[type=submit]').focus();
  };

  /* ---------- Tela 30 · Detalhes da aula (personal) ---------- */
  L.route('/p/classes/:id', {
    role: 'personal',
    render(ctx) {
      const tr = L.auth.trainer();
      const c = db().classes.find((x) => x.id === ctx.params.id && x.trainerId === tr.id);
      if (!c) { L.router.replace('/p/schedule'); return null; }
      const cc = cal(); cc.sel = c.date; cc.month = c.date.slice(0, 7);
      const s = student(c.studentId);
      const w = workout(c.workoutId);
      let state = '';
      if (c.status === 'concluida') state = '<div class="alert alert-success">' + icon('check-circle', 18) + '<span>Presença registrada' + (c.completedAt ? ' em ' + D.fmt(c.completedAt.slice(0, 10)) + ' às ' + c.completedAt.slice(11, 16) : '') + '.</span></div>';
      if (c.status === 'cancelada') state = '<div class="alert alert-muted">' + icon('x-circle', 18) + '<span><strong>Aula cancelada</strong> · Motivo: ' + esc(c.cancelReason) + (c.cancelNote ? ' – ' + esc(c.cancelNote) : '') + '</span></div>';
      const actions = c.status === 'agendada'
        ? '<div class="btn-stack"><button type="button" class="btn btn-primary btn-block btn-lg" data-action="classComplete" data-id="' + c.id + '">' + icon('check', 18) + ' Concluir aula</button>' +
          '<button type="button" class="btn btn-outline-danger btn-block" data-action="classCancel" data-id="' + c.id + '">Cancelar aula</button></div>'
        : '<div class="btn-stack"><a class="btn btn-secondary btn-block" href="#/p/schedule/new?student=' + c.studentId + '">' + icon('calendar', 18) + ' ' + (c.status === 'cancelada' ? 'Reagendar aula' : 'Agendar próxima aula') + '</a></div>';
      return {
        title: 'Detalhes da aula', nav: 'personal', tab: 'schedule',
        html: ui.appBar({ title: 'Detalhes da aula', back: '/p/schedule' }) +
          '<main class="content"><section class="profile-head">' + ui.avatar(s ? s.name : '?', 'lg') + '<div class="profile-info"><a class="profile-name link-plain" href="#/p/students/' + c.studentId + '">' + esc(s ? s.name : 'Aluno') + '</a>' +
          '<p class="muted small">Treino previsto: ' + esc(w ? w.name : 'não definido') + '</p><div class="badges">' + ui.badge(c.status) + '</div></div></section>' + state +
          '<div class="kv-list kv-card">' + ui.kv('Data', D.cap(D.long(c.date))) + ui.kv('Horário', c.start + ' – ' + c.end) + ui.kv('Local', esc(c.location)) + (c.notes ? ui.kv('Observações', esc(c.notes)) : '') + '</div>' +
          actions + '<p class="center"><a class="link" href="#/p/chat/' + c.studentId + '">' + icon('message', 16) + ' Abrir chat com o aluno</a></p></main>',
        after() { if (ctx.query.cancel === '1' && c.status === 'agendada') setTimeout(() => L.actions.classCancel({ dataset: { id: c.id } }), 150); },
      };
    },
  });
  L.actions.classComplete = async (b) => {
    const c = db().classes.find((x) => x.id === b.dataset.id);
    const s = student(c.studentId);
    const future = c.date > D.todayIso();
    const ok = await ui.confirm({
      title: 'Concluir aula?',
      text: future ? 'Esta aula está marcada para ' + D.long(c.date) + '. Deseja registrar a presença de ' + L.first(s.name) + ' mesmo assim?' : 'A presença de ' + L.first(s.name) + ' será registrada no histórico.',
      ok: 'Registrar presença',
    });
    if (!ok) return;
    c.status = 'concluida';
    c.completedAt = D.stamp();
    save();
    ui.toast('Aula concluída · presença registrada.');
    L.router.refresh();
  };

  /* ---------- Tela 31 · Cancelar aula (motivo obrigatório) ---------- */
  L.actions.classCancel = (b) => {
    const c = db().classes.find((x) => x.id === b.dataset.id);
    const s = student(c.studentId);
    const opt = (v, t) => '<label class="option-card option-card-sm"><input type="radio" name="reason" value="' + v + '" data-change="cancelReason"><span class="option-radio" aria-hidden="true"></span><span class="option-text"><strong>' + t + '</strong></span></label>';
    ui.sheet({
      title: 'Cancelar aula?', sub: L.first(s.name) + ' será notificado(a) do cancelamento.', focusFirst: false,
      body: '<form class="form" id="cancelForm" data-form="cancelClass" data-id="' + c.id + '" novalidate>' +
        '<p class="small muted">' + D.cap(D.long(c.date)) + ' · ' + c.start + ' – ' + c.end + '</p>' +
        '<fieldset><legend class="label">Motivo</legend><div class="option-list">' + opt('Imprevisto do personal', 'Imprevisto do personal') + opt('Pedido do aluno', 'Pedido do aluno') + opt('Outro', 'Outro') + '</div>' + ui.errSlot('reason') + '</fieldset>' +
        '<div class="reveal" id="cancelNoteWrap" hidden>' + ui.field({ name: 'note', label: 'Descreva o motivo', type: 'textarea', attrs: 'rows="2"' }) + '</div></form>',
      footer: '<button type="submit" form="cancelForm" class="btn btn-danger btn-block">Confirmar cancelamento</button><button type="button" class="btn btn-ghost btn-block" data-action="sheetClose">Voltar</button>',
    });
  };
  L.changes.cancelReason = (r) => { const w = document.getElementById('cancelNoteWrap'); if (w) w.hidden = r.value !== 'Outro'; };
  L.forms.cancelClass = (f) => {
    const v = L.form.validate(f, [
      ['reason', (x) => !!x, 'Selecione o motivo do cancelamento.'],
      ['note', (x, all) => all.reason !== 'Outro' || (x && x.length >= 5), 'Descreva o motivo (mínimo 5 caracteres).'],
    ]);
    if (!v) return;
    const c = db().classes.find((x) => x.id === f.dataset.id);
    const s = student(c.studentId);
    c.status = 'cancelada';
    c.cancelReason = v.reason;
    c.cancelNote = v.reason === 'Outro' ? v.note : '';
    c.cancelledAt = D.stamp();
    L.notify(c.studentId, 'cancel', 'Aula de ' + D.wd(c.date) + ', ' + D.short(c.date) + ' às ' + c.start + ' cancelada pelo personal. Motivo: ' + (c.cancelNote || c.cancelReason) + '.', '/a/classes/' + c.id);
    save();
    ui.closeSheet();
    ui.toast('Aula cancelada. ' + L.first(s.name) + ' foi notificado(a).', 'info');
    L.router.refresh();
  };

  /* ======================= Área do Aluno ======================= */

  /* ---------- Telas 08 e 32 · Agenda do aluno ---------- */
  function acal() { if (!ui.state.acal) ui.state.acal = { sel: D.todayIso() }; return ui.state.acal; }
  L.route('/a/agenda', {
    role: 'student',
    render() {
      const s = L.auth.student();
      const tr = L.auth.trainer();
      L.billing.refresh();
      const today = D.todayIso();
      const now = D.nowHm();
      const mine = db().classes.filter((c) => c.studentId === s.id);
      const next = mine.filter((c) => c.status === 'agendada' && (c.date > today || (c.date === today && c.end >= now))).sort(L.byDateTime)[0];
      const notifs = db().notifications.filter((n) => n.to === s.id);
      const unread = notifs.filter((n) => !n.read);
      const classNotif = unread.find((n) => n.type === 'class');
      const cancelNotif = unread.find((n) => n.type === 'cancel');
      const tw = L.todayWorkout(s.id);
      const urgent = L.billing.urgent(s.id)[0];
      const sel = acal().sel;
      const dayList = mine.filter((c) => c.date === sel).sort(L.byDateTime);
      const nw = next && workout(next.workoutId);
      let banners = '';
      if (classNotif) banners += '<button type="button" class="banner banner-dashed" data-action="openNotif" data-id="' + classNotif.id + '">' + icon('calendar', 20) + '<span><strong>Nova aula agendada</strong><small>Toque para ver os detalhes</small></span>' + icon('chevron-right', 18) + '</button>';
      if (cancelNotif) banners += '<button type="button" class="banner banner-muted" data-action="openNotif" data-id="' + cancelNotif.id + '">' + icon('x-circle', 20) + '<span><strong>Uma aula foi cancelada</strong><small>Toque para ver o motivo</small></span>' + icon('chevron-right', 18) + '</button>';
      if (!s.anamnese) banners += '<a class="banner banner-primary" href="#/a/anamnese">' + icon('clipboard', 20) + '<span><strong>Preencha sua anamnese</strong><small>Seu personal precisa dela para montar treinos seguros</small></span>' + icon('chevron-right', 18) + '</a>';
      return {
        title: 'Agenda', nav: 'student', tab: 'agenda',
        html: '<header class="home-head"><div><p class="home-date">Personal: ' + esc(tr.name) + '</p><h1 class="home-hello">Olá, ' + esc(L.first(s.name)) + '</h1></div>' +
          '<div class="head-actions"><a class="icon-btn icon-btn-bell" href="#/a/notifications" aria-label="Notificações' + (unread.length ? ', ' + unread.length + ' não lidas' : '') + '">' + icon('bell') + (unread.length ? '<span class="bell-badge" aria-hidden="true">' + unread.length + '</span>' : '') + '</a>' +
          '<a class="avatar-link" href="#/a/profile" aria-label="Meu perfil">' + ui.avatar(s.name, 'md') + '</a></div></header>' +
          '<main class="content">' + banners +
          (next ? '<a class="card card-next" href="#/a/classes/' + next.id + '"><div class="row-between"><span class="eyebrow">Próxima aula</span>' + ui.badge(next.status) + '</div>' +
            '<p class="next-when">' + D.relative(next.date) + ' · ' + next.start + '</p>' +
            '<p class="next-meta">' + icon('pin', 16) + esc(next.location) + '</p>' + (nw ? '<p class="next-meta">' + icon('dumbbell', 16) + esc(nw.name) + '</p>' : '') + '</a>'
            : '<div class="card card-rest">' + icon('calendar', 22) + '<div><strong>Nenhuma aula agendada</strong><p class="small muted">Combine um horário com ' + esc(L.first(tr.name)) + ' pelo chat.</p></div></div>') +
          (tw ? '<a class="card card-dashed" href="#/a/workouts/' + tw.id + '"><span>' + icon('dumbbell', 18) + ' Treino do dia · <strong>' + esc(tw.name) + '</strong></span>' + icon('chevron-right', 18) + '</a>'
            : '<div class="card card-dashed is-static"><span>' + icon('moon', 18) + ' Hoje é dia de descanso</span></div>') +
          (urgent ? '<a class="banner banner-' + (urgent.status === 'atrasado' ? 'danger' : urgent.awaiting ? 'info' : 'warning') + '" href="#/a/billing">' + icon('wallet', 20) + '<span><strong>' + esc(urgent.desc) + ' · ' + (urgent.awaiting ? 'aguardando confirmação' : urgent.status === 'atrasado' ? 'em atraso' : 'pendente') + '</strong><small>' + L.money(urgent.amount) + ' · vence ' + D.short(urgent.due) + '</small></span>' + icon('chevron-right', 18) + '</a>' : '') +
          weekStrip(mine, sel, 'acalSelect', 'acalWeek') +
          '<div class="section-head"><h2 class="section-title">' + (sel === today ? 'Aulas de hoje' : D.cap(D.long(sel))) + '</h2></div>' +
          (dayList.length ? '<ul class="list">' + dayList.map((c) => L.views.classItem(c, { href: '/a/classes/' + c.id, forStudent: true })).join('') + '</ul>' : '<p class="muted small">Nenhuma aula neste dia.</p>') +
          '<a class="btn btn-ghost btn-block" href="#/a/history">' + icon('history', 18) + ' Ver histórico de aulas</a></main>',
      };
    },
  });
  L.actions.acalSelect = (b) => { acal().sel = b.dataset.date; L.router.refresh(); };
  L.actions.acalWeek = (b) => { const a = acal(); a.sel = D.addIso(a.sel, 7 * Number(b.dataset.dir)); L.router.refresh(); };

  /* ---------- Telas 33 e 34 · Detalhes da aula (agendada ou cancelada) ---------- */
  L.route('/a/classes/:id', {
    role: 'student',
    render(ctx) {
      const s = L.auth.student();
      const tr = L.auth.trainer();
      const c = db().classes.find((x) => x.id === ctx.params.id && x.studentId === s.id);
      if (!c) { L.router.replace('/a/agenda'); return null; }
      let changed = false;
      db().notifications.forEach((n) => { if (n.to === s.id && !n.read && n.link === '/a/classes/' + c.id) { n.read = true; changed = true; } });
      if (changed) save();
      const w = workout(c.workoutId);
      const cancelled = c.status === 'cancelada';
      return {
        title: 'Detalhes da aula', nav: 'student', tab: 'agenda',
        html: ui.appBar({ title: 'Detalhes da aula', back: '/a/agenda' }) +
          '<main class="content' + (cancelled ? ' is-cancelled' : '') + '">' + ui.badge(c.status) +
          '<h2 class="class-when">' + D.cap(D.long(c.date)) + '</h2><p class="class-time">' + c.start + ' – ' + c.end + '</p>' +
          (cancelled ? '<div class="alert alert-muted">' + icon('x-circle', 18) + '<div><strong>Aula cancelada pelo personal</strong><p>Motivo: ' + esc(c.cancelReason) + (c.cancelNote ? ' – ' + esc(c.cancelNote) : '') + '</p></div></div>' : ui.map()) +
          '<div class="kv-list kv-card">' + ui.kv('Local', esc(c.location)) + ui.kv('Personal', esc(tr.name)) + (w ? ui.kv('Treino', esc(w.name)) : '') + (c.notes && !cancelled ? ui.kv('Observações', esc(c.notes)) : '') + '</div>' +
          (c.status === 'concluida' ? '<div class="alert alert-success">' + icon('check-circle', 18) + '<span>Presença registrada pelo personal.</span></div>' : '') +
          '<div class="btn-stack"><a class="btn btn-secondary btn-block" href="#/a/chat">' + icon('message', 18) + ' Falar com o professor</a>' +
          (cancelled ? '<a class="btn btn-primary btn-block" href="#/a/agenda">Voltar à agenda</a>' : (w && c.status === 'agendada' ? '<a class="btn btn-ghost btn-block" href="#/a/workouts/' + w.id + '">Ver treino previsto</a>' : '')) + '</div>' +
          (cancelled ? '' : '<p class="help center">Remarcações são combinadas pelo chat.</p>') + '</main>',
      };
    },
  });

  /* ---------- Histórico de aulas do aluno ---------- */
  L.route('/a/history', {
    role: 'student',
    render() {
      const s = L.auth.student();
      const past = db().classes.filter((c) => c.studentId === s.id && (c.status !== 'agendada' || c.date < D.todayIso())).sort((a, b) => -L.byDateTime(a, b));
      const done = past.filter((c) => c.status === 'concluida').length;
      const canc = past.filter((c) => c.status === 'cancelada').length;
      const rate = done + canc ? Math.round((done / (done + canc)) * 100) : 0;
      return {
        title: 'Histórico de aulas', nav: 'student', tab: 'agenda',
        html: ui.appBar({ title: 'Histórico de aulas', back: '/a/agenda' }) + '<main class="content">' +
          '<div class="stats-3"><div class="stat stat-static"><span class="stat-value">' + done + '</span><span class="stat-label">Concluídas</span></div>' +
          '<div class="stat stat-static"><span class="stat-value">' + canc + '</span><span class="stat-label">Canceladas</span></div>' +
          '<div class="stat stat-static"><span class="stat-value">' + rate + '%</span><span class="stat-label">Frequência</span></div></div>' +
          (past.length ? '<ul class="list">' + past.map((c) => L.views.classItem(c, { href: '/a/classes/' + c.id, forStudent: true, showDate: true })).join('') + '</ul>' : ui.empty({ icon: 'history', title: 'Nenhuma aula no histórico' })) + '</main>',
      };
    },
  });
})();
