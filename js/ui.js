/* LIFT – componentes de interface, formulários, máscaras e feedback visual */
(function () {
  'use strict';
  const L = window.LIFT;

  L.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  L.actions = {};
  L.forms = {};
  L.inputs = {};
  L.changes = {};
  L.views = {};
  const esc = L.esc;
  const icon = (n, s, c) => L.icon(n, s, c);

  const ui = (L.ui = { state: {} });

  function hash(s) { let h = 7; String(s).split('').forEach((ch) => { h = (h * 31 + ch.charCodeAt(0)) >>> 0; }); return h; }
  L.hash = hash;

  /* ---------- Estrutura de tela ---------- */
  ui.appBar = function (o) {
    o = o || {};
    const left = o.back
      ? '<a class="icon-btn" href="#' + o.back + '" aria-label="Voltar">' + icon('chevron-left', 22) + '</a>'
      : (o.left || '<span class="icon-btn-spacer" aria-hidden="true"></span>');
    return '<header class="appbar">' + left +
      '<div class="appbar-titles"><h1 class="appbar-title">' + esc(o.title || '') + '</h1>' + (o.sub ? '<p class="appbar-sub">' + esc(o.sub) + '</p>' : '') + '</div>' +
      '<div class="appbar-right">' + (o.right || '<span class="icon-btn-spacer" aria-hidden="true"></span>') + '</div></header>';
  };

  const NAV = {
    personal: [['home', 'Início', '/p/home', 'home'], ['students', 'Alunos', '/p/students', 'users'], ['schedule', 'Agenda', '/p/schedule', 'calendar'], ['chat', 'Chat', '/p/chat', 'message'], ['profile', 'Perfil', '/p/profile', 'user']],
    student: [['agenda', 'Agenda', '/a/agenda', 'calendar'], ['workouts', 'Treinos', '/a/workouts', 'dumbbell'], ['chat', 'Chat', '/a/chat', 'message'], ['profile', 'Perfil', '/a/profile', 'user']],
    admin: [['home', 'Início', '/admin', 'grid'], ['users', 'Usuários', '/admin/users', 'users'], ['plans', 'Planos', '/admin/plans', 'layers'], ['account', 'Conta', '/admin/account', 'user']],
  };
  ui.bottomNav = function (role, active) {
    const badges = (ui.navBadges && ui.navBadges(role)) || {};
    return '<nav class="bottom-nav" aria-label="Navegação principal">' + NAV[role].map(([k, label, href, ic]) =>
      '<a class="nav-item' + (k === active ? ' is-active' : '') + '" href="#' + href + '"' + (k === active ? ' aria-current="page"' : '') + '>' +
      '<span class="nav-icon">' + icon(ic, 22) + (badges[k] ? '<span class="nav-dot"></span>' : '') + '</span>' +
      '<span>' + label + (badges[k] ? '<span class="sr-only"> (' + badges[k] + ' novas)</span>' : '') + '</span></a>').join('') + '</nav>';
  };

  ui.steps = function (cur, total, label, right) {
    return '<div class="steps"><div class="steps-top"><span>Etapa ' + cur + ' de ' + total + (label ? ' · ' + esc(label) : '') + '</span>' + (right || '') + '</div>' + ui.bar((cur / total) * 100) + '</div>';
  };

  /* ---------- Elementos ---------- */
  ui.avatar = function (name, size, src) {
    const parts = String(name || '?').trim().split(/\s+/);
    const ini = ((parts[0] || '?')[0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
    const h = [272, 222, 190, 330, 28, 152, 292][hash(name) % 7];
    if (src) return '<span class="avatar avatar-' + (size || 'md') + '"><img src="' + src + '" alt=""></span>';
    return '<span class="avatar avatar-' + (size || 'md') + '" style="--h:' + h + '" aria-hidden="true">' + esc(ini) + '</span>';
  };

  const BADGES = {
    agendada: ['Agendada', 'primary'], concluida: ['Concluída', 'success'], cancelada: ['Cancelada', 'muted'],
    pendente: ['Pendente', 'warning'], atrasado: ['Atrasado', 'danger'], pago: ['Pago', 'success'], aguardando: ['Aguardando confirmação', 'info'],
    trial: ['Em trial', 'info'], ativa: ['Ativa', 'success'], cancelada_plano: ['Cancelada', 'muted'], sem_plano: ['Sem plano', 'muted'],
    ativo: ['Ativo', 'success'], inativo: ['Inativo', 'muted'], novo: ['Novo', 'primary'],
    personal: ['Personal', 'primary'], student: ['Aluno', 'info'], admin: ['Admin', 'muted'],
    preenchida: ['Preenchida', 'success'], pendente_doc: ['Pendente', 'warning'],
  };
  ui.badge = function (k, label) { const b = BADGES[k] || [k, 'muted']; return '<span class="badge badge-' + b[1] + '">' + esc(label || b[0]) + '</span>'; };
  ui.bar = function (pct, cls) {
    const p = Math.max(0, Math.min(100, pct || 0));
    return '<div class="bar' + (cls ? ' ' + cls : '') + '" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(p) + '"><span style="width:' + p + '%"></span></div>';
  };
  ui.kv = function (k, v) { return '<div class="kv"><span>' + esc(k) + '</span><strong>' + v + '</strong></div>'; };
  ui.empty = function (o) {
    return '<div class="empty">' + (o.icon ? '<div class="empty-icon">' + icon(o.icon, 26) + '</div>' : '') +
      '<p class="empty-title">' + esc(o.title) + '</p>' + (o.text ? '<p class="empty-text">' + esc(o.text) + '</p>' : '') + (o.action || '') + '</div>';
  };
  ui.chips = function (items, active, action) {
    return '<div class="chips" role="group">' + items.map((it) =>
      '<button type="button" class="chip' + (it.key === active ? ' is-active' : '') + '" data-action="' + action + '" data-key="' + esc(it.key) + '" aria-pressed="' + (it.key === active) + '">' +
      esc(it.label) + (it.count != null ? ' <span class="chip-count">' + it.count + '</span>' : '') + '</button>').join('') + '</div>';
  };
  ui.segLinks = function (items, active) {
    return '<div class="segmented" role="tablist">' + items.map((it) =>
      '<a role="tab" class="seg-item' + (it.key === active ? ' is-active' : '') + '" href="#' + it.href + '" aria-selected="' + (it.key === active) + '">' + esc(it.label) + '</a>').join('') + '</div>';
  };
  ui.segButtons = function (items, active, action) {
    return '<div class="segmented" role="group">' + items.map((it) =>
      '<button type="button" class="seg-item' + (it.key === active ? ' is-active' : '') + '" data-action="' + action + '" data-key="' + esc(it.key) + '" aria-pressed="' + (it.key === active) + '">' + esc(it.label) + '</button>').join('') + '</div>';
  };
  ui.exThumb = function (group) {
    const map = { Peito: 272, Costas: 222, Pernas: 152, Ombros: 28, Braços: 330, Core: 190 };
    return '<span class="ex-thumb" style="--h:' + (map[group] || 260) + '" aria-hidden="true">' + icon(group === 'Core' ? 'activity' : 'dumbbell', 18) + '</span>';
  };
  ui.errorScreen = function () {
    return ui.appBar({ title: 'Algo deu errado', back: '/' }) + '<main class="content">' + ui.empty({ icon: 'alert', title: 'Não foi possível abrir esta tela', text: 'Tente novamente ou volte ao início.', action: '<a class="btn btn-secondary btn-sm" href="#/">Voltar ao início</a>' }) + '</main>';
  };

  /* ---------- Gráfico de linha ---------- */
  ui.lineChart = function (points, o) {
    o = o || {};
    if (!points || !points.length) return '';
    const W = 320, H = o.height || 140, PL = 10, PR = 10, PT = 18, PB = 24;
    const vals = points.map((p) => p.value);
    let min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (min === max) { min -= 1; max += 1; }
    const pad = (max - min) * 0.2; min -= pad; max += pad;
    const x = (i) => PL + (points.length === 1 ? (W - PL - PR) / 2 : (i * (W - PL - PR)) / (points.length - 1));
    const yv = (v) => PT + (H - PT - PB) * (1 - (v - min) / (max - min));
    const pts = points.map((p, i) => [x(i), yv(p.value)]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (H - PB) + ' L' + pts[0][0].toFixed(1) + ' ' + (H - PB) + ' Z';
    const gid = 'g' + Math.random().toString(36).slice(2, 8);
    const last = points[points.length - 1];
    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(o.label || 'Gráfico') + '. Último valor: ' + esc(L.num(last.value, 1) + (o.unit || '')) + '">';
    s += '<defs><linearGradient id="' + gid + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#BF5AF2" stop-opacity=".30"/><stop offset="1" stop-color="#BF5AF2" stop-opacity="0"/></linearGradient></defs>';
    [0, 1, 2].forEach((k) => { const yy = PT + (k * (H - PT - PB)) / 2; s += '<line x1="' + PL + '" x2="' + (W - PR) + '" y1="' + yy + '" y2="' + yy + '" class="chart-grid"/>'; });
    s += '<path d="' + area + '" fill="url(#' + gid + ')"/><path d="' + line + '" class="chart-line"/>';
    pts.forEach((p, i) => { s += '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === pts.length - 1 ? 4.5 : 3) + '" class="chart-dot' + (i === pts.length - 1 ? ' is-last' : '') + '"/>'; });
    const lp = pts[pts.length - 1];
    s += '<text x="' + Math.min(lp[0], W - 30).toFixed(1) + '" y="' + Math.max(lp[1] - 10, 12).toFixed(1) + '" text-anchor="middle" class="chart-value">' + esc(L.num(last.value, 1) + (o.unit || '')) + '</text>';
    points.forEach((p, i) => { s += '<text x="' + x(i).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + (i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle') + '" class="chart-x">' + esc(p.label) + '</text>'; });
    return s + '</svg>';
  };

  /* ---------- Imagens ilustrativas ---------- */
  ui.photo = function (p, alt) {
    if (p.src) return '<img src="' + p.src + '" alt="' + esc(alt) + '" loading="lazy">';
    const h = [272, 222, 300][hash(p.id) % 3];
    const body = p.angle === 'lado'
      ? '<path d="M48 160c0-52 2-82 14-88 9 4 12 34 12 88z" fill="hsl(' + h + ' 28% 30%)"/><circle cx="62" cy="46" r="15" fill="hsl(' + h + ' 30% 36%)"/>'
      : '<path d="M28 160c0-58 12-88 32-88s32 30 32 88z" fill="hsl(' + h + ' 28% 30%)"/><circle cx="60" cy="46" r="16" fill="hsl(' + h + ' 30% 36%)"/>';
    return '<svg viewBox="0 0 120 160" role="img" aria-label="' + esc(alt) + '"><rect width="120" height="160" fill="hsl(' + h + ' 22% 15%)"/>' + body + '</svg>';
  };
  ui.qr = function (seed) {
    const n = 25;
    let h = hash(seed) || 1;
    const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
    let cells = '';
    for (let yy = 0; yy < n; yy++) {
      for (let xx = 0; xx < n; xx++) {
        const inF = (xx < 8 && yy < 8) || (xx >= n - 8 && yy < 8) || (xx < 8 && yy >= n - 8);
        if (!inF && rnd() > 0.5) cells += '<rect x="' + xx + '" y="' + yy + '" width="1" height="1"/>';
      }
    }
    const F = (fx, fy) => '<rect x="' + fx + '" y="' + fy + '" width="7" height="7"/><rect x="' + (fx + 1) + '" y="' + (fy + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (fx + 2) + '" y="' + (fy + 2) + '" width="3" height="3"/>';
    return '<svg class="qr" viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" role="img" aria-label="QR Code para pagamento via PIX" shape-rendering="crispEdges"><rect x="-2" y="-2" width="' + (n + 4) + '" height="' + (n + 4) + '" fill="#fff"/><g fill="#111">' + cells + F(0, 0) + F(n - 7, 0) + F(0, n - 7) + '</g></svg>';
  };
  ui.map = function () {
    return '<div class="map" aria-hidden="true"><svg viewBox="0 0 320 140" preserveAspectRatio="xMidYMid slice"><rect width="320" height="140" fill="#18181C"/>' +
      '<path d="M-10 96 C60 80 120 112 190 88 S300 60 340 74" stroke="#26262C" stroke-width="14" fill="none"/>' +
      '<path d="M70 -10 L104 150 M230 -10 L206 150 M-10 34 L330 46" stroke="#232328" stroke-width="8" fill="none"/>' +
      '<rect x="120" y="14" width="56" height="34" rx="6" fill="#1F2A22"/><rect x="246" y="92" width="50" height="30" rx="6" fill="#1F2A22"/></svg>' +
      '<span class="map-pin">' + icon('pin', 22) + '</span></div>';
  };

  /* ---------- Toast ---------- */
  ui.toast = function (msg, type) {
    type = type || 'success';
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    const ic = { success: 'check-circle', error: 'x-circle', info: 'info', warning: 'alert' }[type] || 'info';
    el.innerHTML = icon(ic, 18) + '<span>' + esc(msg) + '</span>';
    root.appendChild(el);
    while (root.children.length > 2) root.removeChild(root.firstChild);
    requestAnimationFrame(() => el.classList.add('is-in'));
    setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 260); }, 3000);
  };

  /* ---------- Bottom sheet / modal ---------- */
  let sheetOnClose = null;
  let lastFocus = null;
  ui.sheet = function (o) {
    const root = document.getElementById('sheet-root');
    if (root.classList.contains('is-open')) { const cb = sheetOnClose; sheetOnClose = null; if (cb) cb(); }
    else lastFocus = document.activeElement;
    sheetOnClose = o.onClose || null;
    root.innerHTML = '<div class="sheet-backdrop" data-action="sheetClose"></div>' +
      '<div class="sheet' + (o.cls ? ' ' + o.cls : '') + '" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">' +
      '<div class="sheet-handle" aria-hidden="true"></div>' +
      '<div class="sheet-head"><div><h2 id="sheet-title" class="sheet-title">' + esc(o.title || '') + '</h2>' + (o.sub ? '<p class="sheet-sub">' + esc(o.sub) + '</p>' : '') + '</div>' +
      '<button type="button" class="icon-btn icon-btn-sm" data-action="sheetClose" aria-label="Fechar">' + icon('x', 18) + '</button></div>' +
      '<div class="sheet-body">' + (o.body || '') + '</div>' + (o.footer ? '<div class="sheet-foot">' + o.footer + '</div>' : '') + '</div>';
    root.classList.add('is-open');
    const sheet = root.querySelector('.sheet');
    if (o.onMount) o.onMount(sheet);
    setTimeout(() => {
      const first = o.focusFirst !== false && sheet.querySelector('input:not([type=hidden]):not([type=radio]):not([type=checkbox]):not(.sr-only), select, textarea');
      try { (first || sheet).focus({ preventScroll: true }); } catch (e) { /* noop */ }
    }, 80);
  };
  ui.closeSheet = function () {
    const root = document.getElementById('sheet-root');
    if (!root || !root.classList.contains('is-open')) return;
    root.classList.remove('is-open');
    root.innerHTML = '';
    const cb = sheetOnClose;
    sheetOnClose = null;
    if (cb) cb();
    if (lastFocus && document.contains(lastFocus)) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* noop */ } }
  };
  ui.sheetOpen = () => document.getElementById('sheet-root').classList.contains('is-open');

  let confirmRes = null;
  ui.confirm = function (o) {
    return new Promise((res) => {
      ui.sheet({
        title: o.title, focusFirst: false,
        body: '<p class="sheet-text">' + esc(o.text || '') + '</p>' + (o.extra || ''),
        footer: '<button type="button" class="btn ' + (o.danger ? 'btn-danger' : 'btn-primary') + ' btn-block" data-action="confirmOk">' + esc(o.ok || 'Confirmar') + '</button>' +
          '<button type="button" class="btn btn-ghost btn-block" data-action="confirmCancel">' + esc(o.cancel || 'Cancelar') + '</button>',
        onClose: () => { if (confirmRes) { const r = confirmRes; confirmRes = null; r(false); } },
      });
      confirmRes = res;
      setTimeout(() => { const b = document.querySelector('[data-action="confirmOk"]'); if (b) b.focus(); }, 90);
    });
  };
  L.actions.confirmOk = () => { const r = confirmRes; confirmRes = null; ui.closeSheet(); if (r) r(true); };
  L.actions.confirmCancel = () => ui.closeSheet();
  L.actions.sheetClose = () => ui.closeSheet();

  /* ---------- Carregamento simulado ---------- */
  ui.busy = function (text, ms) {
    const root = document.getElementById('busy-root');
    root.innerHTML = '<div class="busy" role="status" aria-live="assertive"><div class="spinner" aria-hidden="true"></div><p>' + esc(text || 'Carregando…') + '</p></div>';
    root.classList.add('is-on');
    return new Promise((r) => setTimeout(() => { root.classList.remove('is-on'); root.innerHTML = ''; r(); }, ms || 800));
  };

  /* ---------- Campos de formulário ---------- */
  let fid = 0;
  ui.field = function (o) {
    const id = 'f' + (++fid);
    const eid = id + '-e';
    const type = o.type || 'text';
    const describedBy = eid + (o.help ? ' ' + id + '-h' : '');
    const common = 'id="' + id + '" name="' + esc(o.name) + '" aria-describedby="' + describedBy + '" ' + (o.attrs || '');
    let control;
    if (type === 'textarea') {
      control = '<textarea class="input textarea" ' + common + ' placeholder="' + esc(o.placeholder || '') + '">' + esc(o.value || '') + '</textarea>';
    } else if (type === 'select') {
      control = '<div class="select-wrap"><select class="input select" ' + common + '>' + o.options.map((op) =>
        '<option value="' + esc(op.value) + '"' + (String(op.value) === String(o.value == null ? '' : o.value) ? ' selected' : '') + (op.disabled ? ' disabled' : '') + '>' + esc(op.label) + '</option>').join('') +
        '</select>' + icon('chevron-down', 18, 'select-caret') + '</div>';
    } else {
      control = '<div class="input-wrap' + (o.prefix ? ' has-prefix' : '') + '">' + (o.icon ? icon(o.icon, 18, 'input-icon') : '') +
        (o.prefix ? '<span class="input-prefix">' + esc(o.prefix) + '</span>' : '') +
        '<input class="input' + (o.icon ? ' has-icon' : '') + (o.toggle ? ' has-toggle' : '') + '" type="' + type + '" ' + common +
        ' value="' + esc(o.value == null ? '' : o.value) + '" placeholder="' + esc(o.placeholder || '') + '"' + (o.mask ? ' data-mask="' + o.mask + '"' : '') + '>' +
        (o.toggle ? '<button type="button" class="input-toggle" data-action="togglePassword" aria-label="Mostrar senha" aria-pressed="false">' + icon('eye', 18) + '</button>' : '') +
        (o.suffix ? '<span class="input-suffix">' + esc(o.suffix) + '</span>' : '') + '</div>';
    }
    return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"><label class="label" for="' + id + '">' + esc(o.label) + (o.optional ? ' <span class="label-opt">(opcional)</span>' : '') + '</label>' +
      control + (o.help ? '<p class="help" id="' + id + '-h">' + esc(o.help) + '</p>' : '') +
      '<p class="field-error" id="' + eid + '" data-err="' + esc(o.name) + '" hidden></p></div>';
  };
  ui.errSlot = (name) => '<p class="field-error" data-err="' + esc(name) + '" hidden></p>';
  ui.pwReq = function (withMatch) {
    return '<ul class="pw-req" data-pwreq aria-label="Requisitos da senha">' +
      '<li data-req="len">8 ou mais caracteres</li><li data-req="upper">Uma letra maiúscula</li><li data-req="num">Um número</li>' +
      (withMatch ? '<li data-req="match">As senhas coincidem</li>' : '') + '</ul>';
  };
  L.actions.togglePassword = (btn) => {
    const inp = btn.parentElement.querySelector('input');
    const show = inp.type === 'password';
    inp.type = show ? 'text' : 'password';
    btn.setAttribute('aria-pressed', String(show));
    btn.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    btn.innerHTML = icon(show ? 'eye-off' : 'eye', 18);
  };
  L.inputs.pwReq = (inp) => {
    const f = inp.form;
    const pw = f.querySelector('[name=password]');
    const v = pw ? pw.value : '';
    const ul = f.querySelector('[data-pwreq]');
    if (!ul) return;
    const set = (k, ok) => { const li = ul.querySelector('[data-req="' + k + '"]'); if (li) li.classList.toggle('is-ok', ok); };
    set('len', v.length >= 8);
    set('upper', /[A-Z]/.test(v));
    set('num', /\d/.test(v));
    const c = f.querySelector('[name=confirm]');
    if (c) set('match', !!v && v === c.value);
    const sub = f.querySelector('[data-pw-submit]');
    if (sub) sub.disabled = !(L.valid.pw(v) && (!c || v === c.value));
  };

  L.valid = {
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim()),
    required: (v) => !!(v && String(v).trim()),
    pw: (v) => !!v && v.length >= 8 && /[A-Z]/.test(v) && /\d/.test(v),
    luhn(num) {
      const d = String(num).replace(/\D/g, '');
      if (d.length < 13 || d.length > 19) return false;
      let sum = 0;
      for (let i = 0; i < d.length; i++) {
        let n = Number(d[d.length - 1 - i]);
        if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
        sum += n;
      }
      return sum % 10 === 0;
    },
  };

  L.form = {
    values(f) {
      const o = {};
      new FormData(f).forEach((v, k) => {
        const val = typeof v === 'string' ? v.trim() : v;
        if (k in o) o[k] = [].concat(o[k], val); else o[k] = val;
      });
      return o;
    },
    clear(f) {
      f.querySelectorAll('[aria-invalid="true"]').forEach((e) => { e.removeAttribute('aria-invalid'); e.classList.remove('is-invalid'); });
      f.querySelectorAll('.field-error').forEach((e) => { e.hidden = true; e.textContent = ''; });
      const a = f.querySelector('.form-alert');
      if (a) { a.hidden = true; a.innerHTML = ''; }
    },
    error(f, name, msg) {
      f.querySelectorAll('[name="' + name + '"]').forEach((el) => { el.setAttribute('aria-invalid', 'true'); el.classList.add('is-invalid'); });
      const er = f.querySelector('[data-err="' + name + '"]');
      if (er && msg) { er.textContent = msg; er.hidden = false; }
    },
    alert(f, msg, type) {
      const a = f.querySelector('.form-alert');
      if (!a) { ui.toast(msg, 'error'); return; }
      a.className = 'form-alert alert alert-' + (type || 'error');
      a.setAttribute('role', 'alert');
      a.innerHTML = icon(type === 'success' ? 'check-circle' : type === 'info' ? 'info' : 'alert', 18) + '<span>' + esc(msg) + '</span>';
      a.hidden = false;
    },
    focusFirst(f) { const el = f.querySelector('[aria-invalid="true"]'); if (el) el.focus(); },
    validate(f, rules) {
      L.form.clear(f);
      const v = L.form.values(f);
      const bad = {};
      rules.forEach(([name, test, msg]) => {
        if (bad[name]) return;
        if (!test(v[name], v)) { bad[name] = true; L.form.error(f, name, msg); }
      });
      if (Object.keys(bad).length) { L.form.focusFirst(f); return null; }
      return v;
    },
  };

  /* ---------- Máscaras ---------- */
  L.mask = {
    phone(v) {
      const d = v.replace(/\D/g, '').slice(0, 11);
      if (!d) return '';
      if (d.length <= 2) return '(' + d;
      if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    },
    card: (v) => v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 '),
    exp(v) { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d; },
    cvv: (v) => v.replace(/\D/g, '').slice(0, 4),
    money(v) {
      const d = v.replace(/\D/g, '').replace(/^0+/, '').slice(0, 8);
      if (!d) return '';
      return (Number(d) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    int: (v) => v.replace(/\D/g, '').slice(0, 3),
    code: (v) => v.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(-1),
    cadence: (v) => v.replace(/[^0-9-]/g, '').slice(0, 9),
    decimal: (v) => v.replace(/[^0-9,.]/g, '').replace('.', ',').replace(/,(?=.*,)/g, '').slice(0, 6),
    pct: (v) => v.replace(/\D/g, '').slice(0, 2),
  };
  L.parseMoney = (s) => Number(String(s || '').replace(/\./g, '').replace(',', '.')) || 0;
  L.parseDec = (s) => Number(String(s == null ? '' : s).replace(',', '.')) || 0;
  L.fmtDec = (n) => (n || n === 0 ? String(n).replace('.', ',') : '');
  L.fmtMoneyInput = (n) => (n ? Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');

  /* ---------- Utilidades ---------- */
  L.copy = function (text, msg) {
    const done = () => ui.toast(msg || 'Copiado!', 'success');
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { ui.toast('Não foi possível copiar.', 'error'); }
      ta.remove();
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  };
  L.actions.copy = (el) => L.copy(el.dataset.text, el.dataset.msg);
  L.actions.go = (el) => L.router.go(el.dataset.to);

  L.readImage = function (file, max) {
    return new Promise((res, rej) => {
      if (!file || !/^image\//.test(file.type)) { rej(new Error('Arquivo não é uma imagem')); return; }
      const fr = new FileReader();
      fr.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, (max || 360) / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s);
          c.height = Math.round(img.height * s);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = rej;
        img.src = fr.result;
      };
      fr.onerror = rej;
      fr.readAsDataURL(file);
    });
  };

  L.first = (name) => String(name || '').split(' ')[0];
  L.byDateTime = (a, b) => (a.date + a.start < b.date + b.start ? -1 : a.date + a.start > b.date + b.start ? 1 : 0);
  L.notify = function (to, type, text, link) {
    L.store.db.notifications.unshift({ id: L.uid('n'), to, type, text, date: L.d.todayIso(), read: false, link: link || '' });
  };
})();
